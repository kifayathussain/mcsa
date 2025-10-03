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

    // Get inventory summaries
    const inventoryResponse = await amazonClient.getInventorySummaries({
      marketplaceIds: [channel.api_credentials.marketplace_id],
    })

    let syncedCount = 0

    // Process each inventory item
    for (const item of inventoryResponse.payload.inventorySummaries || []) {
      // Find matching product by SKU
      const { data: product } = await supabase
        .from("products")
        .select("id")
        .eq("sku", item.sellerSku)
        .eq("user_id", user.id)
        .single()

      if (!product) {
        continue // Skip if product doesn't exist locally
      }

      // Update or create inventory record
      const { data: existingInventory } = await supabase
        .from("inventory")
        .select("id")
        .eq("product_id", product.id)
        .eq("warehouse_location", "amazon")
        .single()

      const totalQuantity = item.totalQuantity || 0

      if (existingInventory) {
        await supabase
          .from("inventory")
          .update({
            quantity: totalQuantity,
            last_updated_at: new Date().toISOString(),
          })
          .eq("id", existingInventory.id)
      } else {
        await supabase.from("inventory").insert({
          product_id: product.id,
          warehouse_location: "amazon",
          quantity: totalQuantity,
          reserved_quantity: 0,
        })
      }

      syncedCount++
    }

    // Update last sync time
    await supabase.from("channels").update({ last_sync_at: new Date().toISOString() }).eq("id", channelId)

    return NextResponse.json({ success: true, syncedCount })
  } catch (error) {
    console.error("Amazon inventory sync error:", error)
    return NextResponse.json({ error: "Failed to sync inventory" }, { status: 500 })
  }
}
