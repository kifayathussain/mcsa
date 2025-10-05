import { EbayRestClient } from "@/lib/ebay/rest-client"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type EbayInventoryItem = any

export async function syncEbayInventoryForChannel(channelId: string, accessToken: string) {
  const supabase = await createSupabaseServerClient()

  const client = new EbayRestClient({
    clientId: process.env.EBAY_CLIENT_ID || "",
    clientSecret: process.env.EBAY_CLIENT_SECRET || "",
    redirectUri: process.env.EBAY_REDIRECT_URI || "",
    environment: (process.env.EBAY_ENV || "SANDBOX") as "PRODUCTION" | "SANDBOX",
  })

  // Fetch inventory items (paginate if necessary)
  const result = await client.apiRequest<{ inventoryItems?: EbayInventoryItem[] }>(
    { accessToken },
    "GET",
    "/sell/inventory/v1/inventory_item",
    { query: { limit: 50 } },
  )

  const items = result.inventoryItems || []

  let updated = 0
  for (const item of items) {
    const sku = item.sku || item.merchantLocationKey || item.title
    const quantity = Number(item.availability?.shipToLocationAvailability?.quantity || 0)

    // Map SKU to local product
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("sku", sku)
      .maybeSingle()

    if (!product?.id) continue

    const { error: invErr } = await supabase
      .from("inventory")
      .upsert(
        {
          product_id: product.id,
          warehouse_location: "ebay",
          quantity,
          reserved_quantity: 0,
        },
        { onConflict: "product_id,warehouse_location" },
      )

    if (invErr) {
      // eslint-disable-next-line no-console
      console.error("Inventory upsert failed", invErr)
      continue
    }

    updated += 1
  }

  await supabase.from("channels").update({ last_sync_at: new Date().toISOString() }).eq("id", channelId)

  return { count: updated }
}


