import { createContext, useCallback, useContext, useMemo, useState } from 'react'

import { ADMIN_LOGIN } from '@/config/auth'
import { useAppData } from '@/context/AppDataContext'

const STORAGE_KEY = 'routenex.auth.v1'
const AuthContext = createContext(null)

function loadSession() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persistSession(session) {
  try {
    if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Session stays in memory when storage is unavailable.
  }
}

export function AuthProvider({ children }) {
  const { db, switchRole, selectStudent, selectProvider, addStudent, addProvider } = useAppData()
  const [user, setUser] = useState(loadSession)

  const establishSession = useCallback(
    (nextUser) => {
      setUser(nextUser)
      persistSession(nextUser)
    },
    [],
  )

  const login = useCallback(
    ({ role, email, password }) => {
      const cleanEmail = email.trim().toLowerCase()
      if (!cleanEmail || !password) return { ok: false, error: 'Enter your email and password.' }
      if (password.length < 6) {
        return { ok: false, error: 'Password must be at least 6 characters.' }
      }

      if (role === 'admin') {
        if (cleanEmail !== ADMIN_LOGIN.email.toLowerCase() || password !== ADMIN_LOGIN.password) {
          return { ok: false, error: 'Administrator credentials were not recognised.' }
        }
        switchRole('admin')
        const next = {
          role: 'admin',
          name: 'ROUTENEX Administrator',
          email: cleanEmail,
          signedInAt: new Date().toISOString(),
        }
        establishSession(next)
        return { ok: true, user: next }
      }

      if (role === 'student') {
        const student = db.students.find(
          (item) => item.email.trim().toLowerCase() === cleanEmail,
        )
        if (!student) {
          return {
            ok: false,
            error: 'No student profile uses that email. Create an account to continue.',
          }
        }
        switchRole('student')
        selectStudent(student.id)
        const next = {
          role: 'student',
          name: student.name,
          email: cleanEmail,
          studentId: student.id,
          signedInAt: new Date().toISOString(),
        }
        establishSession(next)
        return { ok: true, user: next }
      }

      const provider = db.providers.find(
        (item) => item.email?.trim().toLowerCase() === cleanEmail,
      )
      if (!provider) {
        return {
          ok: false,
          error: 'No transport provider uses that email. Create a provider account to continue.',
        }
      }
      switchRole('provider')
      selectProvider(provider.id)
      const next = {
        role: 'provider',
        name: provider.name,
        email: cleanEmail,
        providerId: provider.id,
        signedInAt: new Date().toISOString(),
      }
      establishSession(next)
      return { ok: true, user: next }
    },
    [db.students, db.providers, establishSession, selectProvider, selectStudent, switchRole],
  )

  const register = useCallback(
    ({ role, name, email, phone, password, villageId, college }) => {
      const cleanEmail = email.trim().toLowerCase()
      if (!name.trim() || !cleanEmail) {
        return { ok: false, error: 'Enter your name and email.' }
      }
      if (password.length < 6) {
        return { ok: false, error: 'Choose a password with at least 6 characters.' }
      }
      if (role === 'admin') {
        return { ok: false, error: 'Administrator accounts are created by the platform team.' }
      }

      if (role === 'student') {
        if (
          db.students.some((student) => student.email.trim().toLowerCase() === cleanEmail)
        ) {
          return { ok: false, error: 'A student account already uses that email. Sign in instead.' }
        }
        const student = addStudent({
          name: name.trim(),
          email: cleanEmail,
          phone: phone.trim(),
          college: college?.trim() || 'Govt. Arts & Science College, Uthiramerur',
          villageId: villageId || db.villages[0]?.id || 'v1',
          departurePreference: '08:00',
          budget: 50,
          emergencyContact: '',
        })
        switchRole('student')
        selectStudent(student.id)
        const next = {
          role: 'student',
          name: student.name,
          email: cleanEmail,
          studentId: student.id,
          signedInAt: new Date().toISOString(),
        }
        establishSession(next)
        return { ok: true, user: next }
      }

      if (
        db.providers.some((provider) => provider.email?.trim().toLowerCase() === cleanEmail)
      ) {
        return { ok: false, error: 'A provider account already uses that email. Sign in instead.' }
      }
      const provider = addProvider({
        name: name.trim(),
        type: 'ev',
        contact: name.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        verified: false,
        available: true,
        serviceAreas: villageId ? [villageId] : db.villages.slice(0, 1).map((v) => v.id),
      })
      switchRole('provider')
      selectProvider(provider.id)
      const next = {
        role: 'provider',
        name: provider.name,
        email: cleanEmail,
        providerId: provider.id,
        signedInAt: new Date().toISOString(),
      }
      establishSession(next)
      return { ok: true, user: next }
    },
    [
      addProvider,
      addStudent,
      db.providers,
      db.students,
      db.villages,
      establishSession,
      selectProvider,
      selectStudent,
      switchRole,
    ],
  )

  const logout = useCallback(() => {
    setUser(null)
    persistSession(null)
  }, [])

  const value = useMemo(() => ({ user, login, register, logout }), [user, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

export const ROLE_HOME = {
  student: '/student',
  provider: '/provider',
  admin: '/admin',
}
