import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi, UserProfile } from '../lib/api'

interface AuthContextValue {
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]   = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = useCallback(async (t: string) => {
    try {
      const userData = await authApi.me()
      setUser(userData)
      setToken(t)
    } catch {
      // Token invalid/expired
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    }
  }, [])

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('token')
    if (stored) {
      fetchUser(stored).finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [fetchUser])

  const login = useCallback(async (newToken: string) => {
    localStorage.setItem('token', newToken)
    setIsLoading(true)
    await fetchUser(newToken)
    setIsLoading(false)
  }, [fetchUser])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}