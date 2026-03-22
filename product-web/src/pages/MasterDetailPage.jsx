import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api'

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
  const [master, setMaster] = useState(null)
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    api.get(`/masters/${masterId}`).then((r) => setMaster(r.data))
    api.get(`/masters/${masterId}/reviews`).then((r) => setReviews(r.data)).catch(() => setReviews([]))
  }, [masterId])

  if (!master) return <p className="muted">Загрузка…</p>

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>{master.fullName}</h1>
          <p className="muted">{master.specialization} • {master.experienceYears} лет опыта</p>
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

