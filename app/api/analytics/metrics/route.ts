import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "30d"

    // Calculate date range
    const now = new Date()
    let startDate: Date
    
    switch (range) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Calculate previous period for comparison
    const periodLength = now.getTime() - startDate.getTime()
    const previousStartDate = new Date(startDate.getTime() - periodLength)
    const previousEndDate = new Date(startDate.getTime())

    // Fetch current period data
    const { data: currentOrders, count: currentOrderCount } = await supabase
      .from("orders")
      .select("total_amount", { count: "exact" })
      .eq("user_id", user.id)
      .gte("order_date", startDate.toISOString())
      .lte("order_date", now.toISOString())

    const { data: currentCustomers, count: currentCustomerCount } = await supabase
      .from("customers")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", now.toISOString())

    const { data: currentProducts, count: currentProductCount } = await supabase
      .from("products")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", now.toISOString())

    // Fetch previous period data
    const { data: previousOrders, count: previousOrderCount } = await supabase
      .from("orders")
      .select("total_amount", { count: "exact" })
      .eq("user_id", user.id)
      .gte("order_date", previousStartDate.toISOString())
      .lte("order_date", previousEndDate.toISOString())

    const { data: previousCustomers, count: previousCustomerCount } = await supabase
      .from("customers")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .gte("created_at", previousStartDate.toISOString())
      .lte("created_at", previousEndDate.toISOString())

    const { data: previousProducts, count: previousProductCount } = await supabase
      .from("products")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .gte("created_at", previousStartDate.toISOString())
      .lte("created_at", previousEndDate.toISOString())

    // Calculate metrics
    const currentRevenue = currentOrders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0
    const previousRevenue = previousOrders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0
    
    const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const orderChange = (previousOrderCount || 0) > 0 ? (((currentOrderCount || 0) - (previousOrderCount || 0)) / (previousOrderCount || 0)) * 100 : 0
    const customerChange = (previousCustomerCount || 0) > 0 ? (((currentCustomerCount || 0) - (previousCustomerCount || 0)) / (previousCustomerCount || 0)) * 100 : 0
    const productChange = (previousProductCount || 0) > 0 ? (((currentProductCount || 0) - (previousProductCount || 0)) / (previousProductCount || 0)) * 100 : 0

    const metrics = [
      {
        title: "Total Revenue",
        value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(currentRevenue),
        change: Math.abs(revenueChange),
        changeType: revenueChange >= 0 ? "increase" : "decrease",
        icon: "DollarSign",
        color: "bg-green-100"
      },
      {
        title: "Total Orders",
        value: currentOrderCount || 0,
        change: Math.abs(orderChange),
        changeType: orderChange >= 0 ? "increase" : "decrease",
        icon: "ShoppingCart",
        color: "bg-blue-100"
      },
      {
        title: "New Customers",
        value: currentCustomerCount || 0,
        change: Math.abs(customerChange),
        changeType: customerChange >= 0 ? "increase" : "decrease",
        icon: "Users",
        color: "bg-purple-100"
      },
      {
        title: "Products Listed",
        value: currentProductCount || 0,
        change: Math.abs(productChange),
        changeType: productChange >= 0 ? "increase" : "decrease",
        icon: "Package",
        color: "bg-orange-100"
      }
    ]

    return NextResponse.json({ success: true, data: metrics })
  } catch (error) {
    console.error("Metrics API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
