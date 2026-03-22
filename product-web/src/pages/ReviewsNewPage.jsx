import { useEffect, useState } from 'react'
import api from '../api'

const initial = { appointmentId: '', targetType: 'WORKSHOP', workshopId: '', serviceId: '', masterId: '', rating: 5, comment: '' }

export default function ReviewsNewPage() {
  const [appointments, setAppointments] = useState([])
  const [form, setForm] = useState(initial)

  useEffect(() => {
    api.get('/appointments/my').then((r) => {
      const completed = r.data.filter((a) => a.status === 'COMPLETED')
      setAppointments(completed)
      if (completed[0]) {
        setForm((prev) => ({ ...prev, appointmentId: completed[0].id, workshopId: completed[0].workshopId, serviceId: completed[0].serviceId, masterId: completed[0].masterId || '' }))
      }
    })
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
    alert('Отзыв отправлен')
  }

  return (
    <div>
      <h1>Оставить отзыв</h1>
      <div className="stack">
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
          <textarea placeholder="Комментарий" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
          <button type="submit">Отправить отзыв</button>
        </form>
      </div>
    </div>
  )
}
