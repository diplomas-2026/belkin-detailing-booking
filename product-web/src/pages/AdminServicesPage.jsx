import { useEffect, useState } from 'react'
import api from '../api'
import Field from '../components/ui/Field'

const initial = { workshopId: '', name: '', description: '', durationMinutes: 60, price: 2000, active: true }
const initialItem = { kind: 'OPTIONAL', name: '', description: '', price: 0, choiceGroupKey: '', defaultSelected: false, sortOrder: 0 }

export default function AdminServicesPage() {
  const [workshops, setWorkshops] = useState([])
  const [services, setServices] = useState([])
  const [form, setForm] = useState(initial)
  const [selectedServiceId, setSelectedServiceId] = useState(null)
  const [items, setItems] = useState([])
  const [itemForm, setItemForm] = useState(initialItem)
  const [choiceGroupMode, setChoiceGroupMode] = useState('none') // none | preset | custom
  const [choiceGroupPreset, setChoiceGroupPreset] = useState('')
  const [choiceGroupCustom, setChoiceGroupCustom] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    api.get('/admin/workshops').then((r) => setWorkshops(r.data)).catch(() => api.get('/workshops').then((r) => setWorkshops(r.data)))
    api.get('/admin/services').then((r) => setServices(r.data)).catch(() => api.get('/services').then((r) => setServices(r.data)))
  }

  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      await api.post('/admin/services', {
        ...form,
        workshopId: Number(form.workshopId),
        durationMinutes: Number(form.durationMinutes),
        price: Number(form.price),
      })
      setForm(initial)
      await load()
    } finally {
      setBusy(false)
    }
  }

  const loadItems = async (serviceId) => {
    if (!serviceId) return
    const res = await api.get(`/admin/services/${serviceId}/items`)
    setItems(Array.isArray(res.data) ? res.data : [])
  }

  const selectService = async (serviceId) => {
    setSelectedServiceId(serviceId)
    setItemForm(initialItem)
    setChoiceGroupMode('none')
    setChoiceGroupPreset('')
    setChoiceGroupCustom('')
    await loadItems(serviceId)
  }

  const addItem = async (e) => {
    e.preventDefault()
    if (!selectedServiceId || busy) return
    if (!itemForm.name || !itemForm.kind) return
    setBusy(true)
    try {
      const nextGroupKey =
        itemForm.kind !== 'CHOICE_OPTION'
          ? null
          : choiceGroupMode === 'custom'
            ? (choiceGroupCustom || '').trim() || null
            : (choiceGroupPreset || '').trim() || null
      await api.post(`/admin/services/${selectedServiceId}/items`, {
        ...itemForm,
        price: Number(itemForm.price),
        sortOrder: Number(itemForm.sortOrder),
        choiceGroupKey: nextGroupKey,
      })
      setItemForm(initialItem)
      setChoiceGroupMode('none')
      setChoiceGroupPreset('')
      setChoiceGroupCustom('')
      await loadItems(selectedServiceId)
    } finally {
      setBusy(false)
    }
  }

  const groupLabel = (key) => {
    const map = {
      ceramic: 'Керамика',
      paste: 'Паста и круги',
      film: 'Плёнка',
      zone: 'Зона нанесения',
      materials: 'Материалы',
      chem: 'Химия',
    }
    return map[key] || key
  }

  const existingGroupKeys = Array.from(new Set((items || []).map((x) => x.choiceGroupKey).filter(Boolean)))
  const presets = [
    { key: 'materials', label: 'Материалы' },
    { key: 'paste', label: 'Паста и круги' },
    { key: 'ceramic', label: 'Керамика' },
    { key: 'film', label: 'Плёнка' },
    { key: 'zone', label: 'Зона нанесения' },
    { key: 'chem', label: 'Химия' },
    ...existingGroupKeys
      .filter((k) => !['materials', 'paste', 'ceramic', 'film', 'zone', 'chem'].includes(k))
      .map((k) => ({ key: k, label: groupLabel(k) })),
  ]

  const deleteItem = async (itemId) => {
    if (!selectedServiceId || busy) return
    setBusy(true)
    try {
      await api.delete(`/admin/services/${selectedServiceId}/items/${itemId}`)
      await loadItems(selectedServiceId)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h1>Управление услугами</h1>
      <div className="stack">
        <form className="card form-grid" onSubmit={create}>
          <select value={form.workshopId} onChange={(e) => setForm({ ...form, workshopId: e.target.value })}>
            <option value="">Выберите салон</option>
            {workshops.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <Field label="Название услуги" value={form.name}>
            <input placeholder="Название услуги" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Описание" value={form.description}>
            <input placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Длительность" value={form.durationMinutes}>
            <input type="number" placeholder="Длительность" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
          </Field>
          <Field label="Цена" value={form.price}>
            <input type="number" placeholder="Цена" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </Field>
          <button type="submit" disabled={busy}>{busy ? 'Сохранение…' : 'Добавить услугу'}</button>
        </form>

        {selectedServiceId && (
          <div className="card stack">
            <div className="section-head">
              <h2>Состав услуги</h2>
              <button type="button" className="secondary" onClick={() => { setSelectedServiceId(null); setItems([]) }} disabled={busy}>
                Закрыть
              </button>
            </div>
            <form className="form-grid" onSubmit={addItem}>
              <select value={itemForm.kind} onChange={(e) => setItemForm({ ...itemForm, kind: e.target.value })}>
                <option value="MANDATORY">Обязательный</option>
                <option value="OPTIONAL">Опциональный</option>
                <option value="CHOICE_OPTION">Вариант выбора</option>
              </select>
              <Field label="Название пункта" value={itemForm.name}>
                <input placeholder="Название пункта" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
              </Field>
              <Field label="Описание (опционально)" value={itemForm.description}>
                <input placeholder="Описание (опционально)" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} />
              </Field>
              <Field label="Цена" value={itemForm.price}>
                <input type="number" placeholder="Цена" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} />
              </Field>

              {itemForm.kind === 'CHOICE_OPTION' ? (
                <div className="stack">
                  <div className="muted">Группа выбора</div>
                  <div className="form-grid">
                    <select value={choiceGroupMode} onChange={(e) => setChoiceGroupMode(e.target.value)}>
                      <option value="none">Выберите…</option>
                      <option value="preset">Из списка</option>
                      <option value="custom">Новая группа</option>
                    </select>
                    {choiceGroupMode === 'preset' && (
                      <select value={choiceGroupPreset} onChange={(e) => setChoiceGroupPreset(e.target.value)}>
                        <option value="">Выберите группу</option>
                        {presets.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                      </select>
                    )}
                    {choiceGroupMode === 'custom' && (
                      <Field label="Ключ (латиница)" value={choiceGroupCustom}>
                        <input placeholder="например: ceramic" value={choiceGroupCustom} onChange={(e) => setChoiceGroupCustom(e.target.value)} />
                      </Field>
                    )}
                  </div>
                </div>
              ) : (
                <div className="muted">Группа выбора: —</div>
              )}
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={!!itemForm.defaultSelected} onChange={(e) => setItemForm({ ...itemForm, defaultSelected: e.target.checked })} />
                <span className="text-white/80">Выбрано по умолчанию</span>
              </label>
              <Field label="Сортировка" value={itemForm.sortOrder}>
                <input type="number" placeholder="Сортировка" value={itemForm.sortOrder} onChange={(e) => setItemForm({ ...itemForm, sortOrder: e.target.value })} />
              </Field>
              <button type="submit" disabled={busy || !itemForm.name}>{busy ? 'Добавление…' : 'Добавить пункт'}</button>
            </form>

            <div className="stack">
              {(items || []).map((it) => (
                <div key={it.id} className="card">
                  <div className="section-head">
                    <h4>{it.name}</h4>
                    <button type="button" className="danger" onClick={() => deleteItem(it.id)} disabled={busy}>Удалить</button>
                  </div>
                  <p className="muted">
                    {it.kind}
                    {it.choiceGroupKey ? ` • группа: ${groupLabel(it.choiceGroupKey)}` : ''}
                    {it.defaultSelected ? ' • по умолчанию' : ''}
                  </p>
                  {it.description && <p className="muted">{it.description}</p>}
                  <p>{it.price} ₽</p>
                </div>
              ))}
              {!items?.length && <p className="muted">Пока нет пунктов.</p>}
            </div>
          </div>
        )}

        <div className="grid">
          {services.map((s) => (
            <div className="card" key={s.id}>
              <h4>{s.name}</h4>
              <p>{s.workshopName}</p>
              <p>{s.price} ₽</p>
              <div className="flex gap-2 flex-wrap mt-2">
                <button type="button" className="secondary" onClick={() => selectService(s.id)} disabled={busy}>
                  Настроить состав
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
