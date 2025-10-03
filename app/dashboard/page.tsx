import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { MetricsCards } from "@/components/dashboard/metrics-cards"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { ChannelStatus } from "@/components/dashboard/channel-status"
import { ChannelSalesChart } from "@/components/dashboard/channel-sales-chart"
import { TopProductsChart } from "@/components/dashboard/top-products-chart"
import { OrderStatusChart } from "@/components/dashboard/order-status-chart"
import { LowStockAlert } from "@/components/dashboard/low-stock-alert"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const [productsResult, ordersResult, channelsResult, inventoryResult, orderItemsResult] = await Promise.all([
    supabase.from("products").select("*", { count: "exact" }).eq("user_id", user.id),
    supabase
      .from("orders")
      .select("*, channel:channels(channel_name, channel_type)")
      .eq("user_id", user.id)
      .order("order_date", { ascending: false }),
    supabase.from("channels").select("*").eq("user_id", user.id),
    supabase.from("inventory").select("*, product:products!inner(title, sku, user_id)").eq("product.user_id", user.id),
    supabase
      .from("order_items")
      .select("*, product:products(title, sku), order:orders!inner(user_id, order_date, order_status)")
      .eq("order.user_id", user.id),
  ])

  const totalProducts = productsResult.count || 0
  const products = productsResult.data || []
  const orders = ordersResult.data || []
  const channels = channelsResult.data || []
  const inventory = inventoryResult.data || []
  const orderItems = orderItemsResult.data || []

  // Calculate metrics
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
  const pendingOrders = orders.filter((o) => o.order_status === "pending").length
  const connectedChannels = channels.filter((c) => c.is_connected).length

  // Get recent orders (last 5)
  const recentOrders = orders.slice(0, 5)

  const salesData = calculateSalesData(orders)
  const channelSalesData = calculateChannelSales(orders)
  const topProductsData = calculateTopProducts(orderItems)
  const orderStatusData = calculateOrderStatus(orders)

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <main className="flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
        <DashboardHeader userName={user.email || "User"} />

        <div className="mt-6 space-y-6">
          <MetricsCards
            totalRevenue={totalRevenue}
            totalOrders={totalOrders}
            totalProducts={totalProducts}
            pendingOrders={pendingOrders}
            connectedChannels={connectedChannels}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <SalesChart data={salesData} />
            <ChannelSalesChart data={channelSalesData} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <TopProductsChart data={topProductsData} />
            <OrderStatusChart data={orderStatusData} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChannelStatus channels={channels} />
            <LowStockAlert inventory={inventory} />
          </div>

          <RecentOrders orders={recentOrders} />
        </div>
      </main>
    </div>
  )
}

function calculateSalesData(orders: any[]) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toISOString().split("T")[0]
  })

  return last7Days.map((date) => {
    const dayOrders = orders.filter((order) => order.order_date.startsWith(date))
    const revenue = dayOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)

    return {
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: revenue,
      orders: dayOrders.length,
    }
  })
}

function calculateChannelSales(orders: any[]) {
  const channelMap = new Map()

  orders.forEach((order) => {
    const channelName = order.channel?.channel_name || "Unknown"
    const current = channelMap.get(channelName) || 0
    channelMap.set(channelName, current + Number(order.total_amount || 0))
  })

  return Array.from(channelMap.entries()).map(([name, revenue]) => ({
    channel: name,
    revenue: Math.round(revenue * 100) / 100,
  }))
}

function calculateTopProducts(orderItems: any[]) {
  const productMap = new Map()

  orderItems.forEach((item) => {
    const productName = item.product?.title || "Unknown"
    const current = productMap.get(productName) || { quantity: 0, revenue: 0 }
    productMap.set(productName, {
      quantity: current.quantity + Number(item.quantity || 0),
      revenue: current.revenue + Number(item.total_price || 0),
    })
  })

  return Array.from(productMap.entries())
    .map(([name, data]) => ({
      product: name,
      quantity: data.quantity,
      revenue: Math.round(data.revenue * 100) / 100,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
}

function calculateOrderStatus(orders: any[]) {
  const statusMap = new Map([
    ["pending", 0],
    ["processing", 0],
    ["shipped", 0],
    ["delivered", 0],
    ["cancelled", 0],
  ])

  orders.forEach((order) => {
    const status = order.order_status || "pending"
    statusMap.set(status, (statusMap.get(status) || 0) + 1)
  })

  return Array.from(statusMap.entries()).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
  }))
}
