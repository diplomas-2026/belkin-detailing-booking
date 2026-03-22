import { useEffect, useState } from 'react'
import api from '../api'

const initial = { workshopId: '', name: '', description: '', durationMinutes: 60, price: 2000, active: true }
const initialItem = { kind: 'OPTIONAL', name: '', description: '', price: 0, choiceGroupKey: '', defaultSelected: false, sortOrder: 0 }

export default function AdminServicesPage() {
  const [workshops, setWorkshops] = useState([])
  const [services, setServices] = useState([])
  const [form, setForm] = useState(initial)
  const [selectedServiceId, setSelectedServiceId] = useState(null)
  const [items, setItems] = useState([])
  const [itemForm, setItemForm] = useState(initialItem)
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
    await loadItems(serviceId)
  }

  const addItem = async (e) => {
    e.preventDefault()
    if (!selectedServiceId || busy) return
    if (!itemForm.name || !itemForm.kind) return
    setBusy(true)
    try {
      await api.post(`/admin/services/${selectedServiceId}/items`, {
        ...itemForm,
        price: Number(itemForm.price),
        sortOrder: Number(itemForm.sortOrder),
        choiceGroupKey: itemForm.choiceGroupKey?.trim() ? itemForm.choiceGroupKey.trim() : null,
      })
      setItemForm(initialItem)
      await loadItems(selectedServiceId)
    } finally {
      setBusy(false)
    }
  }

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
          <input placeholder="Название услуги" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input type="number" placeholder="Длительность" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
          <input type="number" placeholder="Цена" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
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
              <input placeholder="Название пункта" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
              <input placeholder="Описание (опционально)" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} />
              <input type="number" placeholder="Цена" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} />
              <input placeholder="Ключ группы выбора (например ceramic)" value={itemForm.choiceGroupKey} onChange={(e) => setItemForm({ ...itemForm, choiceGroupKey: e.target.value })} />
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={!!itemForm.defaultSelected} onChange={(e) => setItemForm({ ...itemForm, defaultSelected: e.target.checked })} />
                <span className="text-white/80">Выбрано по умолчанию</span>
              </label>
              <input type="number" placeholder="Сортировка" value={itemForm.sortOrder} onChange={(e) => setItemForm({ ...itemForm, sortOrder: e.target.value })} />
              <button type="submit" disabled={busy || !itemForm.name}>{busy ? 'Добавление…' : 'Добавить пункт'}</button>
            </form>

            <div className="stack">
              {(items || []).map((it) => (
                <div key={it.id} className="card">
                  <div className="section-head">
                    <h4>{it.name}</h4>
                    <button type="button" className="danger" onClick={() => deleteItem(it.id)} disabled={busy}>Удалить</button>
                  </div>
                  <p className="muted">{it.kind}{it.choiceGroupKey ? ` • группа: ${it.choiceGroupKey}` : ''}{it.defaultSelected ? ' • по умолчанию' : ''}</p>
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
