"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@lib/utils"
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Wallet,
  Tag,
  Users,
  LineChart,
  Plug,
  CheckSquare,
  Settings,
  User,
  Package,
} from "lucide-react"

const navItems = [
  { href: "/d", label: "Dashboard", icon: LayoutDashboard },
  { href: "/d/pantry", label: "Despensa", icon: Package },
  { href: "/d/shopping", label: "Compras", icon: ShoppingCart },
  { href: "/d/transactions", label: "Transacciones", icon: Receipt },
  { href: "/d/accounts", label: "Cuentas", icon: Wallet },
  { href: "/d/categories", label: "Categorías", icon: Tag },
  { href: "/d/beneficiaries", label: "Beneficiarios", icon: Users },
  { href: "/d/exchange-rates", label: "Tasas", icon: LineChart },
  { href: "/d/services", label: "Servicios", icon: Plug },
  { href: "/d/tasks", label: "Tareas", icon: CheckSquare },
]

const bottomNavItems = [
  { href: "/d/profile", label: "Perfil", icon: User },
  { href: "/d/settings", label: "Ajustes", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-svh w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">HomeManager</h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/d" && pathname.startsWith(item.href))
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t p-3">
        <ul className="space-y-1">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
