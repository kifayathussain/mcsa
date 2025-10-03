"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { useState } from "react"
import { OrderDetailsDialog } from "./order-details-dialog"

interface Order {
  id: string
  order_number: string
  external_order_id: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  shipping_address: any
  order_status: string
  payment_status: string
  total_amount: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  order_date: string
  tracking_number: string | null
  carrier: string | null
  notes: string | null
  channels: {
    channel_type: string
    channel_name: string
  }
  order_items: Array<{
    id: string
    sku: string
    product_name: string
    quantity: number
    unit_price: number
    total_price: number
  }>
}

interface OrdersTableProps {
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

const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  paid: "bg-green-500/10 text-green-500 border-green-500/20",
  failed: "bg-red-500/10 text-red-500 border-red-500/20",
  refunded: "bg-gray-500/10 text-gray-500 border-gray-500/20",
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const channelIcons: Record<string, string> = {
    amazon: "🛒",
    ebay: "🏪",
    etsy: "🎨",
    shopify: "🛍️",
    walmart: "🏬",
  }

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Order Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <p className="text-muted-foreground">No orders found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Orders will appear here once synced from channels
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      {order.customer_email && <p className="text-xs text-muted-foreground">{order.customer_email}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{channelIcons[order.channels.channel_type] || "🔗"}</span>
                      <span className="text-sm capitalize">{order.channels.channel_type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(order.order_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{order.order_items.length} items</Badge>
                  </TableCell>
                  <TableCell className="font-semibold">${Number(order.total_amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[order.order_status]}>{order.order_status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={paymentStatusColors[order.payment_status]}>{order.payment_status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {selectedOrder && (
        <OrderDetailsDialog order={selectedOrder} open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)} />
      )}
    </>
  )
}
