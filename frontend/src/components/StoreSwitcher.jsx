import { useState } from 'react'

import { useAuth } from '@/auth/AuthContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { STORES } from '@/lib/stores'

export default function StoreSwitcher() {
  const { role } = useAuth()
  const [selected, setSelected] = useState(String(STORES[0].id))

  if (role !== 'owner') {
    return null
  }

  const selectedName = STORES.find((store) => String(store.id) === selected)?.name

  return (
    <Select value={selected} onValueChange={setSelected}>
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
