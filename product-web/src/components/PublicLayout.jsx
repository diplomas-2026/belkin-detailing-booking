import { Link, NavLink, useNavigate } from 'react-router-dom'
import { getStoredUser, isLoggedIn, logout } from '../utils/auth'

export default function PublicLayout({ children }) {
  const navigate = useNavigate()
  const loggedIn = isLoggedIn()
  const user = getStoredUser()

  return (
    <div className="public-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="topbar-brand">MikhaDetail</Link>

          <nav className="topbar-nav">
            <NavLink to="/" end className={({ isActive }) => `topbar-link${isActive ? ' active' : ''}`}>Главная</NavLink>
            <NavLink to="/workshops" className={({ isActive }) => `topbar-link${isActive ? ' active' : ''}`}>Точки</NavLink>
            <NavLink to="/services" className={({ isActive }) => `topbar-link${isActive ? ' active' : ''}`}>Услуги</NavLink>
            <NavLink to="/reviews" className={({ isActive }) => `topbar-link${isActive ? ' active' : ''}`}>Отзывы</NavLink>
          </nav>

          <div className="topbar-actions">
            {loggedIn ? (
              <>
                <span className="topbar-user">{user?.fullName}</span>
                <Link to="/dashboard" className="btn">Кабинет</Link>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn secondary">Войти</Link>
                <Link to="/register" className="btn">Регистрация</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="content">{children}</main>
    </div>
  )
}

