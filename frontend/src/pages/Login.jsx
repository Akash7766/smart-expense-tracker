import { useState } from 'react'
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { Button, Card } from '../components/ui'
import FirebaseSetupBanner from '../components/auth/FirebaseSetupBanner'
import { formatAuthError } from '../utils/authErrors'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'
  const {
    user,
    authError,
    signInWithGoogle,
    signInWithEmail,
    loading: authLoading,
    firebaseConfigured,
  } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const handleGoogle = async () => {
    setBusy(true)
    try {
      await signInWithGoogle()
      toast.success('Signed in with Google')
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(formatAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await signInWithEmail(email.trim(), password)
      toast.success('Welcome back')
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(formatAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (user) {
    return <Navigate to={from} replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-500/15 border border-brand-500/25 mb-4">
            <span className="text-2xl">💸</span>
          </div>
          <h1 className="text-xl font-semibold text-white">Sign in to ExpenseIQ</h1>
          <p className="text-sm text-slate-500 mt-1">Track spending and AI insights securely</p>
        </div>

        <FirebaseSetupBanner />

        {authError && (
          <p className="text-xs text-red-400 text-center px-2" role="alert">
            {authError}
          </p>
        )}

        <Card className="p-6 space-y-5">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy || !firebaseConfigured}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-surface-border bg-surface text-sm font-medium text-slate-200 hover:bg-surface-border/40 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-surface-card text-slate-500">or email</span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className={`space-y-4 ${!firebaseConfigured ? 'pointer-events-none opacity-50' : ''}`}>
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-slate-400 mb-1.5">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full input"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-xs font-medium text-slate-400 mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full input"
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" loading={busy} className="w-full">
              Sign in
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-slate-500">
          New here?{' '}
          <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
