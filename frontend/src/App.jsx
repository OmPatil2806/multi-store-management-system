import { Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '@/auth/AuthContext'
import ProtectedRoute from '@/auth/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import ComingSoon from '@/pages/ComingSoon'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'

function ProtectedPage({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedPage>
              <Dashboard />
            </ProtectedPage>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedPage>
              <ComingSoon title="Products" />
            </ProtectedPage>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedPage>
              <ComingSoon title="Employees" />
            </ProtectedPage>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedPage>
              <ComingSoon title="Checkout" />
            </ProtectedPage>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedPage>
              <ComingSoon title="Reports" />
            </ProtectedPage>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
