import { useEffect, useState } from 'react'
import api from '../api'
import Field from '../components/ui/Field'

const initial = { appointmentId: '', targetType: 'WORKSHOP', workshopId: '', serviceId: '', masterId: '', rating: 5, comment: '' }

export default function ReviewsNewPage() {
  const [appointments, setAppointments] = useState([])
  const [form, setForm] = useState(initial)
  const [rules, setRules] = useState([])
  const [myReviews, setMyReviews] = useState([])

  useEffect(() => {
    api.get('/public/reviews/moderation-rules').then((r) => setRules(r.data)).catch(() => setRules([]))
    api.get('/appointments/my').then((r) => {
      const completed = r.data.filter((a) => a.status === 'COMPLETED')
      setAppointments(completed)
      if (completed[0]) {
        setForm((prev) => ({ ...prev, appointmentId: completed[0].id, workshopId: completed[0].workshopId, serviceId: completed[0].serviceId, masterId: completed[0].masterId || '' }))
      }
    })
    api.get('/reviews/my').then((r) => setMyReviews(r.data)).catch(() => setMyReviews([]))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    await api.post('/reviews', {
      ...form,
      appointmentId: Number(form.appointmentId),
      workshopId: form.workshopId ? Number(form.workshopId) : null,
      serviceId: form.serviceId ? Number(form.serviceId) : null,
      masterId: form.masterId ? Number(form.masterId) : null,
      rating: Number(form.rating),
    })
    setForm(initial)
    alert('Отзыв отправлен и будет опубликован после AI‑проверки')
    api.get('/reviews/my').then((r) => setMyReviews(r.data)).catch(() => setMyReviews([]))
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
      <h1>Оставить отзыв</h1>
      <div className="stack">
        <div className="card">
          <h2>Правила публикации</h2>
          {!rules.length ? (
            <p className="muted">Правила загрузятся автоматически.</p>
          ) : (
            <ul className="list-disc pl-5 text-white/80">
              {rules.map((x, idx) => <li key={idx}>{x}</li>)}
            </ul>
          )}
        </div>
        <form className="card form-grid" onSubmit={submit}>
          <select value={form.appointmentId} onChange={(e) => setForm({ ...form, appointmentId: e.target.value })}>
            <option value="">Выберите завершенную запись</option>
            {appointments.map((a) => <option key={a.id} value={a.id}>{a.workshopName} - {a.serviceName}</option>)}
          </select>
        <select value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value })}>
          <option value="WORKSHOP">О салоне</option>
          <option value="SERVICE">Об услуге</option>
          <option value="MASTER">О мастере</option>
        </select>
          <input type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
          <Field label="Комментарий" value={form.comment}>
            <textarea placeholder="Комментарий" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
          </Field>
          <button type="submit">Отправить отзыв</button>
        </form>

        <div className="card">
          <div className="section-head">
            <h2>Мои отзывы</h2>
          </div>
          {!myReviews.length ? (
            <p className="muted">Пока нет отзывов.</p>
          ) : (
            <div className="stack">
              {myReviews.map((r) => (
                <div key={r.id} className="card">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-white">{r.targetType}</strong>
                    <span className={`badge ${statusBadge(r.status)}`}>{statusLabel(r.status)}</span>
                  </div>
                  <p className="muted">Оценка: {r.rating}/5</p>
                  {r.comment ? <p>{r.comment}</p> : <p className="muted">Без комментария.</p>}
                  {r.status === 'REJECTED' && r.rejectionReason && (
                    <p className="error">Причина: {r.rejectionReason}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
