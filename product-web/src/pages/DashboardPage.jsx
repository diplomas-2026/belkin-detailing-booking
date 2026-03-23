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

function LineChart({ title, labels, series, height = 220 }) {
  const [selected, setSelected] = useState(null)
  const width = 760
  const pad = 28
  const pointsCount = labels.length
  const maxY = Math.max(1, ...series.flatMap((s) => s.values))

  const xFor = (i) => {
    if (pointsCount <= 1) return pad
    return pad + (i * (width - pad * 2)) / (pointsCount - 1)
  }
  const yFor = (v) => {
    const k = v / maxY
    return height - pad - k * (height - pad * 2)
  }

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((k) => ({
    value: Math.round(maxY * k),
    y: yFor(Math.round(maxY * k)),
  }))

  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="chart-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} className="chart">
          <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="rgba(255,255,255,0.12)" />
          <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="rgba(255,255,255,0.12)" />

          {ticks.map((t) => (
            <g key={t.value}>
              <line x1={pad} y1={t.y} x2={width - pad} y2={t.y} stroke="rgba(255,255,255,0.06)" />
              <text x={pad - 8} y={t.y + 4} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.55)">
                {t.value}
              </text>
            </g>
          ))}

          {series.map((s) => {
            const pts = s.values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ')
            return <polyline key={s.name} fill="none" stroke={s.color} strokeWidth="3" points={pts} />
          })}

          {series.map((s) => (
            s.values.map((v, i) => (
              <circle
                key={`${s.name}-${i}`}
                cx={xFor(i)}
                cy={yFor(v)}
                r="4"
                fill={s.color}
                stroke="rgba(0,0,0,0.45)"
                strokeWidth="1"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelected({ series: s.name, label: labels[i], value: v })}
              />
            ))
          ))}

          {labels.map((l, i) => (
            i % Math.ceil(pointsCount / 6) === 0 ? (
              <text key={l} x={xFor(i)} y={height - 10} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.55)">
                {l}
              </text>
            ) : null
          ))}
        </svg>
      </div>
      {selected && (
        <div className="card" style={{ marginTop: 10 }}>
          <div className="section-head">
            <strong className="text-white">Точка</strong>
            <button type="button" className="secondary" onClick={() => setSelected(null)}>Скрыть</button>
          </div>
          <p className="muted">{selected.label} • {selected.series}</p>
          <p className="text-white"><strong>{selected.value}</strong></p>
        </div>
      )}
      <div className="chart-legend">
        {series.map((s) => (
          <div key={s.name} className="legend-item">
            <span className="legend-dot" style={{ background: s.color }} />
            <span className="muted">{s.name}</span>
          </div>
        ))}
        <span className="muted">Макс: {maxY}</span>
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
  const [daily, setDaily] = useState([])

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.get('/admin/dashboard').then((res) => setStats(res.data))
      api.get('/admin/analytics/appointments/daily?days=30').then((r) => setDaily(r.data)).catch(() => setDaily([]))
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

          {!!daily.length && (
            <LineChart
              title="Записи по дням (статусы)"
              labels={daily.map((d) => new Date(d.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }))}
              series={[
                { name: 'Новые', color: 'rgba(56,189,248,0.95)', values: daily.map((d) => d.newCount) },
                { name: 'Подтверждены', color: 'rgba(245,158,11,0.95)', values: daily.map((d) => d.confirmedCount) },
                { name: 'В работе', color: 'rgba(249,115,22,0.95)', values: daily.map((d) => d.inProgressCount) },
                { name: 'Выполнено', color: 'rgba(16,185,129,0.95)', values: daily.map((d) => d.completedCount) },
              ]}
            />
          )}

          {!!daily.length && (
            <LineChart
              title="Выручка по дням"
              labels={daily.map((d) => new Date(d.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }))}
              series={[
                { name: 'Выручка, ₽', color: 'rgba(251,191,36,0.95)', values: daily.map((d) => Number(d.revenue || 0)) },
              ]}
            />
          )}
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
        <div className="stack">
          {aiWorkshop && (
            <div className="ai-feedback">
              <div className="ai-feedback-main">
                <div className="ai-feedback-title">
                  <span className="ai-chip">AI</span>
                  <h3 className="text-white">AI‑фидбэк по салонам</h3>
                </div>
                <p className="muted text-xs">Сводка по всем одобренным отзывам о салонах.</p>
                <p className="ai-feedback-text">{aiWorkshop}</p>
              </div>
            </div>
          )}
          {aiMaster && (
            <div className="ai-feedback">
              <div className="ai-feedback-main">
                <div className="ai-feedback-title">
                  <span className="ai-chip">AI</span>
                  <h3 className="text-white">AI‑фидбэк по мастерам</h3>
                </div>
                <p className="muted text-xs">Сводка по всем одобренным отзывам о мастерах.</p>
                <p className="ai-feedback-text">{aiMaster}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
