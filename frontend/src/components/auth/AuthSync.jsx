import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { AUTH_UNAUTHORIZED_EVENT } from '../../services/authEvents'

/**
 * Listens for API 401 responses and clears Firebase session so the user can sign in again.
 */
export default function AuthSync() {
  const navigate = useNavigate()
  const { logout, firebaseConfigured } = useAuth()

  useEffect(() => {
    const handler = async () => {
      if (!firebaseConfigured) {
        toast.error('Session expired — configure Firebase client (see Login page).')
        navigate('/login', { replace: true })
        return
      }
      try {
        await logout()
      } catch {
        /* ignore */
      }
      toast.error('Session expired — please sign in again')
      navigate('/login', { replace: true })
    }

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handler)
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handler)
  }, [navigate, logout, firebaseConfigured])

  return null
}
