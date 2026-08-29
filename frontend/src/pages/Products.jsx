import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'

import { useAuth } from '@/auth/AuthContext'
import client from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import DataTable from '@/components/DataTable'
import ProductFormDialog from '@/components/ProductFormDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function Products() {
  const { role, viewStoreId } = useAuth()
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
  }, [fetchProducts])

  function openAddDialog() {
    setEditingProduct(null)
    setFormOpen(true)
  }

  function openEditDialog(product) {
    setEditingProduct(product)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await client.delete(`/products/${deleteTarget.id}`)
      toast.success('Product deleted')
      setDeleteTarget(null)
      fetchProducts()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete product.')
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'category', header: 'Category', render: (row) => row.category || '—' },
    { key: 'price', header: 'Price', render: (row) => `$${Number(row.price).toFixed(2)}` },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (row) => {
        const low = row.quantity < row.low_stock_threshold
        return (
          <span className="flex items-center gap-2">
            {row.quantity}
            {low && <Badge variant="destructive">Low stock</Badge>}
          </span>
        )
      },
    },
    { key: 'low_stock_threshold', header: 'Threshold' },
    ...(role === 'owner'
      ? [
          {
            key: 'actions',
            header: '',
            sortable: false,
            searchable: false,
            render: (row) => (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteTarget(row)
                }}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            ),
          },
        ]
      : []),
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <Button onClick={openAddDialog}>
          <Plus className="size-4" />
          Add Product
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <DataTable
          columns={columns}
          data={products}
          onRowClick={openEditDialog}
          searchPlaceholder="Search products…"
        />
      )}

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
        onSaved={fetchProducts}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone. The product will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
