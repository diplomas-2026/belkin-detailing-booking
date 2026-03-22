import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api'
import { getStoredUser } from '../utils/auth'

export default function WorkshopDetailPage() {
  const { id } = useParams()
  const user = getStoredUser()
  const [workshop, setWorkshop] = useState(null)
  const [services, setServices] = useState([])
  const [masters, setMasters] = useState([])
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState(null)
  const [aiFeedback, setAiFeedback] = useState('')
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get(`/workshops/${id}`).then((r) => setWorkshop(r.data))
    api.get(`/workshops/${id}/stats`).then((r) => setStats(r.data)).catch(() => setStats(null))
    api.get(`/workshops/${id}/services`).then((r) => setServices(r.data))
    api.get(`/workshops/${id}/masters`).then((r) => setMasters(r.data)).catch(() => setMasters([]))
    api.get(`/workshops/${id}/reviews`).then((r) => setReviews(r.data))
    api.get(`/workshops/${id}/feedback`).then((r) => setAiFeedback(r.data?.summary || '')).catch(() => setAiFeedback(''))
    if (user?.role === 'ADMIN') {
      api.get('/admin/ai/budget').then((r) => setBudget(r.data)).catch(() => setBudget(null))
    }
  }, [id])

  if (!workshop) return <p>Загрузка...</p>

  const runFeedback = async () => {
    if (loading || user?.role !== 'ADMIN') return
    setLoading(true)
    try {
      await api.post(`/admin/ai/feedback/workshops/${id}/run`)
      const [fb, b] = await Promise.all([
        api.get(`/workshops/${id}/feedback`).catch(() => ({ data: { summary: '' } })),
        api.get('/admin/ai/budget').catch(() => ({ data: null })),
      ])
      setAiFeedback(fb.data?.summary || '')
      setBudget(b.data)
    } finally {
      setLoading(false)
    }
  }

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
                to={`/my-appointments?workshopId=${workshop.id}&serviceId=${service.id}`}
              >
                Записаться
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Мастера</h2>
        {!masters.length ? (
          <p className="muted">Пока нет мастеров.</p>
        ) : (
          <div className="grid">
            {masters.map((m) => (
              <Link
                key={m.id}
                to={`/workshops/${workshop.id}/masters/${m.id}`}
                className="card card-link"
              >
                <div className="flex items-center gap-3">
                  <img
                    className="portrait"
                    src={m.photoUrl || '/images/master-placeholder.jpeg'}
                    alt={m.fullName}
                    loading="lazy"
                  />
                  <div>
                    <h4 className="text-white">{m.fullName}</h4>
                    <p className="muted">{m.specialization} • {m.experienceYears} лет опыта</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2>Отзывы</h2>
        {aiFeedback && <p className="muted">AI‑фидбэк: {aiFeedback}</p>}
        {user?.role === 'ADMIN' && (
          <div className="card">
            <div className="section-head">
              <h3>AI‑фидбэк салона</h3>
              {budget && <span className="muted">Лимит на сегодня: <strong className="text-white">{budget.used}/{budget.limit}</strong> (осталось <strong className="text-white">{budget.remaining}</strong>)</span>}
            </div>
            <button type="button" onClick={runFeedback} disabled={loading}>
              {loading ? 'Запуск…' : 'Обновить AI‑фидбэк салона'}
            </button>
          </div>
        )}
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
