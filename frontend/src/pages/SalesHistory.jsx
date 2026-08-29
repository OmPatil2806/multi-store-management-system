import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/auth/AuthContext'
import client from '@/api/client'
import DataTable from '@/components/DataTable'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const PAYMENT_LABELS = { cash: 'Cash', card: 'Card', upi: 'UPI', other: 'Other' }

export default function SalesHistory() {
  const { role, viewStoreId } = useAuth()

  const [sales, setSales] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSale, setSelectedSale] = useState(null)

  const fetchSales = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = role === 'owner' ? { store_id: viewStoreId } : {}
      const response = await client.get('/sales', { params })
      setSales(response.data)
    } catch {
      setError('Failed to load sales history.')
    } finally {
      setIsLoading(false)
    }
  }, [role, viewStoreId])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (row) => new Date(row.date).toLocaleString(),
    },
    {
      key: 'total_amount',
      header: 'Total',
      render: (row) => `$${Number(row.total_amount).toFixed(2)}`,
    },
    {
      key: 'payment_method',
      header: 'Payment',
      render: (row) => PAYMENT_LABELS[row.payment_method] || row.payment_method,
    },
    ...(role === 'owner'
      ? [
          {
            key: 'employee_name',
            header: 'Employee',
            render: (row) => row.employee_name || 'Owner',
          },
        ]
      : []),
    {
      key: 'items',
      header: 'Items',
      accessor: (row) => row.items.length,
      render: (row) => row.items.length,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Sales History</h1>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <DataTable
          columns={columns}
          data={sales}
          onRowClick={setSelectedSale}
          searchPlaceholder="Search sales…"
        />
      )}

      <Dialog open={Boolean(selectedSale)} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sale #{selectedSale?.id}</DialogTitle>
            <DialogDescription>
              {selectedSale && new Date(selectedSale.date).toLocaleString()} ·{' '}
              {selectedSale && (PAYMENT_LABELS[selectedSale.payment_method] || selectedSale.payment_method)}
              {role === 'owner' && selectedSale && ` · ${selectedSale.employee_name || 'Owner'}`}
            </DialogDescription>
          </DialogHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedSale?.items.map((item) => (
                <TableRow key={item.product_id}>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>${Number(item.price_at_sale).toFixed(2)}</TableCell>
                  <TableCell>${Number(item.line_total).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
            <span>Total</span>
            <span>${selectedSale && Number(selectedSale.total_amount).toFixed(2)}</span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
