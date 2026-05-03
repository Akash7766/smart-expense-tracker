export const AUTH_UNAUTHORIZED_EVENT = 'expenseiq:auth-unauthorized'

/** Call when API returns 401 so the SPA can clear session and redirect to login. */
export function notifyAuthUnauthorized() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT))
}
