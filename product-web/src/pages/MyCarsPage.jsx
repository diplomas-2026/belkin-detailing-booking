import { useEffect, useState } from 'react'
import api from '../api'

const initial = { brand: '', model: '', year: 2022, plateNumber: '', color: '', notes: '' }

export default function MyCarsPage() {
  const [cars, setCars] = useState([])
  const [form, setForm] = useState(initial)

  const load = () => api.get('/cars/my').then((r) => setCars(r.data))
  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    await api.post('/cars', form)
    setForm(initial)
    load()
  }

  return (
    <div>
      <h1>Мои автомобили</h1>
      <form className="card form-grid" onSubmit={create}>
        <input placeholder="Марка" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
        <input placeholder="Модель" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
        <input placeholder="Год" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
        <input placeholder="Госномер" value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} />
        <input placeholder="Цвет" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
        <input placeholder="Примечание" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button type="submit">Добавить авто</button>
      </form>
      <div className="grid">
        {cars.map((car) => (
          <div key={car.id} className="card">
            <h4>{car.brand} {car.model}</h4>
            <p>{car.year} • {car.plateNumber}</p>
            <p>{car.color}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
