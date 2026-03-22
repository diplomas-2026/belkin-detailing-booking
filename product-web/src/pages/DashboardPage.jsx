import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { getStoredUser } from '../utils/auth'

export default function DashboardPage() {
  const user = getStoredUser()
  const [stats, setStats] = useState(null)
  const [recentReviews, setRecentReviews] = useState([])

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.get('/admin/dashboard').then((res) => setStats(res.data))
    }
    if (user?.role === 'CLIENT') {
      api.get('/public/reviews/recent?limit=12').then((res) => setRecentReviews(res.data)).catch(() => setRecentReviews([]))
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

      {user?.role === 'CLIENT' && (
        <div className="stack">
          <div className="grid">
            <div className="card">
              <h3>Салоны</h3>
              <p className="muted">Адреса, режим работы, услуги и фото.</p>
              <Link className="btn secondary" to="/workshops">Перейти</Link>
            </div>
            <div className="card">
              <h3>Мои автомобили</h3>
              <p className="muted">Добавьте авто и храните данные для записи.</p>
              <Link className="btn secondary" to="/my-cars">Перейти</Link>
            </div>
            <div className="card">
              <h3>Мои записи</h3>
              <p className="muted">Создание, просмотр деталей и отмена.</p>
              <Link className="btn secondary" to="/my-appointments">Перейти</Link>
            </div>
          </div>

          <div className="card">
            <div className="section-head">
              <h2>Отзывы</h2>
              <Link className="btn secondary" to="/reviews">Все отзывы</Link>
            </div>
            {!recentReviews.length ? (
              <p className="muted">Пока нет отзывов.</p>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {recentReviews.map((r) => (
                  <article key={r.id} className="card min-w-[260px] max-w-[320px]">
                    <div className="review-head">
                      <strong className="text-white">{r.clientName}</strong>
                      <span className="muted">{r.rating}/5</span>
                    </div>
                    <p className="text-white/75">{r.comment || 'Без комментария'}</p>
                    <p className="muted">{new Date(r.createdAt).toLocaleDateString('ru-RU')}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {user?.role !== 'ADMIN' && user?.role !== 'CLIENT' && (
        <div className="card">Используйте меню слева для работы с задачами и записями.</div>
      )}
    </div>
  )
}
