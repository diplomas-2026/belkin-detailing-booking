import { useEffect, useState } from 'react'
import api from '../api'

const initial = { name: '', description: '', address: '', city: 'Самара', latitude: 53.2, longitude: 50.17, phone: '', workingHours: '', active: true }

export default function AdminWorkshopsPage() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(initial)
  const [photoUrl, setPhotoUrl] = useState('')
  const [selectedWorkshop, setSelectedWorkshop] = useState('')

  const load = () => api.get('/admin/workshops').then((r) => setItems(r.data))

  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    await api.post('/admin/workshops', form)
    setForm(initial)
    load()
  }

  const addPhoto = async (e) => {
    e.preventDefault()
    await api.post(`/admin/workshops/${selectedWorkshop}/photos`, { photoUrl, sortOrder: 1, cover: false })
    setPhotoUrl('')
    load()
  }

  return (
    <div>
      <h1>Управление точками</h1>
      <form className="card form-grid" onSubmit={create}>
        <input placeholder="Название точки" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input placeholder="Адрес" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <input placeholder="Город" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <input type="number" step="0.0001" placeholder="Широта" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })} />
        <input type="number" step="0.0001" placeholder="Долгота" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })} />
        <input placeholder="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input placeholder="Часы работы" value={form.workingHours} onChange={(e) => setForm({ ...form, workingHours: e.target.value })} />
        <button type="submit">Добавить точку</button>
      </form>

      <form className="card form-grid" onSubmit={addPhoto}>
        <select value={selectedWorkshop} onChange={(e) => setSelectedWorkshop(e.target.value)}>
          <option value="">Точка для фото</option>
          {items.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <input placeholder="URL фото" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
        <button type="submit">Добавить фото</button>
      </form>

      <div className="grid">
        {items.map((w) => (
          <div key={w.id} className="card">
            <h4>{w.name}</h4>
            <p>{w.address}</p>
            <p>Фото: {w.photos.length}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
