import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import Field from '../components/ui/Field'

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
      <div className="stack">
        <form className="card form-grid" onSubmit={create}>
          <Field label="Марка" value={form.brand}>
            <input placeholder="Марка" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          </Field>
          <Field label="Модель" value={form.model}>
            <input placeholder="Модель" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </Field>
          <Field label="Год" value={form.year}>
            <input placeholder="Год" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
          </Field>
          <Field label="Госномер" value={form.plateNumber}>
            <input placeholder="Госномер" value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} />
          </Field>
          <Field label="Цвет" value={form.color}>
            <input placeholder="Цвет" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </Field>
          <Field label="Примечание" value={form.notes}>
            <input placeholder="Примечание" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <button type="submit">Добавить авто</button>
        </form>
        <div className="grid">
          {cars.map((car) => (
            <div key={car.id} className="card">
              <h4>{car.brand} {car.model}</h4>
              <p>{car.year} • {car.plateNumber}</p>
              <p>{car.color}</p>
              <Link className="btn secondary" to={`/my-cars/${car.id}`}>Открыть</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
