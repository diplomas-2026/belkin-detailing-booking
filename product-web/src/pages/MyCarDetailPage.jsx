import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api'

export default function MyCarDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [car, setCar] = useState(null)
  const [error, setError] = useState('')
  const [workshops, setWorkshops] = useState([])
  const [services, setServices] = useState([])
  const [workshopId, setWorkshopId] = useState('')
  const [serviceId, setServiceId] = useState('')

  useEffect(() => {
    setError('')
    api.get(`/cars/${id}`)
      .then((r) => setCar(r.data))
      .catch(() => setError('Не удалось загрузить автомобиль'))
  }, [id])

  useEffect(() => {
    api.get('/workshops').then((r) => setWorkshops(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!workshopId) {
      setServices([])
      setServiceId('')
      return
    }
    api.get(`/workshops/${workshopId}/services`).then((r) => setServices(r.data)).catch(() => setServices([]))
  }, [workshopId])

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Автомобиль</h1>
          <p className="muted">Детали вашего автомобиля.</p>
        </div>
        <div className="page-controls">
          <Link className="btn secondary" to="/my-cars">Назад</Link>
        </div>
      </div>

      {error && <div className="card"><p className="error">{error}</p></div>}
      {!error && !car && <div className="card"><p className="muted">Загрузка…</p></div>}

      {car && (
        <div className="card">
          <h2>{car.brand} {car.model}</h2>
          <div className="grid">
            <div className="card">
              <h4>Основное</h4>
              <p>{car.year} • {car.plateNumber}</p>
              <p>{car.color}</p>
            </div>
            <div className="card">
              <h4>Примечание</h4>
              <p>{car.notes || '—'}</p>
            </div>
          </div>

          <div className="stack" style={{ marginTop: 16 }}>
            <h3>Записаться на услугу</h3>
            <div className="form-grid">
              <select value={workshopId} onChange={(e) => { setWorkshopId(e.target.value); setServiceId('') }}>
                <option value="">Выберите салон</option>
                {workshops.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} disabled={!workshopId}>
                <option value="">Выберите услугу</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button
                type="button"
                disabled={!workshopId || !serviceId}
                onClick={() => navigate(`/my-appointments?workshopId=${workshopId}&serviceId=${serviceId}&carId=${id}`)}
              >
                Перейти к записи
              </button>
            </div>
            <p className="muted">Салон и услуга будут подставлены в форме записи.</p>
          </div>
        </div>
      )}
    </div>
  )
}
