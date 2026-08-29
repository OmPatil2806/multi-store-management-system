import Sidebar from '@/components/Sidebar'
import StoreSwitcher from '@/components/StoreSwitcher'

export default function AppLayout({ children }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-end border-b border-border bg-card px-6">
          <StoreSwitcher />
        </header>

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  )
}
