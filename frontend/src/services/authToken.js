let tokenProvider = async () => null

/**
 * Registers how to obtain a Firebase ID token for API calls (set from AuthContext).
 */
export function setAuthTokenProvider(fn) {
  tokenProvider = typeof fn === 'function' ? fn : async () => null
}

export async function getAuthToken() {
  try {
    return await tokenProvider()
  } catch {
    return null
  }
}
