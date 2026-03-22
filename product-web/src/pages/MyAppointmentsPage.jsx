import { useEffect, useState } from 'react'
import api from '../api'

const initial = { workshopId: '', carId: '', serviceId: '', scheduledStart: '', clientComment: '' }

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [workshops, setWorkshops] = useState([])
  const [cars, setCars] = useState([])
  const [services, setServices] = useState([])
  const [form, setForm] = useState(initial)

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
    if (!form.workshopId) return
    api.get(`/workshops/${form.workshopId}/services`).then((r) => setServices(r.data))
  }, [form.workshopId])

  const create = async (e) => {
    e.preventDefault()
    await api.post('/appointments', { ...form, workshopId: Number(form.workshopId), carId: Number(form.carId), serviceId: Number(form.serviceId) })
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
          <select value={form.workshopId} onChange={(e) => setForm({ ...form, workshopId: e.target.value, serviceId: '' })}>
            <option value="">Выберите точку</option>
            {workshops.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <select value={form.carId} onChange={(e) => setForm({ ...form, carId: e.target.value })}>
            <option value="">Выберите авто</option>
            {cars.map((c) => <option key={c.id} value={c.id}>{c.brand} {c.model} ({c.plateNumber})</option>)}
          </select>
          <select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })}>
            <option value="">Выберите услугу</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="datetime-local" value={form.scheduledStart} onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })} />
          <input placeholder="Комментарий" value={form.clientComment} onChange={(e) => setForm({ ...form, clientComment: e.target.value })} />
          <button type="submit">Записаться</button>
        </form>

        <div className="grid">
          {appointments.map((a) => (
            <div className="card" key={a.id}>
              <h4>{a.serviceName}</h4>
              <p>{a.workshopName}</p>
              <p>{new Date(a.scheduledStart).toLocaleString('ru-RU')}</p>
              <p>Статус: {a.status}</p>
              {(a.status === 'NEW' || a.status === 'CONFIRMED') && (
                <button className="danger" onClick={() => cancel(a.id)}>Отменить</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
