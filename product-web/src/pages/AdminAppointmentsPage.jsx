import { useEffect, useState } from 'react'
import api from '../api'
import { appointmentStatusLabel } from '../utils/appointmentStatus'

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [masters, setMasters] = useState([])

  const load = () => {
    api.get('/admin/appointments').then((r) => setAppointments(r.data))
    api.get('/admin/masters').then((r) => setMasters(r.data))
  }

  useEffect(() => { load() }, [])

  const assign = async (appointmentId, masterId) => {
    await api.patch(`/admin/appointments/${appointmentId}/assign-master`, { masterId: Number(masterId) })
    load()
  }

  const setStatus = async (id, status) => {
    await api.patch(`/admin/appointments/${id}/status`, { status, comment: 'Обновлено администратором' })
    load()
  }

  return (
    <div>
      <h1>Записи клиентов</h1>
      <div className="grid">
        {appointments.map((a) => (
          <div key={a.id} className="card">
            <h4>{a.serviceName}</h4>
            <p>{a.workshopName}</p>
            <p>Клиент: {a.carLabel}</p>
            <p>
              Статус:{' '}
              <span className={`badge badge-${a.status?.toLowerCase?.() || 'unknown'}`}>
                {appointmentStatusLabel(a.status)}
              </span>
            </p>
            {a.masterId ? <p>Мастер: {a.masterName}</p> : <p>Мастер не назначен</p>}
            {!a.masterId && (
              <select onChange={(e) => assign(a.id, e.target.value)} defaultValue="">
                <option value="" disabled>Назначить мастера</option>
                {masters.filter((m) => m.workshopId === a.workshopId).map((m) => (
                  <option key={m.id} value={m.id}>{m.fullName}</option>
                ))}
              </select>
            )}
            {a.status === 'NEW' && <button onClick={() => setStatus(a.id, 'CONFIRMED')}>Подтвердить</button>}
            {a.status === 'CONFIRMED' && <button onClick={() => setStatus(a.id, 'IN_PROGRESS')}>В работу</button>}
          </div>
        ))}
      </div>
    </div>
  )
}
