import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Boxes, CheckCircle2, AlertTriangle } from "lucide-react"

interface InventoryStatsProps {
  totalProducts: number
  totalStock: number
  availableStock: number
  lowStockItems: number
}

export function InventoryStats({ totalProducts, totalStock, availableStock, lowStockItems }: InventoryStatsProps) {
  const stats = [
    {
      title: "Total Products",
      value: totalProducts,
      icon: Package,
      color: "text-blue-500",
    },
    {
      title: "Total Stock",
      value: totalStock,
      icon: Boxes,
      color: "text-purple-500",
    },
    {
      title: "Available Stock",
      value: availableStock,
      icon: CheckCircle2,
      color: "text-green-500",
    },
    {
      title: "Low Stock Alerts",
      value: lowStockItems,
      icon: AlertTriangle,
      color: "text-yellow-500",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
