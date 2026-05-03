/**
 * Firebase Auth exposes `FirebaseError.code` (e.g. auth/user-not-found).
 * Normalize client messaging and optional dev logs.
 */

/**
 * Human-readable message for UI toasts/alerts.
 * @param {unknown} error
 */
export function formatAuthError(error) {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  const message = typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : ''

  const mapByCode = {
    'auth/invalid-email': 'That email address is not valid.',
    'auth/user-disabled': 'This account has been disabled. Contact support.',
    'auth/user-not-found': 'No account found with this email. Sign up first.',
    'auth/wrong-password': 'Incorrect password. Try again or reset password in Firebase Console.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/email-already-in-use': 'This email is already registered — sign in instead.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/popup-blocked': 'Pop-up was blocked. Allow pop-ups for this site and retry.',
    'auth/cancelled-popup-request': 'Another sign-in is already open. Close it and retry.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/invalid-api-key': 'Invalid Firebase API key. Confirm VITE_FIREBASE_API_KEY matches Firebase Console Web app config, restart Vite, check Google Cloud key restrictions.',
    // Firebase sometimes emits this wording with a dotted suffix
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      'API key rejected (Google Cloud restriction or wrong Web app key). Open browser devtools → expand [firebase:diag]; allow Identity Toolkit API and localhost referrer on the Browser key.',
    'auth/unauthorized-domain': 'This domain is not authorized for OAuth. Add it in Firebase Console → Authentication → Settings → Authorized domains.',
    'auth/account-exists-with-different-credential': 'An account exists with another sign-in method. Use email/password or link accounts in Firebase.',
    'auth/operation-not-allowed': 'This sign-in method is disabled in Firebase Console. Enable Google and/or Email/Password.',
  }

  if (code && mapByCode[code]) return mapByCode[code]

  if (/api-key-not-valid|invalid-api-key/i.test(code) || /api-key-not-valid|invalid-api-key/i.test(message)) {
    return mapByCode['auth/api-key-not-valid.-please-pass-a-valid-api-key.'] ?? mapByCode['auth/invalid-api-key']
  }

  if (message.includes('Firebase is not configured')) {
    return 'Firebase is not configured — add VITE_FIREBASE_* keys to frontend/.env and restart the dev server.'
  }

  if (message) return message
  return 'Something went wrong. Please try again.'
}

/**
 * @param {string} operation e.g. "Google sign-in"
 * @param {unknown} error
 */
export function logAuthFailure(operation, error) {
  if (!import.meta.env.DEV) return
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined
  const msg = typeof error === 'object' && error !== null && 'message' in error ? error.message : error
  console.error(`[auth] ${operation} failed`, code ?? '(no code)', msg)
}
