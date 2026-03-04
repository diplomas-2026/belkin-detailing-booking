export const getStoredUser = () => {
  const raw = localStorage.getItem('user')
  return raw ? JSON.parse(raw) : null
}

export const isLoggedIn = () => Boolean(localStorage.getItem('token'))

export const hasRole = (user, role) => user?.role === role

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}
