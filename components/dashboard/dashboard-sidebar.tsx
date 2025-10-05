"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Package, ShoppingCart, Warehouse, Settings, Link2, BarChart3 } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Products", href: "/dashboard/products", icon: Package },
  { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { name: "Inventory", href: "/dashboard/inventory", icon: Warehouse },
  { name: "Channels", href: "/dashboard/channels", icon: Link2 },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-border bg-card sticky top-0 h-screen">
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-semibold tracking-tight">WAS-Holding</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>

      </div>
    </aside>
  )
}
