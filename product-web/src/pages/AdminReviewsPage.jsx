import { useEffect, useState } from 'react'
import api from '../api'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [budget, setBudget] = useState(null)
  const [lastRun, setLastRun] = useState(null)

  const load = () => {
    api.get('/admin/reviews').then((r) => {
      const sorted = [...r.data].sort((a, b) => {
        const prio = (s) => (s === 'PENDING' ? 0 : s === 'REJECTED' ? 1 : 2)
        return prio(a.status) - prio(b.status)
      })
      setReviews(sorted)
    })
    api.get('/admin/ai/budget').then((r) => setBudget(r.data)).catch(() => setBudget(null))
  }
  useEffect(() => { load() }, [])

  const run = async (kind) => {
    const url = kind === 'all' ? '/admin/ai/run' : kind === 'feedback' ? '/admin/ai/feedback/run' : '/admin/ai/moderation/run'
    const res = await api.post(url)
    setLastRun(res.data)
    load()
  }

  const statusLabel = (s) => {
    if (s === 'APPROVED') return 'Опубликован'
    if (s === 'REJECTED') return 'Отклонён'
    return 'На проверке'
  }

  const statusBadge = (s) => {
    if (s === 'APPROVED') return 'badge-approved'
    if (s === 'REJECTED') return 'badge-rejected'
    return 'badge-pending'
  }

  return (
    <div>
      <h1>AI‑модерация отзывов</h1>
      <div className="card">
        <div className="section-head">
          <h2>Управление</h2>
          {budget && <span className="muted">Лимит на сегодня: {budget.used}/{budget.limit} токенов (осталось {budget.remaining})</span>}
        </div>
        <div className="flex gap-3 flex-wrap">
          <button type="button" onClick={() => run('moderation')}>Запустить модерацию</button>
          <button type="button" className="secondary" onClick={() => run('feedback')}>Обновить фидбэк</button>
          <button type="button" className="secondary" onClick={() => run('all')}>Запустить всё</button>
        </div>
        {lastRun && (
          <p className="muted">Последний запуск: {JSON.stringify(lastRun)}</p>
        )}
      </div>
      <div className="grid">
        {reviews.map((review) => (
          <div className="card" key={review.id}>
            <strong>{review.clientName}</strong>
            <div className="flex items-center justify-between gap-3 mt-2">
              <span className="muted">{review.targetType}</span>
              <span className={`badge ${statusBadge(review.status)}`}>{statusLabel(review.status)}</span>
            </div>
            <p className="muted">Оценка: {review.rating}/5</p>
            <p>{review.comment || 'Без комментария'}</p>
            {review.status === 'REJECTED' && review.rejectionReason && (
              <p className="error">Причина: {review.rejectionReason}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
