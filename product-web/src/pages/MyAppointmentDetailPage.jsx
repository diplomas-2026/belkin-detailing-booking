import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api'
import { appointmentStatusLabel } from '../utils/appointmentStatus'

export default function MyAppointmentDetailPage() {
  const { id } = useParams()
  const [appointment, setAppointment] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    api.get(`/appointments/${id}`)
      .then((r) => setAppointment(r.data))
      .catch(() => setError('Не удалось загрузить запись'))
  }, [id])

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Запись</h1>
          <p className="muted">Детали записи и её текущий статус.</p>
        </div>
        <div className="page-controls">
          <Link className="btn secondary" to="/my-appointments">Назад</Link>
        </div>
      </div>

      {error && <div className="card"><p className="error">{error}</p></div>}
      {!error && !appointment && <div className="card"><p className="muted">Загрузка…</p></div>}

      {appointment && (
        <div className="card">
          <div className="section-head">
            <h2>{appointment.serviceName}</h2>
            <span className={`badge badge-${appointment.status?.toLowerCase?.() || 'unknown'}`}>
              {appointmentStatusLabel(appointment.status)}
            </span>
          </div>
          <div className="grid">
            <div className="card">
              <h4>Салон</h4>
              <p>{appointment.workshopName}</p>
              <p className="muted">{appointment.carLabel}</p>
            </div>
            <div className="card">
              <h4>Время</h4>
              <p>{new Date(appointment.scheduledStart).toLocaleString('ru-RU')}</p>
              <p className="muted">Окончание: {new Date(appointment.scheduledEnd).toLocaleString('ru-RU')}</p>
            </div>
            <div className="card">
              <h4>Стоимость</h4>
              <p>{appointment.totalPrice} ₽</p>
              <p className="muted">Комментарий: {appointment.clientComment || '—'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

