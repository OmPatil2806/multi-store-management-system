import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, Users, User, ShoppingCart, Receipt, FileText, LogOut } from 'lucide-react'

import { useAuth } from '@/auth/AuthContext'
import { cn } from '@/lib/utils'
import Logo from '@/components/Logo'

function getNavItems(role) {
  return [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/products', label: 'Products', icon: Package },
    role === 'owner'
      ? { to: '/employees', label: 'Employees', icon: Users }
      : { to: '/my-profile', label: 'My Profile', icon: User },
    { to: '/checkout', label: 'Checkout', icon: ShoppingCart },
    { to: '/sales', label: 'Sales', icon: Receipt },
    { to: '/reports', label: 'Reports', icon: FileText },
  ]
}

export default function Sidebar() {
  const { role, logout } = useAuth()
  const navItems = getNavItems(role)

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-card">
      <div className="px-5 py-5">
        <Logo size="sm" />
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
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <Icon className="size-4" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border px-3 py-3">
        {/* Static personal branding, not a per-user avatar system — always
            this same photo regardless of who's logged in. */}
        <div className="flex items-center gap-3 px-3 py-2">
          <img
            src="/images/owner-avatar.jpg"
            alt=""
            className="size-9 shrink-0 rounded-full border border-border object-cover"
          />
          <span className="text-sm text-muted-foreground">
            {role === 'owner' ? 'Owner' : 'Employee'}
          </span>
        </div>

        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="size-4" strokeWidth={2} />
          Logout
        </button>
      </div>
    </aside>
  )
}
