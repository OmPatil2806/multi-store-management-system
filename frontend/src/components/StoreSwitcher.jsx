import { useAuth } from '@/auth/AuthContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { STORES } from '@/lib/stores'

const ALL_STORES_VALUE = 'all'

export default function StoreSwitcher() {
  const { role, viewStoreId, setViewStoreId } = useAuth()

  if (role !== 'owner') {
    return null
  }

  const selectedValue = viewStoreId === null ? ALL_STORES_VALUE : String(viewStoreId)
  const selectedName =
    viewStoreId === null ? 'All Stores' : STORES.find((store) => store.id === viewStoreId)?.name

  function handleChange(value) {
    setViewStoreId(value === ALL_STORES_VALUE ? null : Number(value))
  }

  return (
    <Select value={selectedValue} onValueChange={handleChange}>
      <SelectTrigger className="w-44">
        <SelectValue placeholder="Select store">{selectedName}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_STORES_VALUE}>All Stores</SelectItem>
        {STORES.map((store) => (
          <SelectItem key={store.id} value={String(store.id)}>
            {store.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
