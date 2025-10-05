import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "30d"
    const groupBy = searchParams.get("groupBy") || "day"

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

    // Fetch chart data based on groupBy
    let chartData: any[] = []
    
    if (groupBy === "day") {
      const { data: orders } = await supabase
        .from("orders")
        .select("order_date, total_amount")
        .eq("user_id", user.id)
        .gte("order_date", startDate.toISOString())
        .lte("order_date", now.toISOString())
        .order("order_date", { ascending: true })

      // Group by day
      const dailyData: { [key: string]: { revenue: number; orders: number } } = {}
      
      orders?.forEach(order => {
        const date = new Date(order.order_date).toISOString().split('T')[0]
        if (!dailyData[date]) {
          dailyData[date] = { revenue: 0, orders: 0 }
        }
        dailyData[date].revenue += Number(order.total_amount || 0)
        dailyData[date].orders += 1
      })

      chartData = Object.entries(dailyData).map(([date, data]) => ({
        name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        date,
        value: data.revenue,
        revenue: data.revenue,
        orders: data.orders
      }))
    } else if (groupBy === "week") {
      // Group by week
      const { data: orders } = await supabase
        .from("orders")
        .select("order_date, total_amount")
        .eq("user_id", user.id)
        .gte("order_date", startDate.toISOString())
        .lte("order_date", now.toISOString())
        .order("order_date", { ascending: true })

      const weeklyData: { [key: string]: { revenue: number; orders: number } } = {}
      
      orders?.forEach(order => {
        const date = new Date(order.order_date)
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
        const weekKey = weekStart.toISOString().split('T')[0]
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { revenue: 0, orders: 0 }
        }
        weeklyData[weekKey].revenue += Number(order.total_amount || 0)
        weeklyData[weekKey].orders += 1
      })

      chartData = Object.entries(weeklyData).map(([weekStart, data]) => ({
        name: `Week of ${new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        date: weekStart,
        value: data.revenue,
        revenue: data.revenue,
        orders: data.orders
      }))
    } else if (groupBy === "month") {
      // Group by month
      const { data: orders } = await supabase
        .from("orders")
        .select("order_date, total_amount")
        .eq("user_id", user.id)
        .gte("order_date", startDate.toISOString())
        .lte("order_date", now.toISOString())
        .order("order_date", { ascending: true })

      const monthlyData: { [key: string]: { revenue: number; orders: number } } = {}
      
      orders?.forEach(order => {
        const date = new Date(order.order_date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, orders: 0 }
        }
        monthlyData[monthKey].revenue += Number(order.total_amount || 0)
        monthlyData[monthKey].orders += 1
      })

      chartData = Object.entries(monthlyData).map(([monthKey, data]) => ({
        name: new Date(monthKey + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        date: monthKey,
        value: data.revenue,
        revenue: data.revenue,
        orders: data.orders
      }))
    }

    return NextResponse.json({ success: true, data: chartData })
  } catch (error) {
    console.error("Charts API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
