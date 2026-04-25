"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import type { AuthUser, UserRole } from "@/lib/types"

const AUTH_KEY = "esumbong_auth"

// ── Pre-set demo accounts ────────────────────────────────────────
export const DEMO_ACCOUNTS: Record<string, AuthUser> = {
  citizen: {
    name: "Rosario dela Cruz",
    phone: "+639175550142",
    role: "citizen",
    barangay: "Barangay 459, Sampaloc, Manila",
  },
  secretary: {
    name: "Maria Santos",
    phone: "+639175550100",
    role: "secretary",
    barangay: "Barangay 459, Sampaloc, Manila",
  },
  captain: {
    name: "Hon. Reynaldo R. Reyes",
    phone: "+639175550101",
    role: "captain",
    barangay: "Barangay 459, Sampaloc, Manila",
  },
}

// ── Context ──────────────────────────────────────────────────────
interface AuthContextValue {
  user: AuthUser | null
  login: (role: UserRole) => void
  loginAs: (user: AuthUser) => void
  logout: () => void
  isLoggedIn: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY)
      if (raw) setUser(JSON.parse(raw))
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) {
      if (user) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(AUTH_KEY)
      }
    }
  }, [user, hydrated])

  const login = useCallback((role: UserRole) => {
    const account = DEMO_ACCOUNTS[role]
    if (account) setUser(account)
  }, [])

  const loginAs = useCallback((u: AuthUser) => {
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  if (!hydrated) return null

  return (
    <AuthContext.Provider
      value={{ user, login, loginAs, logout, isLoggedIn: !!user }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
