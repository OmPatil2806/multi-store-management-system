import { useAuth } from '@/auth/AuthContext'
import { getStoreName } from '@/lib/stores'

export default function Dashboard() {
  const { role, storeId } = useAuth()
  const storeName = getStoreName(storeId)

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome, {role}
      </h1>
      {storeName && (
        <p className="mt-1 text-muted-foreground">Store: {storeName}</p>
      )}
    </div>
  )
}
