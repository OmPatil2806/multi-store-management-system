import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'

import { useAuth } from '@/auth/AuthContext'
import client from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DataTable from '@/components/DataTable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'other', label: 'Other' },
]

export default function Checkout() {
  const { role, viewStoreId } = useAuth()

  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [cart, setCart] = useState({}) // { [productId]: quantity }
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = role === 'owner' ? { store_id: viewStoreId } : {}
      const response = await client.get('/products', { params })
      setProducts(response.data)
    } catch {
      setError('Failed to load products.')
    } finally {
      setIsLoading(false)
    }
  }, [role, viewStoreId])

  useEffect(() => {
    fetchProducts()
    setCart({})
  }, [fetchProducts])

  const productsById = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products])

  function addToCart(product) {
    setCart((prev) => {
      const current = prev[product.id] ?? 0
      if (current >= product.quantity) return prev
      return { ...prev, [product.id]: current + 1 }
    })
  }

  function changeQuantity(productId, delta) {
    setCart((prev) => {
      const product = productsById[productId]
      const next = (prev[productId] ?? 0) + delta
      if (next <= 0) {
        const { [productId]: _removed, ...rest } = prev
        return rest
      }
      if (product && next > product.quantity) return prev
      return { ...prev, [productId]: next }
    })
  }

  function removeFromCart(productId) {
    setCart((prev) => {
      const { [productId]: _removed, ...rest } = prev
      return rest
    })
  }

  const cartLines = Object.entries(cart)
    .map(([productId, quantity]) => {
      const product = productsById[Number(productId)]
      if (!product) return null
      return {
        productId: Number(productId),
        name: product.name,
        price: Number(product.price),
        quantity,
        stock: product.quantity,
        lineTotal: Number(product.price) * quantity,
      }
    })
    .filter(Boolean)

  const total = cartLines.reduce((sum, line) => sum + line.lineTotal, 0)

  async function handleCompleteSale() {
    if (cartLines.length === 0) return
    setIsSubmitting(true)
    try {
      const payload = {
        items: cartLines.map((line) => ({ product_id: line.productId, quantity: line.quantity })),
        payment_method: paymentMethod,
      }
      if (role === 'owner') payload.store_id = viewStoreId

      const response = await client.post('/sales', payload)
      toast.success(`Sale completed — $${Number(response.data.total_amount).toFixed(2)}`)
      setCart({})
      fetchProducts()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to complete sale.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const productColumns = [
    { key: 'name', header: 'Name' },
    { key: 'category', header: 'Category', render: (row) => row.category || '—' },
    { key: 'price', header: 'Price', render: (row) => `$${Number(row.price).toFixed(2)}` },
    { key: 'quantity', header: 'In Stock' },
    {
      key: 'actions',
      header: '',
      sortable: false,
      searchable: false,
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          disabled={row.quantity === 0 || (cart[row.id] ?? 0) >= row.quantity}
          onClick={() => addToCart(row)}
        >
          <Plus className="size-3.5" />
          Add
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <DataTable columns={productColumns} data={products} searchPlaceholder="Search products…" />
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="size-4" />
              Cart
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {cartLines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items added yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {cartLines.map((line) => (
                  <div key={line.productId} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{line.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ${line.price.toFixed(2)} × {line.quantity} = ${line.lineTotal.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => changeQuantity(line.productId, -1)}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-6 text-center">{line.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        disabled={line.quantity >= line.stock}
                        onClick={() => changeQuantity(line.productId, 1)}
                      >
                        <Plus className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeFromCart(line.productId)}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Payment Method</span>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button disabled={cartLines.length === 0 || isSubmitting} onClick={handleCompleteSale}>
              {isSubmitting ? 'Completing…' : 'Complete Sale'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
