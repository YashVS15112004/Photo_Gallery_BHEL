import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { Layout } from './components/Layout'
import { LoginForm } from './components/LoginForm'
import { Users } from './pages/Users'
import { Albums } from './pages/Albums'
import { ActivityLogs } from './pages/ActivityLogs'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin-portal/login" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/admin-portal/login" element={<LoginForm />} />
      <Route
        path="/admin-portal"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="users" element={<Users />} />
        <Route path="albums" element={<Albums />} />
        <Route path="logs" element={<ActivityLogs />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin-portal" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App 