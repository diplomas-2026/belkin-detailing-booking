import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'
import { appointmentStatusLabel } from '../utils/appointmentStatus'

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
        <form className="card form-grid" onSubmit={create}>
          <select value={form.workshopId} onChange={(e) => setForm({ ...form, workshopId: e.target.value, serviceIds: [] })}>
            <option value="">Выберите салон</option>
            {workshops.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <select value={form.carId} onChange={(e) => setForm({ ...form, carId: e.target.value })}>
            <option value="">Выберите авто</option>
            {cars.map((c) => <option key={c.id} value={c.id}>{c.brand} {c.model} ({c.plateNumber})</option>)}
          </select>
          <select
            multiple
            value={form.serviceIds}
            onChange={(e) => setForm({ ...form, serviceIds: Array.from(e.target.selectedOptions).map((o) => o.value) })}
          >
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {(form.serviceIds || []).length > 0 && (
            <div className="card">
              <h4>Состав выбранных услуг</h4>
              <p className="muted">Можно отказаться от материалов студии и выбрать опции (если доступны).</p>
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
                            <div key={gk} className="card">
                              <p className="muted">Выбор: <strong className="text-white">{gk}</strong></p>
                              <div className="stack">
                                {opts.map((it) => (
                                  <label key={it.id} className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-2">
                                      <input
                                        type="radio"
                                        name={`group-${serviceId}-${gk}`}
                                        checked={isSelected(serviceId, it.id)}
                                        onChange={() => chooseInGroup(serviceId, gk, it.id)}
                                      />
                                      <span className="text-white/90">{it.name}</span>
                                    </span>
                                    <span className="muted">{it.price} ₽</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}

                          {optionals.length > 0 && (
                            <div className="card">
                              <p className="muted">Опции</p>
                              <div className="stack">
                                {optionals.map((it) => (
                                  <label key={it.id} className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={isSelected(serviceId, it.id)}
                                        onChange={() => toggleOptional(serviceId, it.id)}
                                      />
                                      <span className="text-white/90">{it.name}</span>
                                    </span>
                                    <span className="muted">{it.price} ₽</span>
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
              <div className="section-head" style={{ marginTop: 12 }}>
                <strong className="text-white">Итого: {calcTotal()} ₽</strong>
              </div>
            </div>
          )}
          <input type="datetime-local" value={form.scheduledStart} onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })} />
          <input placeholder="Комментарий" value={form.clientComment} onChange={(e) => setForm({ ...form, clientComment: e.target.value })} />
          <button type="submit">Записаться</button>
        </form>

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
              {(a.status === 'NEW' || a.status === 'CONFIRMED') && (
                <button
                  className="danger"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    cancel(a.id)
                  }}
                >
                  Отменить
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
