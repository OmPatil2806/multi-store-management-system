// Hardcoded to match the 3 seeded stores — there's no GET /stores endpoint
// yet, so this is UI-only and doesn't affect data scoping (the backend
// enforces store isolation from the JWT regardless of this list).
export const STORES = [
  { id: 1, name: 'Grocery' },
  { id: 2, name: 'Fashion' },
  { id: 3, name: 'Electronics' },
]

export function getStoreName(storeId) {
  return STORES.find((store) => store.id === storeId)?.name ?? null
}
