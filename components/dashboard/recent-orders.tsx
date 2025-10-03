import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface Order {
  id: string
  order_number: string
  customer_name: string
  total_amount: number
  order_status: string
  order_date: string
}

interface RecentOrdersProps {
  orders: Order[]
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  processing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  shipped: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  delivered: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  refunded: "bg-gray-500/10 text-gray-500 border-gray-500/20",
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Orders</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Latest customer orders</p>
        </div>
        <Link href="/dashboard/orders" className="flex items-center gap-1 text-sm text-primary hover:underline">
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">No orders yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Orders will appear here once customers start purchasing
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-medium">{order.order_number}</p>
                    <Badge className={statusColors[order.order_status]}>{order.order_status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{order.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${Number(order.total_amount).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(order.order_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
