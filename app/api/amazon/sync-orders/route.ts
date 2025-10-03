import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAmazonClient } from "@/lib/amazon/sp-api-client"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { channelId } = await request.json()

    // Get channel credentials
    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .select("*")
      .eq("id", channelId)
      .eq("user_id", user.id)
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    if (channel.channel_type !== "amazon") {
      return NextResponse.json({ error: "Invalid channel type" }, { status: 400 })
    }

    // Create Amazon SP-API client
    const amazonClient = createAmazonClient(channel.api_credentials)

    // Sync orders from last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const ordersResponse = await amazonClient.getOrders({
      marketplaceIds: [channel.api_credentials.marketplace_id],
      createdAfter: thirtyDaysAgo.toISOString(),
    })

    let syncedCount = 0

    // Process each order
    for (const amazonOrder of ordersResponse.payload.Orders || []) {
      // Check if order already exists
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("external_order_id", amazonOrder.AmazonOrderId)
        .single()

      if (existingOrder) {
        continue // Skip if already synced
      }

      // Get order items
      const itemsResponse = await amazonClient.getOrderItems(amazonOrder.AmazonOrderId)
      const orderItems = itemsResponse.payload.OrderItems || []

      // Insert order
      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          channel_id: channelId,
          external_order_id: amazonOrder.AmazonOrderId,
          order_number: amazonOrder.AmazonOrderId,
          customer_name: amazonOrder.BuyerInfo?.BuyerName || "Amazon Customer",
          customer_email: amazonOrder.BuyerInfo?.BuyerEmail || null,
          shipping_address: amazonOrder.ShippingAddress || {},
          order_status: mapAmazonOrderStatus(amazonOrder.OrderStatus),
          payment_status: amazonOrder.OrderStatus === "Shipped" ? "paid" : "pending",
          total_amount: Number.parseFloat(amazonOrder.OrderTotal?.Amount || "0"),
          tax_amount: 0,
          shipping_amount: 0,
          order_date: amazonOrder.PurchaseDate,
        })
        .select()
        .single()

      if (orderError || !newOrder) {
        console.error("Failed to insert order:", orderError)
        continue
      }

      // Insert order items
      for (const item of orderItems) {
        await supabase.from("order_items").insert({
          order_id: newOrder.id,
          sku: item.SellerSKU,
          product_name: item.Title,
          quantity: item.QuantityOrdered,
          unit_price: Number.parseFloat(item.ItemPrice?.Amount || "0") / item.QuantityOrdered,
          total_price: Number.parseFloat(item.ItemPrice?.Amount || "0"),
        })
      }

      syncedCount++
    }

    // Update last sync time
    await supabase.from("channels").update({ last_sync_at: new Date().toISOString() }).eq("id", channelId)

    return NextResponse.json({ success: true, syncedCount })
  } catch (error) {
    console.error("Amazon sync error:", error)
    return NextResponse.json({ error: "Failed to sync orders" }, { status: 500 })
  }
}

function mapAmazonOrderStatus(amazonStatus: string): string {
  const statusMap: Record<string, string> = {
    Pending: "pending",
    Unshipped: "processing",
    PartiallyShipped: "processing",
    Shipped: "shipped",
    Canceled: "cancelled",
    Unfulfillable: "cancelled",
  }
  return statusMap[amazonStatus] || "pending"
}
