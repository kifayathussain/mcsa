import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

export interface SalesAnalytics {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  revenueByChannel: Array<{ channel: string; revenue: number; orders: number }>
  revenueByCategory: Array<{ category: string; revenue: number; orders: number }>
  topProducts: Array<{ sku: string; title: string; revenue: number; quantity: number }>
  dailyRevenue: Array<{ date: string; revenue: number; orders: number }>
  monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>
}

export interface PerformanceMetrics {
  conversionRate: number
  averageOrderValue: number
  customerAcquisitionCost: number
  inventoryTurnoverRate: number
  orderFulfillmentTime: number
  returnRate: number
}

export async function getSalesAnalytics(
  userId: string,
  dateRange?: { start: string; end: string }
): Promise<SalesAnalytics> {
  const supabase = await createSupabaseServerClient()
  
  const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const endDate = dateRange?.end || new Date().toISOString()

  // Get total revenue and orders
  const { data: totalStats } = await supabase
    .from("orders")
    .select("total_amount, order_status")
    .eq("user_id", userId)
    .gte("order_date", startDate)
    .lte("order_date", endDate)

  const totalRevenue = totalStats?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0
  const totalOrders = totalStats?.length || 0
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Revenue by channel
  const { data: channelStats } = await supabase
    .from("orders")
    .select(`
      total_amount,
      channels!inner(channel_type, channel_name)
    `)
    .eq("user_id", userId)
    .gte("order_date", startDate)
    .lte("order_date", endDate)

  const revenueByChannel = channelStats?.reduce((acc: any[], order: any) => {
    const channel = order.channels?.channel_type || "unknown"
    const existing = acc.find(item => item.channel === channel)
    if (existing) {
      existing.revenue += Number(order.total_amount || 0)
      existing.orders += 1
    } else {
      acc.push({
        channel,
        revenue: Number(order.total_amount || 0),
        orders: 1
      })
    }
    return acc
  }, []) || []

  // Revenue by category
  const { data: categoryStats } = await supabase
    .from("order_items")
    .select(`
      total_price,
      products!inner(category)
    `)
    .eq("orders.user_id", userId)
    .gte("orders.order_date", startDate)
    .lte("orders.order_date", endDate)

  const revenueByCategory = categoryStats?.reduce((acc: any[], item: any) => {
    const category = item.products?.category || "uncategorized"
    const existing = acc.find(cat => cat.category === category)
    if (existing) {
      existing.revenue += Number(item.total_price || 0)
      existing.orders += 1
    } else {
      acc.push({
        category,
        revenue: Number(item.total_price || 0),
        orders: 1
      })
    }
    return acc
  }, []) || []

  // Top products
  const { data: topProducts } = await supabase
    .from("order_items")
    .select(`
      sku,
      product_name,
      total_price,
      quantity,
      products!inner(title)
    `)
    .eq("orders.user_id", userId)
    .gte("orders.order_date", startDate)
    .lte("orders.order_date", endDate)
    .order("total_price", { ascending: false })
    .limit(10)

  const topProductsData = topProducts?.reduce((acc: any[], item: any) => {
    const sku = item.sku
    const existing = acc.find(product => product.sku === sku)
    if (existing) {
      existing.revenue += Number(item.total_price || 0)
      existing.quantity += Number(item.quantity || 0)
    } else {
      acc.push({
        sku,
        title: item.products?.title || item.product_name || sku,
        revenue: Number(item.total_price || 0),
        quantity: Number(item.quantity || 0)
      })
    }
    return acc
  }, []) || []

  // Daily revenue (last 30 days)
  const { data: dailyStats } = await supabase
    .from("orders")
    .select("total_amount, order_date")
    .eq("user_id", userId)
    .gte("order_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order("order_date", { ascending: true })

  const dailyRevenue = dailyStats?.reduce((acc: any[], order: any) => {
    const date = new Date(order.order_date).toISOString().split('T')[0]
    const existing = acc.find(item => item.date === date)
    if (existing) {
      existing.revenue += Number(order.total_amount || 0)
      existing.orders += 1
    } else {
      acc.push({
        date,
        revenue: Number(order.total_amount || 0),
        orders: 1
      })
    }
    return acc
  }, []) || []

  // Monthly revenue (last 12 months)
  const { data: monthlyStats } = await supabase
    .from("orders")
    .select("total_amount, order_date")
    .eq("user_id", userId)
    .gte("order_date", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
    .order("order_date", { ascending: true })

  const monthlyRevenue = monthlyStats?.reduce((acc: any[], order: any) => {
    const month = new Date(order.order_date).toISOString().substring(0, 7) // YYYY-MM
    const existing = acc.find(item => item.month === month)
    if (existing) {
      existing.revenue += Number(order.total_amount || 0)
      existing.orders += 1
    } else {
      acc.push({
        month,
        revenue: Number(order.total_amount || 0),
        orders: 1
      })
    }
    return acc
  }, []) || []

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    revenueByChannel,
    revenueByCategory,
    topProducts: topProductsData,
    dailyRevenue,
    monthlyRevenue
  }
}

export async function getPerformanceMetrics(userId: string): Promise<PerformanceMetrics> {
  const supabase = await createSupabaseServerClient()
  
  // Get orders for calculations
  const { data: orders } = await supabase
    .from("orders")
    .select("total_amount, order_status, order_date, shipped_date")
    .eq("user_id", userId)
    .gte("order_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  const totalOrders = orders?.length || 0
  const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Calculate fulfillment time
  const shippedOrders = orders?.filter(order => order.shipped_date) || []
  const fulfillmentTimes = shippedOrders.map(order => {
    const orderDate = new Date(order.order_date)
    const shippedDate = new Date(order.shipped_date!)
    return (shippedDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24) // days
  })
  const orderFulfillmentTime = fulfillmentTimes.length > 0 
    ? fulfillmentTimes.reduce((sum, time) => sum + time, 0) / fulfillmentTimes.length 
    : 0

  // Get inventory turnover (simplified calculation)
  const { data: inventory } = await supabase
    .from("inventory")
    .select("quantity, products!inner(cost)")
    .eq("products.user_id", userId)

  const totalInventoryValue = inventory?.reduce((sum, item) => 
    sum + (Number(item.quantity || 0) * Number(item.products?.[0]?.cost || 0)), 0) || 0
  
  const inventoryTurnoverRate = totalInventoryValue > 0 ? totalRevenue / totalInventoryValue : 0

  return {
    conversionRate: 0, // Would need visitor data
    averageOrderValue,
    customerAcquisitionCost: 0, // Would need marketing spend data
    inventoryTurnoverRate,
    orderFulfillmentTime,
    returnRate: 0 // Would need return data
  }
}
