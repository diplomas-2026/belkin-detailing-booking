import { Link, useNavigate } from 'react-router-dom'
import { getStoredUser, logout } from '../utils/auth'

const navByRole = {
  CLIENT: [
    { to: '/dashboard', label: 'Главная' },
    { to: '/workshops', label: 'Точки' },
    { to: '/my-cars', label: 'Мои автомобили' },
    { to: '/my-appointments', label: 'Мои записи' },
    { to: '/reviews/new', label: 'Оставить отзыв' },
  ],
  MASTER: [
    { to: '/dashboard', label: 'Главная' },
    { to: '/master/tasks', label: 'Мои задачи' },
    { to: '/master/reviews', label: 'Отзывы' },
    { to: '/workshops', label: 'Точки' },
  ],
  ADMIN: [
    { to: '/dashboard', label: 'Главная' },
    { to: '/workshops', label: 'Точки' },
    { to: '/admin/workshops', label: 'Управление точками' },
    { to: '/admin/appointments', label: 'Записи' },
    { to: '/admin/services', label: 'Услуги' },
    { to: '/admin/reviews', label: 'Отзывы' },
  ],
}

export default function Layout({ children }) {
  const user = getStoredUser()
  const navigate = useNavigate()
  const nav = navByRole[user?.role] || []

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">MikhaDetail</div>
        <div className="user-box">
          <p>{user?.fullName}</p>
          <span>{user?.role}</span>
        </div>
        <nav>
          {nav.map((item) => (
            <Link key={item.to} to={item.to} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          className="secondary"
          onClick={() => {
            logout()
            navigate('/login')
          }}
        >
          Выйти
        </button>
      </aside>
      <main className="content">{children}</main>
    </div>
  )
}
