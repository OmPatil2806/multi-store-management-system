import { useState } from 'react'
import { toast } from 'sonner'
import { Download } from 'lucide-react'

import { useAuth } from '@/auth/AuthContext'
import client from '@/api/client'
import { Button } from '@/components/ui/button'

export default function Reports() {
  const { role, viewStoreId } = useAuth()
  const [isExporting, setIsExporting] = useState(false)

  const isAllStores = role === 'owner' && viewStoreId == null

  async function handleDownloadReport() {
    setIsExporting(true)
    try {
      const params = role === 'owner' && viewStoreId != null ? { store_id: viewStoreId } : {}
      const response = await client.get('/reports/export/products', { params, responseType: 'blob' })

      const disposition = response.headers['content-disposition']
      const filename = disposition?.match(/filename="?([^"]+)"?/)?.[1] || 'Stock_Report.xlsx'

      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to generate the report.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Download your current stock report as an Excel file.</p>
      </div>

      <div className="flex flex-col items-start gap-2">
        <Button onClick={handleDownloadReport} disabled={isExporting}>
          <Download className="size-4" />
          {isExporting ? 'Generating…' : 'Download Report'}
        </Button>

        {isAllStores && (
          <p className="text-xs text-muted-foreground">
            "All Stores" is selected — this will download one file with a separate sheet for each of
            the 3 stores.
          </p>
        )}
      </div>
    </div>
  )
}
