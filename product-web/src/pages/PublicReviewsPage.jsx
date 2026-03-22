import { useEffect, useMemo, useState } from 'react'
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

export default function PublicReviewsPage() {
  const [mode, setMode] = useState('WORKSHOP')
  const [workshops, setWorkshops] = useState([])
  const [services, setServices] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [reviews, setReviews] = useState([])
  const [feedback, setFeedback] = useState([])

  useEffect(() => {
    api.get('/workshops').then((r) => setWorkshops(r.data)).catch(() => {})
    api.get('/services').then((r) => setServices(r.data)).catch(() => {})
    api.get('/public/feedback').then((r) => setFeedback(r.data)).catch(() => setFeedback([]))
  }, [])

  const options = useMemo(() => {
    if (mode === 'SERVICE') {
      return services.map((s) => ({ id: s.id, label: `${s.name} — ${s.workshopName}` }))
    }
    return workshops.map((w) => ({ id: w.id, label: w.name }))
  }, [mode, services, workshops])

  useEffect(() => {
    if (!selectedId && options[0]) setSelectedId(String(options[0].id))
  }, [options, selectedId])

  useEffect(() => {
    if (!selectedId) return
    const url = mode === 'SERVICE' ? `/services/${selectedId}/reviews` : `/workshops/${selectedId}/reviews`
    api.get(url).then((r) => setReviews(r.data)).catch(() => setReviews([]))
  }, [mode, selectedId])

  const title = mode === 'SERVICE' ? 'Отзывы об услугах' : 'Отзывы о салонах'
  const aiSummary = feedback.find((f) => f.targetType === mode)?.summary

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Отзывы</h1>
          <p className="muted">Показываем только опубликованные отзывы клиентов.</p>
        </div>
        <div className="page-controls">
          <select value={mode} onChange={(e) => { setMode(e.target.value); setSelectedId('') }}>
            <option value="WORKSHOP">О салонах</option>
            <option value="SERVICE">Об услугах</option>
          </select>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} disabled={!options.length}>
            {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <section className="card">
        <h2>{title}</h2>
        {aiSummary && <p className="muted">AI‑резюме: {aiSummary}</p>}
        {!options.length ? (
          <p className="muted">Загрузка…</p>
        ) : !reviews.length ? (
          <p className="muted">Пока нет отзывов.</p>
        ) : (
          <div className="grid">
            {reviews.map((r) => (
              <article key={r.id} className="card">
                <div className="review-head">
                  <strong>{r.clientName}</strong>
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
