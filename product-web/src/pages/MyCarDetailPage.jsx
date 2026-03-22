import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api'

export default function MyCarDetailPage() {
  const { id } = useParams()
  const [car, setCar] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    api.get(`/cars/${id}`)
      .then((r) => setCar(r.data))
      .catch(() => setError('Не удалось загрузить автомобиль'))
  }, [id])

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
        </div>
      )}
    </div>
  )
}

