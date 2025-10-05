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
    const orderId = searchParams.get("orderId")
    
    let query = supabase
      .from("shipping_labels")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (orderId) {
      query = query.eq("order_id", orderId)
    }

    const { data: labels, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data: labels })
  } catch (error) {
    console.error("Shipping labels API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, carrierId, serviceId, fromAddress, toAddress, package: packageData } = body
    
    if (!orderId || !carrierId || !serviceId || !fromAddress || !toAddress || !packageData) {
      return NextResponse.json({ success: false, error: "Missing required data" }, { status: 400 })
    }

    // Generate mock tracking number
    const trackingNumber = `1Z${Math.random().toString(36).substring(2, 18).toUpperCase()}`
    
    const { data: label, error } = await supabase
      .from("shipping_labels")
      .insert({
        user_id: user.id,
        order_id: orderId,
        carrier_id: carrierId,
        service_id: serviceId,
        tracking_number: trackingNumber,
        label_url: `/api/shipping/labels/${trackingNumber}`,
        label_data: JSON.stringify({
          carrierId,
          serviceId,
          trackingNumber,
          fromAddress,
          toAddress,
          package: packageData,
          generatedAt: new Date().toISOString()
        }),
        status: "created"
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: label })
  } catch (error) {
    console.error("Shipping labels API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
