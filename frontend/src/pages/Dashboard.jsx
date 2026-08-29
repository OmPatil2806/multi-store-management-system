import { useEffect, useMemo, useState } from 'react'
import { DollarSign, Package, Receipt, TriangleAlert } from 'lucide-react'

import { useAuth } from '@/auth/AuthContext'
import client from '@/api/client'
import StoreCard from '@/components/StoreCard'
import RevenueChart from '@/components/charts/RevenueChart'
import StockByCategoryChart from '@/components/charts/StockByCategoryChart'
import LowStockPanel from '@/components/charts/LowStockPanel'
import TopProductsChart from '@/components/charts/TopProductsChart'
import PaymentMethodChart from '@/components/charts/PaymentMethodChart'
import { STORES, getStoreColor, getStoreName } from '@/lib/stores'

function StatCard({ label, value, icon: Icon, warn }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
          warn ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary'
        }`}
      >
        <Icon className="size-5" strokeWidth={2} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { role, storeId, viewStoreId } = useAuth()

  const storesToShow = role === 'owner' ? STORES : STORES.filter((s) => s.id === storeId)
  const isSingleStore = storesToShow.length === 1

  // --- Existing store-card stats (unchanged from the styling pass) ---
  const [cardStats, setCardStats] = useState({})

  useEffect(() => {
    let cancelled = false

    async function loadCardStats() {
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
      if (!cancelled) setCardStats(Object.fromEntries(entries))
    }

    loadCardStats()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, storeId])

  // --- Phase 8: dashboard aggregation + charts ---
  const [dashboard, setDashboard] = useState(null)
  const [lowStockGroups, setLowStockGroups] = useState([])
  const [range, setRange] = useState('7d')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setIsLoading(true)
      setError(null)
      try {
        const storeParam = role === 'owner' ? viewStoreId : undefined
        const dashboardParams = { range, ...(storeParam != null ? { store_id: storeParam } : {}) }
        const lowStockParams = storeParam != null ? { store_id: storeParam } : {}

        const [dashboardRes, lowStockRes] = await Promise.all([
          client.get('/reports/dashboard', { params: dashboardParams }),
          client.get('/products/low-stock', { params: lowStockParams }),
        ])

        if (!cancelled) {
          setDashboard(dashboardRes.data)
          setLowStockGroups(lowStockRes.data)
        }
      } catch {
        if (!cancelled) setError('Failed to load dashboard data.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadDashboard()
    return () => {
      cancelled = true
    }
  }, [role, viewStoreId, range])

  const revenueSeries = useMemo(() => {
    if (!dashboard) return []

    if (dashboard.per_store) {
      return dashboard.per_store.map((s) => ({
        name: s.store_name,
        color: getStoreColor(s.store_id),
        data: s.revenue_by_day,
      }))
    }

    const scopedStoreId = role === 'owner' ? viewStoreId : storeId
    return [
      {
        name: getStoreName(scopedStoreId) || 'Revenue',
        color: getStoreColor(scopedStoreId),
        data: dashboard.revenue_by_day,
      },
    ]
  }, [dashboard, role, viewStoreId, storeId])

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
          <StoreCard key={store.id} store={store} stats={cardStats[store.id]} large={isSingleStore} />
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading && !dashboard ? (
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      ) : dashboard ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total Revenue"
              value={`$${Number(dashboard.total_revenue).toFixed(2)}`}
              icon={DollarSign}
            />
            <StatCard label="Total Sales" value={dashboard.total_sales_count} icon={Receipt} />
            <StatCard
              label="Stock Value"
              value={`$${Number(dashboard.stock_value).toFixed(2)}`}
              icon={Package}
            />
            <StatCard
              label="Low Stock"
              value={dashboard.low_stock_count}
              icon={TriangleAlert}
              warn={dashboard.low_stock_count > 0}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <RevenueChart series={revenueSeries} range={range} onRangeChange={setRange} />
            </div>
            <LowStockPanel groups={lowStockGroups} showStoreNames={Boolean(dashboard.per_store)} />
            <TopProductsChart data={dashboard.top_products} />
            <PaymentMethodChart data={dashboard.sales_by_payment_method} />
            <StockByCategoryChart data={dashboard.stock_by_category} />
          </div>
        </>
      ) : null}
    </div>
  )
}
