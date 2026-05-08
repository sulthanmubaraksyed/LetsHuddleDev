import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ToastProvider } from '@/components/ui/Toast'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TasksPage } from '@/pages/TasksPage'
import { HuddlesPage } from '@/pages/HuddlesPage'
import { HuddleUpPage } from '@/pages/HuddleUpPage'
import { DocumentsPage } from '@/pages/DocumentsPage'
import { UsersPage } from '@/pages/UsersPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth()
  if (loading) return <LoadingSpinner fullPage label="Initializing…" />
  if (!currentUser) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { appUser } = useAuth()
  if (appUser?.role === 'user') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { currentUser, loading } = useAuth()
  if (loading) return <LoadingSpinner fullPage label="Initializing…" />

  return (
    <Routes>
      <Route
        path="/login"
        element={currentUser ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="huddles" element={<HuddlesPage />} />
        <Route path="huddleup" element={<HuddleUpPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="users" element={<AdminGuard><UsersPage /></AdminGuard>} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
