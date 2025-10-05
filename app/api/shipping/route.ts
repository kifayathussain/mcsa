import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { 
  getShippingCarriers, 
  calculateShippingRates, 
  createShippingLabel, 
  getShippingLabels 
} from "@/lib/shipping/shipping-service"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    switch (action) {
      case "carriers":
        const carriers = await getShippingCarriers(user.id)
        return NextResponse.json({ success: true, data: carriers })

      case "labels":
        const orderId = searchParams.get("orderId")
        const labels = await getShippingLabels(user.id, orderId || undefined)
        return NextResponse.json({ success: true, data: labels })

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Shipping API error:", error)
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
    const { action } = body

    switch (action) {
      case "calculate-rates":
        const { fromAddress, toAddress, package: packageData } = body
        
        if (!fromAddress || !toAddress || !packageData) {
          return NextResponse.json({ success: false, error: "Missing required data" }, { status: 400 })
        }
        
        const rates = await calculateShippingRates(user.id, fromAddress, toAddress, packageData)
        return NextResponse.json({ success: true, data: rates })

      case "create-label":
        const { orderId, carrierId, serviceId, fromAddress: labelFromAddress, toAddress: labelToAddress, package: labelPackage } = body
        
        if (!orderId || !carrierId || !serviceId || !labelFromAddress || !labelToAddress || !labelPackage) {
          return NextResponse.json({ success: false, error: "Missing required data" }, { status: 400 })
        }
        
        const label = await createShippingLabel(
          user.id, 
          orderId, 
          carrierId, 
          serviceId, 
          labelFromAddress, 
          labelToAddress, 
          labelPackage
        )
        return NextResponse.json({ success: true, data: label })

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Shipping API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
