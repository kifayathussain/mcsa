import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Package, Truck, CheckCircle2 } from "lucide-react"

interface OrdersStatsProps {
  pending: number
  processing: number
  shipped: number
  delivered: number
}

export function OrdersStats({ pending, processing, shipped, delivered }: OrdersStatsProps) {
  const stats = [
    {
      title: "Pending",
      value: pending,
      icon: Clock,
      color: "text-yellow-500",
    },
    {
      title: "Processing",
      value: processing,
      icon: Package,
      color: "text-blue-500",
    },
    {
      title: "Shipped",
      value: shipped,
      icon: Truck,
      color: "text-purple-500",
    },
    {
      title: "Delivered",
      value: delivered,
      icon: CheckCircle2,
      color: "text-green-500",
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
