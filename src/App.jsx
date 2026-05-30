import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SettingsProvider } from './contexts/SettingsContext'

import Login from './pages/auth/Login'
import Cadastro from './pages/auth/Cadastro'
import Dashboard from './pages/dashboard/Dashboard'
import Tasks from './pages/tasks/Tasks'
import Diet from './pages/diet/Diet'
import Workout from './pages/workout/Workout'
import Settings from './pages/settings/Settings'
import BMR from './pages/bmr/BMR'
import Calendar from './pages/calendar/Calendar'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg, #0a0a0a)' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--primary, #ff4d2e)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
      </div>
    )
  }
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return !user ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login"       element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/cadastro"    element={<PublicRoute><Cadastro /></PublicRoute>} />
            <Route path="/dashboard"   element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/tarefas"     element={<PrivateRoute><Tasks /></PrivateRoute>} />
            <Route path="/dieta"       element={<PrivateRoute><Diet /></PrivateRoute>} />
            <Route path="/treinos"     element={<PrivateRoute><Workout /></PrivateRoute>} />
            <Route path="/configuracoes" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/calculadora"  element={<PrivateRoute><BMR /></PrivateRoute>} />
            <Route path="/calendario"   element={<PrivateRoute><Calendar /></PrivateRoute>} />
          </Routes>
        </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  )
}
