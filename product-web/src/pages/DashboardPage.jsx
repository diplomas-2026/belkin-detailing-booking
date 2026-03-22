import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { getStoredUser } from '../utils/auth'

function BarRow({ label, value, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="bar-row">
      <div className="bar-meta">
        <span className="text-white">{label}</span>
        <span className="muted">{value} • {pct}%</span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const user = getStoredUser()
  const [stats, setStats] = useState(null)
  const [recentReviews, setRecentReviews] = useState([])
  const [tasks, setTasks] = useState([])
  const [feedback, setFeedback] = useState([])

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.get('/admin/dashboard').then((res) => setStats(res.data))
    }
    if (user?.role === 'CLIENT') {
      api.get('/public/reviews/recent?limit=12').then((res) => setRecentReviews(res.data)).catch(() => setRecentReviews([]))
    }
    if (user?.role === 'MASTER') {
      api.get('/master/appointments').then((res) => setTasks(res.data)).catch(() => setTasks([]))
    }
    api.get('/public/feedback').then((r) => setFeedback(r.data)).catch(() => setFeedback([]))
  }, [user?.role])

  const aiWorkshop = feedback.find((f) => f.targetType === 'WORKSHOP')?.summary
  const aiMaster = feedback.find((f) => f.targetType === 'MASTER')?.summary

  const masterTotal = tasks.length
  const masterConfirmed = tasks.filter((t) => t.status === 'CONFIRMED').length
  const masterInProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length
  const masterCompleted = tasks.filter((t) => t.status === 'COMPLETED').length

  return (
    <div className="stack">
      <h1>Панель управления</h1>
      <p>Добро пожаловать, {user?.fullName}</p>
      {user?.role === 'ADMIN' && stats && (
        <>
          <div className="grid">
            <div className="card"><h3>Всего записей</h3><p>{stats.totalAppointments}</p></div>
            <div className="card"><h3>Новые</h3><p>{stats.newAppointments}</p></div>
            <div className="card"><h3>В работе</h3><p>{stats.inProgressAppointments}</p></div>
            <div className="card"><h3>Выполнено</h3><p>{stats.completedAppointments}</p></div>
            <div className="card"><h3>Выручка</h3><p>{stats.revenue} ₽</p></div>
          </div>
          <div className="card">
            <h2>График по статусам</h2>
            <div className="stack">
              <BarRow label="Новые" value={stats.newAppointments} total={stats.totalAppointments} />
              <BarRow label="В работе" value={stats.inProgressAppointments} total={stats.totalAppointments} />
              <BarRow label="Выполнено" value={stats.completedAppointments} total={stats.totalAppointments} />
            </div>
          </div>
        </>
      )}

      {user?.role === 'MASTER' && (
        <>
          <div className="grid">
            <div className="card"><h3>Всего задач</h3><p>{masterTotal}</p></div>
            <div className="card"><h3>Ожидают</h3><p>{masterConfirmed}</p></div>
            <div className="card"><h3>В работе</h3><p>{masterInProgress}</p></div>
            <div className="card"><h3>Завершены</h3><p>{masterCompleted}</p></div>
          </div>
          <div className="card">
            <h2>График по задачам</h2>
            <div className="stack">
              <BarRow label="Ожидают" value={masterConfirmed} total={masterTotal} />
              <BarRow label="В работе" value={masterInProgress} total={masterTotal} />
              <BarRow label="Завершены" value={masterCompleted} total={masterTotal} />
            </div>
            <div className="mt-3">
              <Link className="btn secondary" to="/master/tasks">Перейти к задачам</Link>
            </div>
          </div>
        </>
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

      {(aiWorkshop || aiMaster) && (
        <div className="card">
          <h2>AI‑фидбэк</h2>
          {aiWorkshop && (
            <div className="card">
              <h3>По салонам</h3>
              <p className="muted">{aiWorkshop}</p>
            </div>
          )}
          {aiMaster && (
            <div className="card">
              <h3>По мастерам</h3>
              <p className="muted">{aiMaster}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
