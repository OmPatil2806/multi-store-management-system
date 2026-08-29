// Hardcoded to match the 3 seeded stores — there's no GET /stores endpoint
// yet, so this is UI-only and doesn't affect data scoping (the backend
// enforces store isolation from the JWT regardless of this list).
//
// heroImage: null means "no real photo yet" — StoreCard renders an accent
// gradient + icon placeholder instead. Swap in a real image path from
// frontend/public/images/ once one exists (see StoreCard.jsx).
export const STORES = [
  { id: 1, name: 'Grocery', accent: 'grocery', heroImage: '/images/grocery-hero-1.webp' },
  { id: 2, name: 'Fashion', accent: 'fashion', heroImage: '/images/fashion-hero-1.avif' },
  { id: 3, name: 'Electronics', accent: 'electronics', heroImage: '/images/electronics-hero-2.jpg' },
]

export function getStoreName(storeId) {
  return STORES.find((store) => store.id === storeId)?.name ?? null
}
