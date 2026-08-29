import { useEffect, useState } from 'react'

import { useAuth } from '@/auth/AuthContext'
import client from '@/api/client'
import StoreCard from '@/components/StoreCard'
import { STORES } from '@/lib/stores'

export default function Dashboard() {
  const { role, storeId } = useAuth()
  const [stats, setStats] = useState({})

  const storesToShow = role === 'owner' ? STORES : STORES.filter((s) => s.id === storeId)

  useEffect(() => {
    let cancelled = false

    async function loadStats() {
      const entries = await Promise.all(
        storesToShow.map(async (store) => {
          const params = role === 'owner' ? { store_id: store.id } : {}
          const [productsRes, lowStockRes] = await Promise.all([
            client.get('/products', { params }),
            client.get('/products/low-stock', { params }),
          ])
          const lowStockCount = lowStockRes.data.reduce((sum, group) => sum + group.products.length, 0)
          return [store.id, { productCount: productsRes.data.length, lowStockCount }]
        })
      )
      if (!cancelled) setStats(Object.fromEntries(entries))
    }

    loadStats()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, storeId])

  const isSingleStore = storesToShow.length === 1

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {role}</h1>
        <p className="text-muted-foreground">
          {isSingleStore ? "Here's your store at a glance." : "Here's an overview of your stores."}
        </p>
      </div>

      <div className={isSingleStore ? 'max-w-md' : 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'}>
        {storesToShow.map((store) => (
          <StoreCard key={store.id} store={store} stats={stats[store.id]} large={isSingleStore} />
        ))}
      </div>
    </div>
  )
}
