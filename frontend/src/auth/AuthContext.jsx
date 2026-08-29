import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import client, { registerAuthHooks } from '@/api/client'

const AuthContext = createContext(null)

// Deliberately not persisted (no localStorage/sessionStorage): a full page
// refresh logs the user out. This is a conscious starting point for Phase 5,
// not a bug — persistence is a separate decision to make later.
export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ token: null, role: null, storeId: null })
  // The store the OWNER is currently viewing (switchable via StoreSwitcher).
  // null means "All Stores" — combined/per-store view. Irrelevant for
  // employees — their data is always scoped server-side to their own
  // storeId regardless of this value.
  const [ownerViewStoreId, setOwnerViewStoreId] = useState(null)
  const navigate = useNavigate()

  const logout = useCallback(() => {
    setAuth({ token: null, role: null, storeId: null })
  }, [])

  const login = useCallback(async (identifier, password) => {
    const response = await client.post('/auth/login', { identifier, password })
    const { access_token, role, store_id } = response.data
    setAuth({ token: access_token, role, storeId: store_id })
    setOwnerViewStoreId(null)
  }, [])

  useMemo(() => {
    registerAuthHooks({
      getToken: () => auth.token,
      onUnauthorized: () => {
        setAuth({ token: null, role: null, storeId: null })
        navigate('/login')
      },
    })
  }, [auth.token, navigate])

  const value = useMemo(
    () => ({
      token: auth.token,
      role: auth.role,
      storeId: auth.storeId,
      isAuthenticated: Boolean(auth.token),
      login,
      logout,
      // The store id product/employee pages should scope requests to: the
      // owner's switchable selection, or the employee's fixed own store.
      viewStoreId: auth.role === 'owner' ? ownerViewStoreId : auth.storeId,
      setViewStoreId: setOwnerViewStoreId,
    }),
    [auth, login, logout, ownerViewStoreId]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
