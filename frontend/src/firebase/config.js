import { getApp, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { logFirebaseClientDiagnostics } from './diagnostics'

/** Named app avoids mixing with another default `[DEFAULT]` app on the origin (different config sources). */
const FIREBASE_SINGLETON_NAME = 'smart-expense-tracker-web'

/**
 * Reads Vite env only — trims, strips BOM/quotes/invisible chars commonly breaking API keys.
 * No fallback values; invalid → ''.
 */
function readEnv(key) {
  let raw = import.meta.env[key]
  if (raw == null || raw === undefined) return ''
  let s = String(raw)
  // UTF-8 BOM from some editors
  s = s.replace(/^\uFEFF/, '')
  s = s.trim()
  // Strip wrapping quotes users sometimes paste ("AIza...")
  while (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim()
  }
  return s
}

/** Rejects placeholders only — no substitute API keys elsewhere. */
function isProvidedFirebaseValue(value) {
  if (!value || typeof value !== 'string') return false
  const v = value.trim()
  if (!v) return false
  if (/^YOUR_/i.test(v)) return false
  if (/your[_-]?api[_-]?key/i.test(v)) return false
  if (/REPLACE(_ME)?/i.test(v)) return false
  return true
}

/** Single source of truth — only import.meta.env (VITE_*). Nothing hardcoded. */
const firebaseConfig = {
  apiKey: readEnv('VITE_FIREBASE_API_KEY'),
  authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnv('VITE_FIREBASE_APP_ID'),
}

const configured = Boolean(
  isProvidedFirebaseValue(firebaseConfig.apiKey) &&
    isProvidedFirebaseValue(firebaseConfig.authDomain) &&
    isProvidedFirebaseValue(firebaseConfig.projectId) &&
    isProvidedFirebaseValue(firebaseConfig.storageBucket) &&
    isProvidedFirebaseValue(firebaseConfig.messagingSenderId) &&
    isProvidedFirebaseValue(firebaseConfig.appId)
)

logFirebaseClientDiagnostics(firebaseConfig, configured)

/**
 * True only when every field is present and looks real (no YOUR_* placeholders).
 */
export function isFirebaseClientConfigured() {
  return configured
}

function createAuthSafely() {
  if (!configured) {
    if (import.meta.env.DEV) {
      console.info('[firebase] Client not initialized: incomplete or placeholder VITE_FIREBASE_* env vars.')
    }
    return null
  }

  try {
    let app
    try {
      app = getApp(FIREBASE_SINGLETON_NAME)
    } catch {
      app = initializeApp(firebaseConfig, FIREBASE_SINGLETON_NAME)
    }

    const authInstance = getAuth(app)

    if (import.meta.env.DEV) {
      console.info('[firebase] App "%s" + getAuth initialized', FIREBASE_SINGLETON_NAME, {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
      })
    }
    return authInstance
  } catch (e) {
    if (import.meta.env.DEV) {
      console.error('[firebase] initializeApp/getAuth failed:', e?.message ?? e)
    }
    return null
  }
}

/** getAuth(...) for our named app only when env validates — never throws at import time. */
export const auth = createAuthSafely()
