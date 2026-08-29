import { Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '@/auth/AuthContext'
import ProtectedRoute from '@/auth/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import { Toaster } from '@/components/ui/sonner'
import Checkout from '@/pages/Checkout'
import ComingSoon from '@/pages/ComingSoon'
import Dashboard from '@/pages/Dashboard'
import Employees from '@/pages/Employees'
import Login from '@/pages/Login'
import MyProfile from '@/pages/MyProfile'
import Products from '@/pages/Products'
import SalesHistory from '@/pages/SalesHistory'

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
      <Toaster position="top-right" />
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
              <Products />
            </ProtectedPage>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedPage>
              <Employees />
            </ProtectedPage>
          }
        />
        <Route
          path="/my-profile"
          element={
            <ProtectedPage>
              <MyProfile />
            </ProtectedPage>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedPage>
              <Checkout />
            </ProtectedPage>
          }
        />
        <Route
          path="/sales"
          element={
            <ProtectedPage>
              <SalesHistory />
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
