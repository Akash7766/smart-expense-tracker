import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/**
 * App shell routes (dashboard, expenses, insights): require Firebase user session.
 * Session persistence: Firebase Auth stores the refresh token in the browser automatically;
 * onAuthStateChanged in AuthProvider restores user after reload (no manual localStorage token).
 */
export default function ProtectedRoute({ children }) {
  const { user, loading, firebaseConfigured } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-3">
        <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-400 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading session…</p>
      </div>
    )
  }

  if (!firebaseConfigured) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
