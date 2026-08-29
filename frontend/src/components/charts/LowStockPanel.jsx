import { TriangleAlert } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

/** groups: LowStockGroup[] from GET /products/low-stock — [{ store_id, store_name, products }] */
export default function LowStockPanel({ groups, showStoreNames }) {
  const totalItems = groups.reduce((sum, g) => sum + g.products.length, 0)

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">Low Stock</h3>

      {totalItems === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Nothing low on stock right now.
        </div>
      ) : (
        <div className="flex max-h-64 flex-col gap-4 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.store_id} className="flex flex-col gap-2">
              {showStoreNames && (
                <p className="text-xs font-medium text-muted-foreground">{group.store_name}</p>
              )}
              {group.products.map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <TriangleAlert className="size-4 shrink-0 text-amber-500" />
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <Badge variant="destructive">
                    {product.quantity} / {product.low_stock_threshold}
                  </Badge>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
