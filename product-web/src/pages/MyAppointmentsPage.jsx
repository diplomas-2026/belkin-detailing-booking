import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'
import { appointmentStatusLabel } from '../utils/appointmentStatus'
import Field from '../components/ui/Field'

const initial = { workshopId: '', carId: '', serviceIds: [], scheduledStart: '', clientComment: '' }

export default function MyAppointmentsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [workshops, setWorkshops] = useState([])
  const [cars, setCars] = useState([])
  const [services, setServices] = useState([])
  const [form, setForm] = useState(initial)
  const [serviceItemsById, setServiceItemsById] = useState({})
  const [selectedItemIdsByServiceId, setSelectedItemIdsByServiceId] = useState({})

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

  const loadAppointments = () => api.get('/appointments/my').then((r) => setAppointments(r.data))

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const [workshopsRes, carsRes, appointmentsRes] = await Promise.all([
          api.get('/workshops'),
          api.get('/cars/my'),
          api.get('/appointments/my'),
        ])
        if (!active) return
        setWorkshops(workshopsRes.data)
        setCars(carsRes.data)
        setAppointments(appointmentsRes.data)
      } catch {
        if (active) setTimeout(load, 1000)
      }
    }
    load()
    return () => { active = false }
  }, [])

  useEffect(() => {
    const wid = searchParams.get('workshopId')
    const sid = searchParams.get('serviceId')
    const cid = searchParams.get('carId')
    if (!wid && !sid && !cid) return
    setForm((prev) => ({
      ...prev,
      workshopId: wid ? String(wid) : prev.workshopId,
      serviceIds: sid ? [String(sid)] : prev.serviceIds,
      carId: cid ? String(cid) : prev.carId,
    }))
  }, [searchParams])

  useEffect(() => {
    if (!form.workshopId) return
    api.get(`/workshops/${form.workshopId}/services`).then((r) => setServices(r.data))
  }, [form.workshopId])

  const toggleService = (serviceId) => {
    setForm((prev) => {
      const current = new Set(prev.serviceIds || [])
      const idStr = String(serviceId)
      if (current.has(idStr)) current.delete(idStr)
      else current.add(idStr)
      return { ...prev, serviceIds: Array.from(current) }
    })
  }

  const buildDefaultSelection = (items = []) => {
    const selected = new Set()
    const choiceGroups = {}
    for (const it of items) {
      if (it.kind === 'MANDATORY') {
        selected.add(it.id)
      } else if (it.kind === 'OPTIONAL' && it.defaultSelected) {
        selected.add(it.id)
      } else if (it.kind === 'CHOICE_OPTION' && it.choiceGroupKey) {
        choiceGroups[it.choiceGroupKey] = choiceGroups[it.choiceGroupKey] || []
        choiceGroups[it.choiceGroupKey].push(it)
      }
    }
    Object.entries(choiceGroups).forEach(([, opts]) => {
      const def = opts.find((o) => o.defaultSelected) || opts[0]
      if (def) selected.add(def.id)
    })
    return selected
  }

  useEffect(() => {
    const ids = (form.serviceIds || []).map((x) => Number(x)).filter(Boolean)
    if (!ids.length) {
      setServiceItemsById({})
      setSelectedItemIdsByServiceId({})
      return
    }
    let active = true
    const loadItems = async () => {
      try {
        const results = await Promise.all(ids.map((id) => api.get(`/services/${id}/items`).then((r) => [id, r.data]).catch(() => [id, []])))
        if (!active) return
        const map = {}
        const selectedMap = {}
        for (const [serviceId, raw] of results) {
          const items = Array.isArray(raw) ? raw : []
          map[serviceId] = items
          const defaults = buildDefaultSelection(items)
          selectedMap[serviceId] = Array.from(defaults)
        }
        setServiceItemsById(map)
        setSelectedItemIdsByServiceId((prev) => ({ ...selectedMap, ...prev }))
      } catch {
        // ignore
      }
    }
    loadItems()
    return () => { active = false }
  }, [form.serviceIds])

  const isSelected = (serviceId, itemId) => {
    const arr = selectedItemIdsByServiceId[serviceId] || []
    return arr.includes(itemId)
  }

  const toggleOptional = (serviceId, itemId) => {
    setSelectedItemIdsByServiceId((prev) => {
      const current = new Set(prev[serviceId] || [])
      if (current.has(itemId)) current.delete(itemId)
      else current.add(itemId)
      return { ...prev, [serviceId]: Array.from(current) }
    })
  }

  const chooseInGroup = (serviceId, groupKey, itemId) => {
    const items = serviceItemsById[serviceId] || []
    const groupItemIds = items.filter((x) => x.kind === 'CHOICE_OPTION' && x.choiceGroupKey === groupKey).map((x) => x.id)
    setSelectedItemIdsByServiceId((prev) => {
      const current = new Set(prev[serviceId] || [])
      groupItemIds.forEach((id) => current.delete(id))
      current.add(itemId)
      return { ...prev, [serviceId]: Array.from(current) }
    })
  }

  const calcTotal = () => {
    let sum = 0
    const ids = (form.serviceIds || []).map((x) => Number(x)).filter(Boolean)
    for (const serviceId of ids) {
      const items = serviceItemsById[serviceId] || []
      if (!items.length) {
        const s = services.find((x) => x.id === serviceId)
        sum += Number(s?.price || 0)
        continue
      }
      const selected = new Set(selectedItemIdsByServiceId[serviceId] || [])
      for (const it of items) {
        if (it.kind === 'MANDATORY' || selected.has(it.id)) sum += Number(it.price || 0)
      }
    }
    return sum
  }

  const create = async (e) => {
    e.preventDefault()
    await api.post('/appointments', {
      workshopId: Number(form.workshopId),
      carId: Number(form.carId),
      serviceIds: (form.serviceIds || []).map((x) => Number(x)).filter(Boolean),
      selections: (form.serviceIds || [])
        .map((x) => Number(x))
        .filter(Boolean)
        .map((serviceId) => ({
          serviceId,
          selectedItemIds: selectedItemIdsByServiceId[serviceId] || [],
        })),
      scheduledStart: form.scheduledStart,
      clientComment: form.clientComment,
    })
    setForm(initial)
    loadAppointments()
  }

  const cancel = async (id) => {
    await api.post(`/appointments/${id}/cancel`, { reason: 'Планы изменились' })
    loadAppointments()
  }

  return (
    <div>
      <h1>Мои записи</h1>
      <div className="stack">
        <form className="card booking-form" onSubmit={create}>
          <div className="booking-grid">
            <div className="stack">
              <Field label="Салон" value={form.workshopId}>
                <select value={form.workshopId} onChange={(e) => setForm({ ...form, workshopId: e.target.value, serviceIds: [] })}>
                  <option value="">Выберите салон</option>
                  {workshops.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </Field>
              <Field label="Автомобиль" value={form.carId}>
                <select value={form.carId} onChange={(e) => setForm({ ...form, carId: e.target.value })}>
                  <option value="">Выберите авто</option>
                  {cars.map((c) => <option key={c.id} value={c.id}>{c.brand} {c.model} ({c.plateNumber})</option>)}
                </select>
              </Field>
              <Field label="Дата и время" value={form.scheduledStart}>
                <input type="datetime-local" value={form.scheduledStart} onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })} />
              </Field>
              <Field label="Комментарий" value={form.clientComment}>
                <input placeholder="Комментарий" value={form.clientComment} onChange={(e) => setForm({ ...form, clientComment: e.target.value })} />
              </Field>
            </div>

            <div className="stack">
              <div className="section-head">
                <h3>Выберите услуги</h3>
                <span className="muted">{services.length ? `${services.length} доступно` : 'Сначала выберите салон'}</span>
              </div>
              <div className="service-list">
                {services.map((s) => {
                  const checked = (form.serviceIds || []).includes(String(s.id))
                  return (
                    <label key={s.id} className={`service-item ${checked ? 'selected' : ''}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleService(s.id)} />
                      <div className="service-info">
                        <strong className="text-white">{s.name}</strong>
                        {s.description && <span className="muted">{s.description}</span>}
                      </div>
                      <div className="service-meta">
                        <span className="text-white">{s.price} ₽</span>
                        <span className="muted">{s.durationMinutes} мин</span>
                      </div>
                    </label>
                  )
                })}
                {!services.length && <p className="muted">Выберите салон, чтобы увидеть список услуг.</p>}
              </div>
            </div>
          </div>

          <div className="booking-footer">
            <div className="booking-total">
              <div className="muted">Итого</div>
              <div className="text-white"><strong>{calcTotal()} ₽</strong></div>
            </div>
            <button type="submit" disabled={!form.workshopId || !form.carId || !form.scheduledStart || !(form.serviceIds || []).length}>
              Записаться
            </button>
          </div>
        </form>

        {(form.serviceIds || []).length > 0 && (
          <div className="card booking-composition">
            <div className="section-head">
              <h2>Состав выбранных услуг</h2>
              <span className="muted">Можно отказаться от материалов студии и выбрать опции</span>
            </div>
            <div className="stack">
              {(form.serviceIds || []).map((sidRaw) => {
                const serviceId = Number(sidRaw)
                const service = services.find((x) => x.id === serviceId)
                const items = serviceItemsById[serviceId] || []
                const hasItems = items.length > 0

                const groups = {}
                for (const it of items) {
                  if (it.kind === 'CHOICE_OPTION' && it.choiceGroupKey) {
                    groups[it.choiceGroupKey] = groups[it.choiceGroupKey] || []
                    groups[it.choiceGroupKey].push(it)
                  }
                }

                const optionals = items.filter((x) => x.kind === 'OPTIONAL')
                return (
                  <div className="card" key={serviceId}>
                    <div className="section-head">
                      <h4 className="text-white">{service?.name || `Услуга #${serviceId}`}</h4>
                      <span className="muted">{hasItems ? 'Настраиваемая' : 'Без доп. пунктов'}</span>
                    </div>

                    {hasItems && (
                      <div className="stack">
                        {Object.entries(groups).map(([gk, opts]) => (
                          <div key={gk} className="option-group">
                            <div className="option-group-head">
                              <span className="muted">Выбор</span>
                              <strong className="text-white">{groupLabel(gk)}</strong>
                            </div>
                            <div className="option-list">
                              {opts.map((it) => (
                                <label key={it.id} className={`option-row ${isSelected(serviceId, it.id) ? 'selected' : ''}`}>
                                  <input
                                    type="radio"
                                    name={`group-${serviceId}-${gk}`}
                                    checked={isSelected(serviceId, it.id)}
                                    onChange={() => chooseInGroup(serviceId, gk, it.id)}
                                  />
                                  <span className="option-label text-white/90">{it.name}</span>
                                  <span className="option-price muted">{it.price} ₽</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}

                        {optionals.length > 0 && (
                          <div className="option-group">
                            <div className="option-group-head">
                              <span className="muted">Опции</span>
                            </div>
                            <div className="option-list">
                              {optionals.map((it) => (
                                <label key={it.id} className={`option-row ${isSelected(serviceId, it.id) ? 'selected' : ''}`}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected(serviceId, it.id)}
                                    onChange={() => toggleOptional(serviceId, it.id)}
                                  />
                                  <span className="option-label text-white/90">{it.name}</span>
                                  <span className="option-price muted">{it.price} ₽</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {!hasItems && (
                      <p className="muted">Стоимость: {service?.price} ₽</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid">
          {appointments.map((a) => (
            <div
              className="card card-link"
              key={a.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/my-appointments/${a.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') navigate(`/my-appointments/${a.id}`)
              }}
            >
              <h4>{a.serviceName}</h4>
              {a.services?.length > 1 && <p className="muted">+ ещё {a.services.length - 1} услуг</p>}
              <p>{a.workshopName}</p>
              <p>{new Date(a.scheduledStart).toLocaleString('ru-RU')}</p>
              <p>
                Статус:{' '}
                <span className={`badge badge-${a.status?.toLowerCase?.() || 'unknown'}`}>
                  {appointmentStatusLabel(a.status)}
                </span>
              </p>
              <p>
                Оплата:{' '}
                <span className={`badge ${a.paymentStatus === 'PAID' ? 'badge-approved' : 'badge-pending'}`}>
                  {a.paymentStatus === 'PAID' ? 'Оплачено' : 'Не оплачено'}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
