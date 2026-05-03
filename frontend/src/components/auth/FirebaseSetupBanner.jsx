import { useAuth } from '../../hooks/useAuth'

/**
 * Shows when Firebase web env vars are missing so the bundle still loads without throwing.
 */
export default function FirebaseSetupBanner() {
  const { firebaseConfigured } = useAuth()
  if (firebaseConfigured) return null

  return (
    <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-left text-xs text-amber-100 leading-relaxed">
      <p className="font-semibold text-amber-50 mb-1">Firebase client not configured</p>
      <p className="text-amber-200/90 mb-2">
        Add all <code className="text-amber-100 bg-black/20 px-1 rounded">VITE_FIREBASE_*</code> variables to{' '}
        <code className="text-amber-100 bg-black/20 px-1 rounded">frontend/.env</code>, then restart Vite (
        <code className="text-amber-100 bg-black/20 px-1 rounded">npm run dev</code>). Copy{' '}
        <code className="text-amber-100 bg-black/20 px-1 rounded">frontend/.env.example</code>.
      </p>
      <p className="text-slate-500">
        Backend also needs{' '}
        <code className="text-slate-400 bg-black/20 px-1 rounded">FIREBASE_SERVICE_ACCOUNT_JSON</code> or{' '}
        <code className="text-slate-400 bg-black/20 px-1 rounded">GOOGLE_APPLICATION_CREDENTIALS</code>.
      </p>
    </div>
  )
}
