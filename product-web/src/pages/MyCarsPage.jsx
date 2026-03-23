import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import Field from '../components/ui/Field'

const initial = { brand: '', model: '', year: 2022, plateNumber: '', color: '', notes: '' }
const brandOptions = [
  'BMW', 'Mercedes-Benz', 'Audi', 'Toyota', 'Lexus', 'Volkswagen', 'Skoda', 'Kia', 'Hyundai', 'Nissan',
  'Renault', 'Mazda', 'Ford', 'Chevrolet', 'Volvo', 'Porsche', 'Land Rover', 'Geely', 'Chery', 'Haval',
]
const modelOptions = [
  '3 Series', '5 Series', 'C-Class', 'E-Class', 'A4', 'A6', 'Camry', 'Corolla', 'RAV4', 'Land Cruiser',
  'Octavia', 'Rapid', 'Kodiaq', 'Sportage', 'Sorento', 'Tucson', 'Santa Fe', 'Qashqai', 'X-Trail', 'CX-5',
]
const colorOptions = ['Чёрный', 'Белый', 'Серый', 'Серебристый', 'Синий', 'Красный', 'Зелёный', 'Бордовый', 'Коричневый', 'Бежевый']
const yearOptions = Array.from({ length: 21 }, (_, i) => String(2026 - i))
const plateOptions = ['A000AA']
const notesOptions = ['Требуется химчистка салона', 'Нужно убрать царапины на бампере', 'Своя химия', 'Просьба позвонить перед началом']

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
            <input list="brand-options" placeholder="Марка" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          </Field>
          <Field label="Модель" value={form.model}>
            <input list="model-options" placeholder="Модель" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </Field>
          <Field label="Год" value={form.year}>
            <input list="year-options" placeholder="Год" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
          </Field>
          <Field label="Госномер" value={form.plateNumber}>
            <input list="plate-options" placeholder="Госномер" value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} />
          </Field>
          <Field label="Цвет" value={form.color}>
            <input list="color-options" placeholder="Цвет" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </Field>
          <Field label="Примечание" value={form.notes}>
            <input list="notes-options" placeholder="Примечание" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <button type="submit">Добавить авто</button>

          <datalist id="brand-options">
            {brandOptions.map((x) => <option key={x} value={x} />)}
          </datalist>
          <datalist id="model-options">
            {modelOptions.map((x) => <option key={x} value={x} />)}
          </datalist>
          <datalist id="color-options">
            {colorOptions.map((x) => <option key={x} value={x} />)}
          </datalist>
          <datalist id="year-options">
            {yearOptions.map((x) => <option key={x} value={x} />)}
          </datalist>
          <datalist id="plate-options">
            {plateOptions.map((x) => <option key={x} value={x} />)}
          </datalist>
          <datalist id="notes-options">
            {notesOptions.map((x) => <option key={x} value={x} />)}
          </datalist>
        </form>
        <div className="grid">
          {cars.map((car) => (
            <div key={car.id} className="card">
              <div className="car-item">
                <img className="car-thumb" src="/images/car-placeholder.png" alt="Автомобиль" loading="lazy" />
                <div className="car-info">
                  <h4>{car.brand} {car.model}</h4>
                  <p>{car.year} • {car.plateNumber}</p>
                  <p>{car.color}</p>
                  <Link className="btn secondary" to={`/my-cars/${car.id}`}>Открыть</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
