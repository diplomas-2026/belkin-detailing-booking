import { useEffect, useState } from 'react'
import api from '../api'
import { getStoredUser } from '../utils/auth'

export default function DashboardPage() {
  const user = getStoredUser()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.get('/admin/dashboard').then((res) => setStats(res.data))
    }
  }, [user?.role])

  return (
    <div>
      <h1>Панель управления</h1>
      <p>Добро пожаловать, {user?.fullName}</p>
      {user?.role === 'ADMIN' && stats && (
        <div className="grid">
          <div className="card"><h3>Всего записей</h3><p>{stats.totalAppointments}</p></div>
          <div className="card"><h3>Новые</h3><p>{stats.newAppointments}</p></div>
          <div className="card"><h3>В работе</h3><p>{stats.inProgressAppointments}</p></div>
          <div className="card"><h3>Выполнено</h3><p>{stats.completedAppointments}</p></div>
          <div className="card"><h3>Выручка</h3><p>{stats.revenue} ₽</p></div>
        </div>
      )}
      {user?.role !== 'ADMIN' && <div className="card">Используйте меню слева для работы с записями и отзывами.</div>}
    </div>
  )
}
