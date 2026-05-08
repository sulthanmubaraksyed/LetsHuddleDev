import { createContext, useContext, useEffect, useState } from 'react'
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { AppUser, UserRole } from '@/types'

interface AuthContextValue {
  currentUser: User | null
  appUser: AppUser | null
  role: UserRole | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchAppUser(uid: string): Promise<AppUser | null> {
    const snap = await getDoc(doc(db, 'users', uid))
    if (snap.exists()) return { uid, ...snap.data() } as AppUser
    return null
  }

  async function ensureUserDoc(user: User, role: UserRole = 'user') {
    const ref = doc(db, 'users', user.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || null,
        role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        await ensureUserDoc(user)
        const au = await fetchAppUser(user.uid)
        setAppUser(au)
      } else {
        setAppUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function signUp(email: string, password: string, displayName: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    await ensureUserDoc(cred.user)
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(auth, provider)
    await ensureUserDoc(cred.user)
  }

  async function logout() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        appUser,
        role: appUser?.role ?? null,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
