import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface LowStockAlertProps {
  inventory: Array<{
    product: {
      title: string
      sku: string
    }
    quantity_available: number
    reorder_point: number
  }>
}

export function LowStockAlert({ inventory }: LowStockAlertProps) {
  const lowStockItems = inventory.filter((item) => item.quantity_available <= item.reorder_point).slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Low Stock Alerts
        </CardTitle>
        <CardDescription>Products that need restocking</CardDescription>
      </CardHeader>
      <CardContent>
        {lowStockItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">All products are well stocked</p>
        ) : (
          <div className="space-y-3">
            {lowStockItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.product?.title || "Unknown Product"}</p>
                  <p className="text-xs text-muted-foreground">{item.product?.sku}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">
                    {item.quantity_available} left
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
