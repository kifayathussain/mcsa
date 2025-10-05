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
    const action = searchParams.get("action")

    switch (action) {
      case "carriers":
        const { data: carriers, error: carriersError } = await supabase
          .from("shipping_carriers")
          .select(`
            *,
            shipping_services(*)
          `)
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("name")

        if (carriersError) throw carriersError

        return NextResponse.json({ success: true, data: carriers })

      case "labels":
        const orderId = searchParams.get("orderId")
        let labelsQuery = supabase
          .from("shipping_labels")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (orderId) {
          labelsQuery = labelsQuery.eq("order_id", orderId)
        }

        const { data: labels, error: labelsError } = await labelsQuery

        if (labelsError) throw labelsError

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
        // Mock rate calculation - in real implementation, call carrier APIs
        const { fromAddress, toAddress, package: packageData } = body
        
        if (!fromAddress || !toAddress || !packageData) {
          return NextResponse.json({ success: false, error: "Missing required data" }, { status: 400 })
        }

        // Mock rates for demonstration
        const mockRates = [
          {
            carrierId: "usps-1",
            serviceId: "usps-ground",
            serviceName: "USPS Ground",
            rate: 8.50,
            currency: "USD",
            estimatedDays: 5,
            deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            carrierId: "ups-1",
            serviceId: "ups-ground",
            serviceName: "UPS Ground",
            rate: 12.75,
            currency: "USD",
            estimatedDays: 3,
            deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            carrierId: "fedex-1",
            serviceId: "fedex-ground",
            serviceName: "FedEx Ground",
            rate: 15.25,
            currency: "USD",
            estimatedDays: 2,
            deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]

        return NextResponse.json({ success: true, data: mockRates })

      case "create-label":
        const { orderId, carrierId, serviceId, fromAddress: labelFromAddress, toAddress: labelToAddress, package: labelPackage } = body
        
        if (!orderId || !carrierId || !serviceId || !labelFromAddress || !labelToAddress || !labelPackage) {
          return NextResponse.json({ success: false, error: "Missing required data" }, { status: 400 })
        }

        // Generate mock tracking number
        const trackingNumber = `1Z${Math.random().toString(36).substring(2, 18).toUpperCase()}`
        
        const { data: label, error: labelError } = await supabase
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
              fromAddress: labelFromAddress,
              toAddress: labelToAddress,
              package: labelPackage,
              generatedAt: new Date().toISOString()
            }),
            status: "created"
          })
          .select()
          .single()

        if (labelError) throw labelError

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
