import { useEffect, useState } from 'react'
import api from '../api'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [budget, setBudget] = useState(null)
  const [lastRun, setLastRun] = useState(null)
  const [loading, setLoading] = useState('')

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
    if (loading) return
    setLoading(kind)
    const url = kind === 'all' ? '/admin/ai/run' : kind === 'feedback' ? '/admin/ai/feedback/run' : '/admin/ai/moderation/run'
    try {
      const res = await api.post(url)
      setLastRun(res.data)
      load()
    } finally {
      setLoading('')
    }
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

  const normalizeRuns = (data) => {
    if (!data) return []
    return Array.isArray(data) ? data : [data]
  }

  const jobLabel = (job) => {
    if (job === 'moderation') return 'Модерация'
    if (job === 'feedback') return 'Фидбэк'
    return job || '—'
  }

  const noteClass = (note = '') => {
    const n = String(note).toLowerCase()
    if (n.includes('лимит') || n.includes('пропущ')) return 'run-note warn'
    if (n.includes('ошиб') || n.includes('не удалось')) return 'run-note bad'
    return 'run-note ok'
  }

  return (
    <div>
      <h1>AI‑модерация отзывов</h1>
      <div className="card">
        <div className="section-head">
          <h2>Управление</h2>
          {budget && (
            <span className="muted">
              Лимит на сегодня: <strong className="text-white">{budget.used}/{budget.limit}</strong> токенов (осталось <strong className="text-white">{budget.remaining}</strong>)
            </span>
          )}
        </div>
        <div className="flex gap-3 flex-wrap">
          <button type="button" onClick={() => run('moderation')} disabled={!!loading}>
            {loading === 'moderation' ? 'Запуск…' : 'Запустить модерацию'}
          </button>
          <button type="button" className="secondary" onClick={() => run('feedback')} disabled={!!loading}>
            {loading === 'feedback' ? 'Запуск…' : 'Обновить фидбэк'}
          </button>
          <button type="button" className="secondary" onClick={() => run('all')} disabled={!!loading}>
            {loading === 'all' ? 'Запуск…' : 'Запустить всё'}
          </button>
        </div>
        {lastRun && (
          <div className="run-box">
            <h3 className="run-title">Результат последнего запуска</h3>
            <div className="stack">
              {normalizeRuns(lastRun).map((r, idx) => (
                <div className="run-row" key={idx}>
                  <div className="run-head">
                    <strong className="text-white">{jobLabel(r.job)}</strong>
                    {r.budget && (
                      <span className="muted">
                        Токены: <strong className="text-white">{r.budget.used}</strong>/<strong className="text-white">{r.budget.limit}</strong> (осталось <strong className="text-white">{r.budget.remaining}</strong>)
                      </span>
                    )}
                  </div>
                  <div className="run-metrics">
                    <span className="badge badge-unknown">Обработано: {r.processedOrUpdated}</span>
                    <span className="badge badge-unknown">LLM вызовов: {r.llmCalls}</span>
                  </div>
                  <div className={noteClass(r.note)}>{r.note}</div>
                </div>
              ))}
            </div>
          </div>
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
