import { Shirt } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/auth/AuthContext'
import { cn } from '@/lib/utils'

// Tailwind's JIT scanner needs literal class names to appear in source, so
// the accent -> class mapping can't be built with string interpolation.
const ACCENT_TEXT = {
  grocery: 'text-grocery',
  fashion: 'text-fashion',
  electronics: 'text-electronics',
}
const ACCENT_GRADIENT = {
  grocery: 'from-grocery to-grocery/70',
  fashion: 'from-fashion to-fashion/70',
  electronics: 'from-electronics to-electronics/70',
}

export default function StoreCard({ store, stats, large = false }) {
  const navigate = useNavigate()
  const { setViewStoreId } = useAuth()

  function handleClick() {
    setViewStoreId(store.id)
    navigate('/products')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'group relative flex w-full flex-col justify-end overflow-hidden rounded-xl border border-border text-left shadow-sm transition-shadow hover:shadow-md',
        large ? 'h-80' : 'h-56'
      )}
    >
      {store.heroImage ? (
        <>
          <img
            src={store.heroImage}
            alt=""
            className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
        </>
      ) : (
        // Fallback for any store without a real photo yet — add one to
        // frontend/public/images/ and set heroImage in lib/stores.js to
        // replace this with the real-photo treatment above.
        <div className={cn('absolute inset-0 flex items-center justify-center bg-gradient-to-br', ACCENT_GRADIENT[store.accent])}>
          <Shirt className="size-16 text-white/25" strokeWidth={1.5} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>
      )}

      <div className="relative z-10 flex flex-col gap-1 p-4">
        <h3
          className={cn(
            'font-bold [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]',
            large ? 'text-2xl' : 'text-lg',
            ACCENT_TEXT[store.accent]
          )}
        >
          {store.name}
        </h3>
        <div className="flex gap-4 text-sm text-white/90">
          <span>{stats ? `${stats.productCount} products` : '—'}</span>
          <span>{stats ? `${stats.lowStockCount} low stock` : '—'}</span>
        </div>
      </div>
    </button>
  )
}
