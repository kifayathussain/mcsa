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

    const { channelId, productId } = await request.json()

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

    // Get product details
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("user_id", user.id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Create Amazon SP-API client
    const amazonClient = createAmazonClient(channel.api_credentials)

    // Create listing data
    const listingData = {
      productType: "PRODUCT",
      requirements: "LISTING",
      attributes: {
        condition_type: [{ value: "new_new", marketplace_id: channel.api_credentials.marketplace_id }],
        item_name: [{ value: product.title, marketplace_id: channel.api_credentials.marketplace_id }],
        description: [
          { value: product.description || product.title, marketplace_id: channel.api_credentials.marketplace_id },
        ],
        list_price: [
          {
            value: { Amount: product.price, CurrencyCode: "USD" },
            marketplace_id: channel.api_credentials.marketplace_id,
          },
        ],
        fulfillment_availability: [
          {
            value: {
              fulfillment_channel_code: "DEFAULT",
              quantity: 1,
            },
            marketplace_id: channel.api_credentials.marketplace_id,
          },
        ],
      },
    }

    // List product on Amazon
    await amazonClient.putListingsItem(
      channel.api_credentials.seller_id,
      product.sku,
      [channel.api_credentials.marketplace_id],
      listingData,
    )

    // Create product listing record
    await supabase.from("product_listings").insert({
      product_id: productId,
      channel_id: channelId,
      channel_sku: product.sku,
      channel_price: product.price,
      is_active: true,
      last_synced_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Amazon list product error:", error)
    return NextResponse.json({ error: "Failed to list product on Amazon" }, { status: 500 })
  }
}
