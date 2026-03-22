import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api'
import { getStoredUser } from '../utils/auth'

function Stars({ value }) {
  const v = Number(value) || 0
  const full = Math.max(0, Math.min(5, Math.round(v)))
  return (
    <span className="stars" aria-label={`Оценка ${full} из 5`}>
      {'★★★★★'.slice(0, full)}
      <span className="stars-muted">{'★★★★★'.slice(0, 5 - full)}</span>
    </span>
  )
}

export default function MasterDetailPage() {
  const { id, masterId } = useParams()
  const user = getStoredUser()
  const [master, setMaster] = useState(null)
  const [reviews, setReviews] = useState([])
  const [aiFeedback, setAiFeedback] = useState('')
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get(`/masters/${masterId}`).then((r) => setMaster(r.data))
    api.get(`/masters/${masterId}/reviews`).then((r) => setReviews(r.data)).catch(() => setReviews([]))
    api.get(`/masters/${masterId}/feedback`).then((r) => setAiFeedback(r.data?.summary || '')).catch(() => setAiFeedback(''))
    if (user?.role === 'ADMIN') {
      api.get('/admin/ai/budget').then((r) => setBudget(r.data)).catch(() => setBudget(null))
    }
  }, [masterId])

  if (!master) return <p className="muted">Загрузка…</p>

  const runFeedback = async () => {
    if (loading || user?.role !== 'ADMIN') return
    setLoading(true)
    try {
      await api.post(`/admin/ai/feedback/masters/${masterId}/run`)
      const [fb, b] = await Promise.all([
        api.get(`/masters/${masterId}/feedback`).catch(() => ({ data: { summary: '' } })),
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
      <div className="page-head">
        <div>
          <div className="flex items-center gap-4">
            <img
              className="portrait portrait-lg"
              src={master.photoUrl || '/images/master-placeholder.jpeg'}
              alt={master.fullName}
              loading="lazy"
            />
            <div>
              <h1>{master.fullName}</h1>
              <p className="muted">{master.specialization} • {master.experienceYears} лет опыта</p>
            </div>
          </div>
        </div>
        <div className="page-controls">
          <Link className="btn secondary" to={`/workshops/${id}`}>Назад к салону</Link>
        </div>
      </div>

      <section className="card">
        <h2>Информация</h2>
        <div className="grid">
          <div className="card">
            <h4>Салон</h4>
            <p>{master.workshopName}</p>
          </div>
          <div className="card">
            <h4>Статус</h4>
            <p>{master.active ? 'Работает' : 'Неактивен'}</p>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Отзывы о мастере</h2>
        {aiFeedback && <p className="muted">AI‑фидбэк: {aiFeedback}</p>}
        {user?.role === 'ADMIN' && (
          <div className="card">
            <div className="section-head">
              <h3>AI‑фидбэк мастера</h3>
              {budget && <span className="muted">Лимит на сегодня: <strong className="text-white">{budget.used}/{budget.limit}</strong> (осталось <strong className="text-white">{budget.remaining}</strong>)</span>}
            </div>
            <button type="button" onClick={runFeedback} disabled={loading}>
              {loading ? 'Запуск…' : 'Обновить AI‑фидбэк мастера'}
            </button>
          </div>
        )}
        {!reviews.length ? (
          <p className="muted">Пока нет отзывов.</p>
        ) : (
          <div className="grid">
            {reviews.map((r) => (
              <article key={r.id} className="card">
                <div className="review-head">
                  <strong className="text-white">{r.clientName}</strong>
                  <Stars value={r.rating} />
                </div>
                {r.comment ? <p>{r.comment}</p> : <p className="muted">Без комментария</p>}
                <p className="muted">{new Date(r.createdAt).toLocaleDateString('ru-RU')}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
