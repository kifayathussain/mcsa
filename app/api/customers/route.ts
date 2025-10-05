import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { getCustomers, getCustomerDetails, getCustomerOrders, updateCustomer, createCustomerSegment } from "@/lib/customers/customer-service"

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")
  const customerId = searchParams.get("customerId")

  try {
    switch (action) {
      case "list":
        const customers = await getCustomers(user.id, {
          search: searchParams.get("search") || undefined,
          segment: searchParams.get("segment") || undefined,
          tags: searchParams.get("tags")?.split(",") || undefined,
          limit: Number(searchParams.get("limit")) || 50,
          offset: Number(searchParams.get("offset")) || 0
        })
        return NextResponse.json({ success: true, data: customers })

      case "details":
        if (!customerId) return NextResponse.json({ error: "Customer ID required" }, { status: 400 })
        const customer = await getCustomerDetails(user.id, customerId)
        return NextResponse.json({ success: true, data: customer })

      case "orders":
        if (!customerId) return NextResponse.json({ error: "Customer ID required" }, { status: 400 })
        const orders = await getCustomerOrders(user.id, customerId, Number(searchParams.get("limit")) || 20)
        return NextResponse.json({ success: true, data: orders })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch customer data" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")
  const customerId = searchParams.get("customerId")

  try {
    const body = await req.json()

    switch (action) {
      case "update":
        if (!customerId) return NextResponse.json({ error: "Customer ID required" }, { status: 400 })
        await updateCustomer(user.id, customerId, body)
        return NextResponse.json({ success: true })

      case "create-segment":
        const segment = await createCustomerSegment(user.id, body)
        return NextResponse.json({ success: true, data: segment })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update customer data" }, { status: 500 })
  }
}
