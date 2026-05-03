/**
 * DEV-only Firebase / Vite env diagnostics — never logs full secrets.
 */

function maskSensitive(value, prefixLabel = '') {
  if (!value || typeof value !== 'string') {
    return `(empty)`
  }
  const s = value.trim()
  const masked = `${s.slice(0, 8)}…${s.slice(-4)} (len=${s.length})`
  const short = `(too short, len=${s.length})`
  if (s.length < 10) return prefixLabel ? `${prefixLabel}: ${short}` : short
  return prefixLabel ? `${prefixLabel}: ${masked}` : masked
}

/**
 * @param {Record<string, string>} firebaseConfig
 * @param {boolean} isConfigured
 */
export function logFirebaseClientDiagnostics(firebaseConfig, isConfigured) {
  if (!import.meta.env.DEV) return

  const rawKey = import.meta.env.VITE_FIREBASE_API_KEY
  console.groupCollapsed('[firebase:diag] runtime config check')
  console.info('[firebase:diag] Vite MODE:', import.meta.env.MODE)
  console.info('[firebase:diag] isFirebaseClientConfigured():', isConfigured)
  console.info('[firebase:diag]', maskSensitive(String(rawKey ?? ''), 'env VITE_FIREBASE_API_KEY (raw env, before readEnv)'))
  console.info('[firebase:diag]', maskSensitive(firebaseConfig.apiKey ?? '', 'config.apiKey passed to initializeApp'))
  console.info('[firebase:diag] key character counts:', {
    rawImportMetaLength: typeof rawKey === 'string' ? rawKey.length : 0,
    afterReadEnvLength: (firebaseConfig.apiKey ?? '').length,
  })
  console.info('[firebase:diag] object passed to initializeApp (masked):', {
    apiKey: maskSensitive(firebaseConfig.apiKey ?? '', ''),
    authDomain: firebaseConfig.authDomain || '(empty)',
    projectId: firebaseConfig.projectId || '(empty)',
    storageBucket: firebaseConfig.storageBucket || '(empty)',
    messagingSenderId: firebaseConfig.messagingSenderId || '(empty)',
    appId: firebaseConfig.appId ? maskSensitive(firebaseConfig.appId, '') : '(empty)',
  })
  console.info('[firebase:diag] Raw import.meta.env lengths:', {
    VITE_FIREBASE_API_KEY: typeof rawKey === 'string' ? `len=${rawKey.length}` : '(missing)',
    VITE_FIREBASE_AUTH_DOMAIN: lenOf(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
    VITE_FIREBASE_PROJECT_ID: lenOf(import.meta.env.VITE_FIREBASE_PROJECT_ID),
    VITE_FIREBASE_STORAGE_BUCKET: lenOf(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
    VITE_FIREBASE_MESSAGING_SENDER_ID: lenOf(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    VITE_FIREBASE_APP_ID: lenOf(import.meta.env.VITE_FIREBASE_APP_ID),
  })

  const key = firebaseConfig.apiKey ?? ''
  const looksLikeBrowserKey = key.startsWith('AIza')
  if (isConfigured && key.length >= 30) {
    if (!looksLikeBrowserKey) {
      console.warn(
        '[firebase:diag] Typical Web SDK keys start with AIzaSy — confirm this is from Firebase Console → Project settings → your Web app.'
      )
    }
    console.warn(
      '[firebase:diag] If you still see auth/api-key-not-valid:',
      '\n • Google Cloud → APIs & Credentials → Browser key:',
      '\n   – Application restrictions: allow http://localhost:5173/* (and 127.0.0.1) or temporarily None.',
      '\n   – API restrictions: allow Identity Toolkit API (Firebase Authentication).'
    )
  }

  console.groupEnd()
}

function lenOf(val) {
  if (val == null || val === '') return '(missing)'
  return `len=${String(val).length}`
}
