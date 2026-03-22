import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { isLoggedIn } from '../utils/auth'
import ShinyButton from '../components/ui/ShinyButton'

export default function LandingPage() {
  const [stats, setStats] = useState(null)
  const [workshops, setWorkshops] = useState([])
  const [services, setServices] = useState([])

  const loggedIn = isLoggedIn()

  useEffect(() => {
    api.get('/public/stats').then((r) => setStats(r.data)).catch(() => {})
    api.get('/workshops').then((r) => setWorkshops(r.data)).catch(() => {})
    api.get('/services').then((r) => setServices(r.data)).catch(() => {})
  }, [])

  const featuredServices = useMemo(() => services.slice(0, 6), [services])
  const featuredWorkshops = useMemo(() => workshops.slice(0, 3), [workshops])

  return (
    <div className="stack">
      <section className="hero card">
        <div className="hero-inner">
          <div>
            <h1>Премиальный детейлинг в Самаре</h1>
            <p className="hero-sub">
              MikhaDetail — аккуратная химчистка, полировка, керамика и комплексная мойка.
              Прозрачный прайс, реальные отзывы и удобная онлайн-запись.
            </p>
            <div className="hero-actions">
              {loggedIn ? (
                <ShinyButton as={Link} to="/dashboard">Перейти в кабинет</ShinyButton>
              ) : (
                <>
                  <ShinyButton as={Link} to="/register">Записаться</ShinyButton>
                  <Link className="btn secondary" to="/services">Посмотреть прайс</Link>
                </>
              )}
            </div>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <div className="stat-value">{stats ? stats.workshops : '—'}</div>
              <div className="stat-label">точек</div>
            </div>
            <div className="stat">
              <div className="stat-value">{stats ? stats.services : '—'}</div>
              <div className="stat-label">услуг</div>
            </div>
            <div className="stat">
              <div className="stat-value">{stats ? stats.appointments : '—'}</div>
              <div className="stat-label">записей</div>
            </div>
            <div className="stat">
              <div className="stat-value">{stats ? stats.reviews : '—'}</div>
              <div className="stat-label">отзывов</div>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Почему мы</h2>
        <div className="grid">
          <div className="card feature">
            <h4>Чистота деталей</h4>
            <p>Работаем аккуратно: сушка, деликатные материалы, безопасные составы.</p>
          </div>
          <div className="card feature">
            <h4>Понятный прайс</h4>
            <p>Цены и длительность работ — сразу на сайте, без “сюрпризов”.</p>
          </div>
          <div className="card feature">
            <h4>Удобная запись</h4>
            <p>Онлайн-кабинет: ваши автомобили, записи, отмена при необходимости.</p>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <h2>Точки обслуживания</h2>
          <Link className="btn secondary" to="/workshops">Все точки</Link>
        </div>
        <div className="grid">
          {featuredWorkshops.map((w) => (
            <article key={w.id} className="card">
              <h4>{w.name}</h4>
              <p>{w.address}</p>
              <p className="muted">{w.workingHours}</p>
              <Link to={`/workshops/${w.id}`}>Подробнее</Link>
            </article>
          ))}
          {!featuredWorkshops.length && <p className="muted">Загрузка…</p>}
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <h2>Популярные услуги</h2>
          <Link className="btn secondary" to="/services">Весь прайс</Link>
        </div>
        <div className="grid">
          {featuredServices.map((s) => (
            <article key={s.id} className="card">
              <h4>{s.name}</h4>
              <p className="muted">{s.workshopName}</p>
              <p>{s.durationMinutes} мин • {s.price} ₽</p>
            </article>
          ))}
          {!featuredServices.length && <p className="muted">Загрузка…</p>}
        </div>
      </section>

      <section className="card cta">
        <div>
          <h2>Готовы привести авто в порядок?</h2>
          <p className="muted">Создайте аккаунт и записывайтесь онлайн в пару кликов.</p>
        </div>
        <div className="cta-actions">
          <ShinyButton as={Link} to="/register">Регистрация</ShinyButton>
          <Link className="btn secondary" to="/login">Вход</Link>
        </div>
      </section>
    </div>
  )
}
