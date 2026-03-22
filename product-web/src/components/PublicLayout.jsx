import { Link, NavLink, useNavigate } from 'react-router-dom'
import { getStoredUser, isLoggedIn, logout } from '../utils/auth'

export default function PublicLayout({ children }) {
  const navigate = useNavigate()
  const loggedIn = isLoggedIn()
  const user = getStoredUser()

  return (
    <div className="public-shell">
      <aside className="public-sidebar">
        <Link to="/" className="brand">MikhaDetail</Link>

        {loggedIn && (
          <div className="user-box">
            <p>{user?.fullName}</p>
            <span>Клиентский кабинет</span>
          </div>
        )}

        <nav className="stack">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Главная</NavLink>
          <NavLink to="/workshops" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Точки</NavLink>
          <NavLink to="/services" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Услуги / прайс</NavLink>
          <NavLink to="/reviews" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Отзывы</NavLink>
        </nav>

        <div className="public-actions">
          {loggedIn ? (
            <>
              <Link to="/dashboard" className="btn secondary">Перейти в кабинет</Link>
              <button
                type="button"
                className="secondary"
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
      </aside>

      <main className="content">{children}</main>
    </div>
  )
}
