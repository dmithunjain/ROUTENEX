import { Navigate, useLocation } from 'react-router-dom'

import { ROLE_HOME, useAuth } from '@/context/AuthContext'
import { ROUTES } from '@/routes/paths'

/**
 * Redirects visitors to sign-in when a portal needs an authenticated session.
 * A signed-in user who opens another role's workspace is sent to their own home.
 */
export default function RequireAuth({ role, children }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    const next = `${location.pathname}${location.search}`
    const query = new URLSearchParams({ next })
    if (role) query.set('role', role)
    return <Navigate to={`${ROUTES.login}?${query.toString()}`} replace />
  }

  if (role && user.role !== role) {
    return <Navigate to={ROLE_HOME[user.role] ?? ROUTES.home} replace />
  }

  return children
}
