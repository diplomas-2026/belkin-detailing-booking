import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api'

export default function WorkshopDetailPage() {
  const { id } = useParams()
  const [workshop, setWorkshop] = useState(null)
  const [services, setServices] = useState([])
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get(`/workshops/${id}`).then((r) => setWorkshop(r.data))
    api.get(`/workshops/${id}/stats`).then((r) => setStats(r.data)).catch(() => setStats(null))
    api.get(`/workshops/${id}/services`).then((r) => setServices(r.data))
    api.get(`/workshops/${id}/reviews`).then((r) => setReviews(r.data))
  }, [id])

  if (!workshop) return <p>Загрузка...</p>

  return (
    <div className="stack">
      <section className="card">
        <h1>{workshop.name}</h1>
        {workshop.description && <p>{workshop.description}</p>}
        <div className="grid">
          <div className="card">
            <h4>Адрес</h4>
            <p>{workshop.address}</p>
            <p className="muted">{workshop.workingHours}</p>
          </div>
          <div className="card">
            <h4>Статистика</h4>
            <p>Выполнено услуг: <strong className="text-white">{stats?.completedAppointments ?? '—'}</strong></p>
            <p className="muted">Счётчик основан на завершённых записях.</p>
          </div>
        </div>
      </section>

      {workshop.photos?.length > 0 && (
        <section className="card">
          <h2>Фото салона</h2>
          <div className="photo-grid">
            {workshop.photos.map((photo) => (
              <img key={photo.id} src={photo.photoUrl} alt="Фото салона" />
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <h2>Услуги</h2>
        <div className="grid">
          {services.map((service) => (
            <div key={service.id} className="card">
              <h4>{service.name}</h4>
              {service.description && <p>{service.description}</p>}
              <p>{service.durationMinutes} мин • {service.price} ₽</p>
              <Link
                className="btn secondary"
                to={`/services?workshopId=${workshop.id}&serviceId=${service.id}`}
              >
                Записаться
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Отзывы</h2>
        <div className="grid">
          {reviews.map((review) => (
            <div key={review.id} className="card">
              <div className="review-head">
                <strong className="text-white">{review.clientName}</strong>
                <span className="muted">{review.rating}/5</span>
              </div>
              <p>{review.comment || 'Без комментария'}</p>
            </div>
          ))}
          {!reviews.length && <p className="muted">Пока нет отзывов.</p>}
        </div>
      </section>
    </div>
  )
}
