import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth } from '../firebase/config'
import { setAuthTokenProvider } from '../services/authToken'
import { AuthContext } from './authContext'
import { formatAuthError, logAuthFailure } from '../utils/authErrors'

const firebaseConfigured = Boolean(auth)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    if (!auth) {
      setUser(null)
      setLoading(false)
      return undefined
    }

    const unsub = onAuthStateChanged(
      auth,
      (u) => {
        setUser(u)
        setLoading(false)
        setAuthError(null)
        if (import.meta.env.DEV && u?.uid) {
          console.debug('[auth] Session active:', u.uid, u.email ?? '(no email)')
        }
      },
      (err) => {
        setAuthError(formatAuthError(err))
        setLoading(false)
        logAuthFailure('onAuthStateChanged', err)
      }
    )
    return () => unsub()
  }, [])

  useEffect(() => {
    setAuthTokenProvider(async () => {
      if (!auth || !user) return null
      try {
        return await user.getIdToken()
      } catch (err) {
        logAuthFailure('getIdToken', err)
        return null
      }
    })
  }, [user])

  const signInWithGoogle = useCallback(async () => {
    if (!auth) {
      const err = new Error('Firebase is not configured — add VITE_FIREBASE_* keys to frontend/.env')
      logAuthFailure('Google sign-in (no auth)', err)
      throw err
    }
    const provider = new GoogleAuthProvider()
    provider.addScope('email')
    provider.addScope('profile')
    provider.setCustomParameters({ prompt: 'select_account' })

    try {
      await signInWithPopup(auth, provider)
    } catch (err) {
      logAuthFailure('Google sign-in', err)
      throw err
    }
  }, [])

  const signInWithEmail = useCallback(async (email, password) => {
    if (!auth) {
      const err = new Error('Firebase is not configured — add VITE_FIREBASE_* keys to frontend/.env')
      logAuthFailure('Email sign-in (no auth)', err)
      throw err
    }
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      logAuthFailure('Email sign-in', err)
      throw err
    }
  }, [])

  const signUpWithEmail = useCallback(async (email, password) => {
    if (!auth) {
      const err = new Error('Firebase is not configured — add VITE_FIREBASE_* keys to frontend/.env')
      logAuthFailure('Email sign-up (no auth)', err)
      throw err
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (err) {
      logAuthFailure('Email sign-up', err)
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    if (!auth) return
    try {
      await signOut(auth)
    } catch (err) {
      logAuthFailure('signOut', err)
      throw err
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      firebaseConfigured,
      userProfile: user
        ? { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL }
        : null,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      logout,
    }),
    [user, loading, authError, signInWithGoogle, signInWithEmail, signUpWithEmail, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
