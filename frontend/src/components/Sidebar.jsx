import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, Users, User, ShoppingCart, FileText, LogOut, Store } from 'lucide-react'

import { useAuth } from '@/auth/AuthContext'
import { cn } from '@/lib/utils'

function getNavItems(role) {
  return [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/products', label: 'Products', icon: Package },
    role === 'owner'
      ? { to: '/employees', label: 'Employees', icon: Users }
      : { to: '/my-profile', label: 'My Profile', icon: User },
    { to: '/checkout', label: 'Checkout', icon: ShoppingCart },
    { to: '/reports', label: 'Reports', icon: FileText },
  ]
}

export default function Sidebar() {
  const { role, logout } = useAuth()
  const navItems = getNavItems(role)

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2 px-5 py-5">
        <Store className="size-5 text-primary" strokeWidth={2} />
        <span className="text-sm font-semibold tracking-tight">Supermarket Admin</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground'
              )
            }
          >
            <Icon className="size-4" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border px-3 py-3">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-accent-foreground"
        >
          <LogOut className="size-4" strokeWidth={2} />
          Logout
        </button>
      </div>
    </aside>
  )
}
