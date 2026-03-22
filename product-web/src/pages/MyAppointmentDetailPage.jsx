import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api'
import { appointmentStatusLabel } from '../utils/appointmentStatus'

export default function MyAppointmentDetailPage() {
  const { id } = useParams()
  const [appointment, setAppointment] = useState(null)
  const [error, setError] = useState('')
  const [reviews, setReviews] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [workshopForm, setWorkshopForm] = useState({ rating: 5, comment: '' })
  const [masterForm, setMasterForm] = useState({ rating: 5, comment: '' })
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentBusy, setPaymentBusy] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [payForm, setPayForm] = useState({ cardNumber: '', exp: '', cvc: '', holder: '' })

  useEffect(() => {
    setError('')
    api.get(`/appointments/${id}`)
      .then((r) => setAppointment(r.data))
      .catch(() => setError('Не удалось загрузить запись'))
  }, [id])

  const reloadAppointment = () => api.get(`/appointments/${id}`).then((r) => setAppointment(r.data)).catch(() => {})

  const loadReviews = () => api.get(`/appointments/${id}/reviews`).then((r) => setReviews(r.data)).catch(() => setReviews([]))

  useEffect(() => {
    loadReviews()
  }, [id])

  const workshopReview = reviews.find((r) => r.targetType === 'WORKSHOP')
  const masterReview = reviews.find((r) => r.targetType === 'MASTER')

  const submitWorkshop = async () => {
    if (!appointment) return
    setSubmitting(true)
    try {
      await api.post('/reviews', {
        appointmentId: Number(appointment.id),
        targetType: 'WORKSHOP',
        workshopId: appointment.workshopId,
        rating: Number(workshopForm.rating),
        comment: workshopForm.comment || '',
      })
      setWorkshopForm({ rating: 5, comment: '' })
      loadReviews()
      alert('Отзыв о салоне отправлен и будет опубликован после AI‑проверки')
    } finally {
      setSubmitting(false)
    }
  }

  const submitMaster = async () => {
    if (!appointment?.masterId) return
    setSubmitting(true)
    try {
      await api.post('/reviews', {
        appointmentId: Number(appointment.id),
        targetType: 'MASTER',
        masterId: appointment.masterId,
        workshopId: appointment.workshopId,
        rating: Number(masterForm.rating),
        comment: masterForm.comment || '',
      })
      setMasterForm({ rating: 5, comment: '' })
      loadReviews()
      alert('Отзыв о мастере отправлен и будет опубликован после AI‑проверки')
    } finally {
      setSubmitting(false)
    }
  }

  const payNow = async () => {
    if (paymentBusy || !appointment) return
    setPaymentError('')
    setPaymentBusy(true)
    try {
      await api.post(`/appointments/${appointment.id}/payment/pay-now`, payForm)
      setPaymentOpen(false)
      setPayForm({ cardNumber: '', exp: '', cvc: '', holder: '' })
      reloadAppointment()
      alert('Оплата принята. Статус обновлён на "Оплачено".')
    } catch (e) {
      setPaymentError('Не удалось выполнить оплату')
    } finally {
      setPaymentBusy(false)
    }
  }

  const payInWorkshop = async () => {
    if (paymentBusy || !appointment) return
    setPaymentError('')
    setPaymentBusy(true)
    try {
      await api.post(`/appointments/${appointment.id}/payment/in-workshop`)
      reloadAppointment()
      alert('Отметили способ оплаты: в салоне.')
    } catch {
      setPaymentError('Не удалось обновить способ оплаты')
    } finally {
      setPaymentBusy(false)
    }
  }

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
        <>
          <div className="card">
            <div className="section-head">
              <div>
                <h2>{appointment.serviceName}</h2>
                {appointment.services?.length > 1 && (
                  <p className="muted">Услуги: {appointment.services.map((s) => s.name).join(', ')}</p>
                )}
              </div>
              <span className={`badge badge-${appointment.status?.toLowerCase?.() || 'unknown'}`}>
                {appointmentStatusLabel(appointment.status)}
              </span>
            </div>
            <div className="grid">
              <div className="card">
                <h4>Салон</h4>
                <p>{appointment.workshopName}</p>
                <p className="muted">{appointment.carLabel}</p>
                <Link className="btn secondary" to={`/workshops/${appointment.workshopId}`}>Открыть салон</Link>
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
              <div className="card">
                <div className="section-head">
                  <h4>Оплата</h4>
                  <span className={`badge ${appointment.paymentStatus === 'PAID' ? 'badge-approved' : 'badge-pending'}`}>
                    {appointment.paymentStatus === 'PAID' ? 'Оплачено' : 'Не оплачено'}
                  </span>
                </div>
                {appointment.paymentMethod && (
                  <p className="muted">
                    Способ: {appointment.paymentMethod === 'NOW' ? 'оплатить сейчас' : 'оплатить в салоне'}
                  </p>
                )}
                {appointment.paymentStatus !== 'PAID' && appointment.status !== 'CANCELLED' && (
                  <div className="stack">
                    <div className="flex gap-2 flex-wrap">
                      <button type="button" onClick={() => setPaymentOpen((v) => !v)} disabled={paymentBusy}>
                        {paymentOpen ? 'Скрыть форму' : 'Оплатить сейчас'}
                      </button>
                      <button type="button" className="secondary" onClick={payInWorkshop} disabled={paymentBusy}>
                        Оплатить в салоне
                      </button>
                    </div>
                    {paymentError && <p className="error">{paymentError}</p>}
                    {paymentOpen && (
                      <div className="card">
                        <h4>Данные карты (не сохраняем)</h4>
                        <div className="form-grid">
                          <input placeholder="Номер карты" value={payForm.cardNumber} onChange={(e) => setPayForm({ ...payForm, cardNumber: e.target.value })} />
                          <input placeholder="MM/YY" value={payForm.exp} onChange={(e) => setPayForm({ ...payForm, exp: e.target.value })} />
                          <input placeholder="CVC" value={payForm.cvc} onChange={(e) => setPayForm({ ...payForm, cvc: e.target.value })} />
                          <input placeholder="Держатель" value={payForm.holder} onChange={(e) => setPayForm({ ...payForm, holder: e.target.value })} />
                          <button type="button" onClick={payNow} disabled={paymentBusy || !payForm.cardNumber || !payForm.exp || !payForm.cvc || !payForm.holder}>
                            {paymentBusy ? 'Оплата…' : 'Подтвердить оплату'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Отзывы по записи</h2>
            {appointment.status !== 'COMPLETED' ? (
              <p className="muted">Оставить отзыв можно после выполнения услуги.</p>
            ) : (
              <div className="stack">
                <div className="card">
                  <div className="section-head">
                    <h3>О салоне</h3>
                    {workshopReview && <span className={`badge ${workshopReview.status === 'APPROVED' ? 'badge-approved' : workshopReview.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}`}>
                      {workshopReview.status === 'APPROVED' ? 'Опубликован' : workshopReview.status === 'REJECTED' ? 'Отклонён' : 'На проверке'}
                    </span>}
                  </div>
                  {workshopReview ? (
                    <>
                      <p className="muted">Оценка: {workshopReview.rating}/5</p>
                      <p>{workshopReview.comment || 'Без комментария'}</p>
                      {workshopReview.status === 'REJECTED' && workshopReview.rejectionReason && (
                        <p className="error">Причина: {workshopReview.rejectionReason}</p>
                      )}
                    </>
                  ) : (
                    <div className="stack">
                      <div className="form-grid">
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={workshopForm.rating}
                          onChange={(e) => setWorkshopForm({ ...workshopForm, rating: e.target.value })}
                        />
                        <textarea
                          placeholder="Комментарий (необязательно)"
                          value={workshopForm.comment}
                          onChange={(e) => setWorkshopForm({ ...workshopForm, comment: e.target.value })}
                        />
                        <button type="button" onClick={submitWorkshop} disabled={submitting}>Отправить отзыв о салоне</button>
                      </div>
                    </div>
                  )}
                </div>

                {appointment.masterId && (
                  <div className="card">
                    <div className="section-head">
                      <h3>О мастере</h3>
                      {masterReview && <span className={`badge ${masterReview.status === 'APPROVED' ? 'badge-approved' : masterReview.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}`}>
                        {masterReview.status === 'APPROVED' ? 'Опубликован' : masterReview.status === 'REJECTED' ? 'Отклонён' : 'На проверке'}
                      </span>}
                    </div>
                    <Link className="btn secondary" to={`/workshops/${appointment.workshopId}/masters/${appointment.masterId}`}>Открыть страницу мастера</Link>
                    {masterReview ? (
                      <>
                        <p className="muted">Оценка: {masterReview.rating}/5</p>
                        <p>{masterReview.comment || 'Без комментария'}</p>
                        {masterReview.status === 'REJECTED' && masterReview.rejectionReason && (
                          <p className="error">Причина: {masterReview.rejectionReason}</p>
                        )}
                      </>
                    ) : (
                      <div className="stack">
                        <div className="form-grid">
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={masterForm.rating}
                            onChange={(e) => setMasterForm({ ...masterForm, rating: e.target.value })}
                          />
                          <textarea
                            placeholder="Комментарий (необязательно)"
                            value={masterForm.comment}
                            onChange={(e) => setMasterForm({ ...masterForm, comment: e.target.value })}
                          />
                          <button type="button" onClick={submitMaster} disabled={submitting}>Отправить отзыв о мастере</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
