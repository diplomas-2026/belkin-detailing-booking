import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api'
import Field from '../components/ui/Field'

export default function MyAppointmentPayPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [payForm, setPayForm] = useState({ cardNumber: '', exp: '', cvc: '', holder: '' })

  useEffect(() => {
    setError('')
    api.get(`/appointments/${id}`)
      .then((r) => setAppointment(r.data))
      .catch(() => setError('Не удалось загрузить запись'))
  }, [id])

  const payNow = async () => {
    if (busy || !appointment) return
    setBusy(true)
    setError('')
    try {
      await api.post(`/appointments/${appointment.id}/payment/pay-now`, payForm)
      navigate(`/my-appointments/${appointment.id}`)
    } catch (e) {
      setError('Не удалось выполнить оплату')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Оплата</h1>
          <p className="muted">Данные карты не сохраняются.</p>
        </div>
        <div className="page-controls">
          <Link className="btn secondary" to={`/my-appointments/${id}`}>Назад</Link>
        </div>
      </div>

      {error && <div className="card"><p className="error">{error}</p></div>}
      {!error && !appointment && <div className="card"><p className="muted">Загрузка…</p></div>}

      {appointment && (
        <div className="card">
          <div className="section-head">
            <div>
              <h2>{appointment.serviceName}</h2>
              <p className="muted">{appointment.workshopName}</p>
            </div>
            <strong className="text-white">{appointment.totalPrice} ₽</strong>
          </div>

          <div className="form-grid">
            <Field label="Номер карты" value={payForm.cardNumber}>
              <input placeholder="Номер карты" value={payForm.cardNumber} onChange={(e) => setPayForm({ ...payForm, cardNumber: e.target.value })} />
            </Field>
            <Field label="Срок действия" value={payForm.exp}>
              <input placeholder="MM/YY" value={payForm.exp} onChange={(e) => setPayForm({ ...payForm, exp: e.target.value })} />
            </Field>
            <Field label="CVC" value={payForm.cvc}>
              <input placeholder="CVC" value={payForm.cvc} onChange={(e) => setPayForm({ ...payForm, cvc: e.target.value })} />
            </Field>
            <Field label="Держатель" value={payForm.holder}>
              <input placeholder="Держатель" value={payForm.holder} onChange={(e) => setPayForm({ ...payForm, holder: e.target.value })} />
            </Field>
            <button
              type="button"
              onClick={payNow}
              disabled={busy || !payForm.cardNumber || !payForm.exp || !payForm.cvc || !payForm.holder}
            >
              {busy ? 'Оплата…' : 'Подтвердить оплату'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
