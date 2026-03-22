import { useEffect, useState } from 'react'
import api from '../api'

const initial = { workshopId: '', name: '', description: '', durationMinutes: 60, price: 2000, active: true }

export default function AdminServicesPage() {
  const [workshops, setWorkshops] = useState([])
  const [services, setServices] = useState([])
  const [form, setForm] = useState(initial)

  const load = () => {
    api.get('/workshops').then((r) => setWorkshops(r.data))
    api.get('/services').then((r) => setServices(r.data))
  }

  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    await api.post('/admin/services', {
      ...form,
      workshopId: Number(form.workshopId),
      durationMinutes: Number(form.durationMinutes),
      price: Number(form.price),
    })
    setForm(initial)
    load()
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
          <button type="submit">Добавить услугу</button>
        </form>
        <div className="grid">
          {services.map((s) => (
            <div className="card" key={s.id}>
              <h4>{s.name}</h4>
              <p>{s.workshopName}</p>
              <p>{s.price} ₽</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
