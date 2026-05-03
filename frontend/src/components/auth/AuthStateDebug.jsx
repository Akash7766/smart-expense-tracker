import { useMemo } from 'react'
import { useAuth } from '../../hooks/useAuth'

/**
 * DEV-only collapsible showing current auth diagnostics (helps verify login + token wiring).
 */
export default function AuthStateDebug() {
  const v = useAuth()

  const snapshot = useMemo(
    () => ({
      firebaseClientConfigured: v.firebaseConfigured,
      authLoading: v.loading,
      signedIn: Boolean(v.user),
      uid: v.user?.uid ?? null,
      email: v.user?.email ?? null,
      authError: v.authError,
    }),
    [v.firebaseConfigured, v.loading, v.user, v.authError]
  )

  if (!import.meta.env.DEV) return null

  return (
    <details className="text-[10px] text-slate-600 border-t border-surface-border pt-2 mt-2">
      <summary className="cursor-pointer text-slate-500 hover:text-slate-400 select-none">
        Auth state (dev)
      </summary>
      <pre className="mt-2 p-2 rounded-lg bg-black/25 overflow-x-auto text-slate-400 font-mono">
        {JSON.stringify(snapshot, null, 2)}
      </pre>
    </details>
  )
}
