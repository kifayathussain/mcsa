import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingCart, Package, Clock, Link2 } from "lucide-react"

interface MetricsCardsProps {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  pendingOrders: number
  connectedChannels: number
}

export function MetricsCards({
  totalRevenue,
  totalOrders,
  totalProducts,
  pendingOrders,
  connectedChannels,
}: MetricsCardsProps) {
  const metrics = [
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: "All-time revenue",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      title: "Total Orders",
      value: totalOrders.toString(),
      icon: ShoppingCart,
      description: `${pendingOrders} pending`,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      title: "Products",
      value: totalProducts.toString(),
      icon: Package,
      description: "Active products",
      iconColor: "text-violet-600",
      iconBg: "bg-violet-50",
    },
    {
      title: "Pending Orders",
      value: pendingOrders.toString(),
      icon: Clock,
      description: "Awaiting processing",
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
    },
    {
      title: "Connected Channels",
      value: connectedChannels.toString(),
      icon: Link2,
      description: "Active integrations",
      iconColor: "text-cyan-600",
      iconBg: "bg-cyan-50",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {metrics.map((metric) => (
        <Card key={metric.title} className="transition-all hover:shadow-md border-neutral-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-neutral-600">{metric.title}</CardTitle>
            <div className={`h-9 w-9 rounded-lg ${metric.iconBg} flex items-center justify-center`}>
              <metric.icon className={`h-4 w-4 ${metric.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-neutral-900">{metric.value}</div>
            <p className="text-xs text-neutral-500 mt-1.5">{metric.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
