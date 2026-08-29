import { useAuth } from '@/auth/AuthContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { STORES } from '@/lib/stores'

export default function StoreSwitcher() {
  const { role, viewStoreId, setViewStoreId } = useAuth()

  if (role !== 'owner') {
    return null
  }

  const selectedName = STORES.find((store) => store.id === viewStoreId)?.name

  return (
    <Select value={String(viewStoreId)} onValueChange={(value) => setViewStoreId(Number(value))}>
      <SelectTrigger className="w-44">
        <SelectValue placeholder="Select store">{selectedName}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STORES.map((store) => (
          <SelectItem key={store.id} value={String(store.id)}>
            {store.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
