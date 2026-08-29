// Hardcoded to match the 3 seeded stores — there's no GET /stores endpoint
// yet, so this is UI-only and doesn't affect data scoping (the backend
// enforces store isolation from the JWT regardless of this list).
//
// heroImage: null means "no real photo yet" — StoreCard renders an accent
// gradient + icon placeholder instead. Swap in a real image path from
// frontend/public/images/ once one exists (see StoreCard.jsx).
// color: literal hex, kept in sync with the --grocery/--fashion/--electronics
// custom properties in index.css — charts (Recharts) need real color values,
// not Tailwind class names.
export const STORES = [
  { id: 1, name: 'Grocery', accent: 'grocery', color: '#16A34A', heroImage: '/images/grocery-hero-1.webp' },
  { id: 2, name: 'Fashion', accent: 'fashion', color: '#DB2777', heroImage: '/images/fashion-hero-1.avif' },
  { id: 3, name: 'Electronics', accent: 'electronics', color: '#2563EB', heroImage: '/images/electronics-hero-2.jpg' },
]

export function getStoreName(storeId) {
  return STORES.find((store) => store.id === storeId)?.name ?? null
}

export function getStoreColor(storeId) {
  return STORES.find((store) => store.id === storeId)?.color ?? '#4338CA'
}
