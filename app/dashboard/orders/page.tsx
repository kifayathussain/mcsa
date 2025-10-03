import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OrdersTable } from "@/components/orders/orders-table"
import { OrdersHeader } from "@/components/orders/orders-header"
import { OrdersStats } from "@/components/orders/orders-stats"

export default async function OrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch orders with channel information
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(`
      *,
      channels (
        channel_type,
        channel_name
      ),
      order_items (
        id,
        sku,
        product_name,
        quantity,
        unit_price,
        total_price
      )
    `)
    .eq("user_id", user.id)
    .order("order_date", { ascending: false })

  // Calculate stats
  const allOrders = orders || []
  const pendingOrders = allOrders.filter((o) => o.order_status === "pending").length
  const processingOrders = allOrders.filter((o) => o.order_status === "processing").length
  const shippedOrders = allOrders.filter((o) => o.order_status === "shipped").length
  const deliveredOrders = allOrders.filter((o) => o.order_status === "delivered").length

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8">
      <OrdersHeader />
      <OrdersStats
        pending={pendingOrders}
        processing={processingOrders}
        shipped={shippedOrders}
        delivered={deliveredOrders}
      />
      <OrdersTable orders={allOrders} />
    </div>
  )
}
