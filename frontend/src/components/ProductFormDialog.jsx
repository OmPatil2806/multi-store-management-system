import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/auth/AuthContext'
import client from '@/api/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const EMPTY_FORM = {
  name: '',
  category: '',
  sku: '',
  price: '',
  cost_price: '',
  quantity: '0',
  low_stock_threshold: '5',
}

function validate(form, canEditPriceFields) {
  const errors = {}

  if (!form.name.trim()) errors.name = 'Name is required'

  if (canEditPriceFields) {
    if (form.price === '' || Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
      errors.price = 'Price must be a non-negative number'
    }
    if (form.cost_price !== '' && (Number.isNaN(Number(form.cost_price)) || Number(form.cost_price) < 0)) {
      errors.cost_price = 'Cost price must be a non-negative number'
    }
  }

  if (form.quantity === '' || !Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 0) {
    errors.quantity = 'Quantity must be a non-negative whole number'
  }

  if (
    form.low_stock_threshold === '' ||
    !Number.isInteger(Number(form.low_stock_threshold)) ||
    Number(form.low_stock_threshold) < 0
  ) {
    errors.low_stock_threshold = 'Threshold must be a non-negative whole number'
  }

  return errors
}

export default function ProductFormDialog({ open, onOpenChange, product, onSaved }) {
  const { role, viewStoreId } = useAuth()
  const isEditing = Boolean(product)
  // Price/cost_price can be set by anyone when a product is first created
  // (that's how "add product" works for an employee too), but only the
  // owner may change them on an existing product — matches the backend's
  // create_product (unrestricted) vs update_product (owner-only) rules.
  const canEditPriceFields = !isEditing || role === 'owner'

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState(null)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setApiError(null)
    if (product) {
      setForm({
        name: product.name ?? '',
        category: product.category ?? '',
        sku: product.sku ?? '',
        price: product.price != null ? String(product.price) : '',
        cost_price: product.cost_price != null ? String(product.cost_price) : '',
        quantity: String(product.quantity ?? 0),
        low_stock_threshold: String(product.low_stock_threshold ?? 5),
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [open, product])

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationErrors = validate(form, canEditPriceFields)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setApiError(null)
    setIsSubmitting(true)

    // When editing, an employee's payload never carries price/cost_price at
    // all — not just hidden inputs — so there's nothing for the backend's
    // 403 check to even see.
    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || null,
      sku: form.sku.trim() || null,
      quantity: Number(form.quantity),
      low_stock_threshold: Number(form.low_stock_threshold),
    }

    if (canEditPriceFields) {
      payload.price = Number(form.price)
      payload.cost_price = form.cost_price === '' ? null : Number(form.cost_price)
    }

    if (!isEditing && role === 'owner') {
      payload.store_id = viewStoreId
    }

    try {
      if (isEditing) {
        await client.put(`/products/${product.id}`, payload)
        toast.success('Product updated')
      } else {
        await client.post('/products', payload)
        toast.success('Product created')
      }
      onSaved()
      onOpenChange(false)
    } catch (err) {
      setApiError(err.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Product' : 'Add Product'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update this product’s details.' : 'Create a new product for this store.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setField('name', e.target.value)} />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" value={form.category} onChange={(e) => setField('category', e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={form.sku} onChange={(e) => setField('sku', e.target.value)} />
            </div>

            {canEditPriceFields ? (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setField('price', e.target.value)}
                  />
                  {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="cost_price">Cost Price</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    value={form.cost_price}
                    onChange={(e) => setField('cost_price', e.target.value)}
                  />
                  {errors.cost_price && <p className="text-xs text-destructive">{errors.cost_price}</p>}
                </div>
              </>
            ) : (
              <div className="col-span-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                Price ({product.price}) and cost price can only be changed by the owner.
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={form.quantity}
                onChange={(e) => setField('quantity', e.target.value)}
              />
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                value={form.low_stock_threshold}
                onChange={(e) => setField('low_stock_threshold', e.target.value)}
              />
              {errors.low_stock_threshold && (
                <p className="text-xs text-destructive">{errors.low_stock_threshold}</p>
              )}
            </div>
          </div>

          {apiError && <p className="text-sm text-destructive">{apiError}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Create product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
