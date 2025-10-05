import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { getSalesAnalytics, getPerformanceMetrics } from "@/lib/analytics/sales-analytics"

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const type = searchParams.get("type") || "sales"

  try {
    if (type === "sales") {
      const analytics = await getSalesAnalytics(user.id, 
        startDate && endDate ? { start: startDate, end: endDate } : undefined
      )
      return NextResponse.json({ success: true, data: analytics })
    } else if (type === "performance") {
      const metrics = await getPerformanceMetrics(user.id)
      return NextResponse.json({ success: true, data: metrics })
    } else {
      return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch analytics" }, { status: 500 })
  }
}
