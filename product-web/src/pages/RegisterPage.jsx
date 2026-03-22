import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import Field from '../components/ui/Field'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const passwordMismatch = useMemo(() => {
    if (!confirmPassword) return false
    return password !== confirmPassword
  }, [password, confirmPassword])

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) return setError('Укажите имя')
    if (!email.trim()) return setError('Укажите email')
    if (!password) return setError('Укажите пароль')
    if (password.length < 8) return setError('Пароль должен быть не короче 8 символов')
    if (passwordMismatch) return setError('Пароли не совпадают')

    setSubmitting(true)
    try {
      const { data } = await api.post('/auth/register', { fullName, email, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/dashboard')
    } catch (e2) {
      const msg = e2?.response?.data?.message
      setError(typeof msg === 'string' ? msg : 'Не удалось зарегистрироваться')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <div className="auth-head">
          <h1>Регистрация</h1>
          <p>Онлайн-запись на детейлинг</p>
        </div>

        <Field label="Имя и фамилия" value={fullName}>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Например: Иван Петров" autoComplete="name" />
        </Field>

        <Field label="Email" value={email}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@mail.ru" autoComplete="email" />
        </Field>

        <Field label="Пароль" value={password}>
          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 8 символов"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                  <path d="M4 4 20 20" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                </svg>
              )}
            </button>
          </div>
        </Field>

        <Field label="Повторите пароль" value={confirmPassword}>
          <div className="password-field">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повторите пароль"
              autoComplete="new-password"
              aria-invalid={passwordMismatch ? 'true' : 'false'}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
              title={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
            >
              {showConfirmPassword ? (
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                  <path d="M4 4 20 20" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                </svg>
              )}
            </button>
          </div>
        </Field>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
        </button>

        <p className="muted">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </form>
    </div>
  )
}
