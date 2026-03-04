import { Navigate } from 'react-router-dom'
import { getStoredUser, isLoggedIn } from '../utils/auth'

export default function ProtectedRoute({ children, roles }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />
  }

  const user = getStoredUser()
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
