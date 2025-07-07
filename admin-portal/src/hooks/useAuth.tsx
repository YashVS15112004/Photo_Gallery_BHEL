import React, { useState, useEffect, createContext, useContext } from 'react'
import { User } from '../types'
import api from '../lib/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      if (token) {
        const response = await api.get('/admin/me')
        setUser(response.data.user)
      }
    } catch (error) {
      localStorage.removeItem('adminToken')
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    const response = await api.post('/admin/login', { username, password })
    const { token, user } = response.data
    localStorage.setItem('adminToken', token)
    setUser(user)
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 