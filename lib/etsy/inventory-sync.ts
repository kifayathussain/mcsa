import { EtsyRestClient } from "@/lib/etsy/rest-client"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type EtsyListing = any

export async function syncEtsyInventoryForChannel(channelId: string, accessToken: string) {
  const supabase = await createSupabaseServerClient()

  const client = new EtsyRestClient({
    clientId: process.env.ETSY_CLIENT_ID || "",
    clientSecret: process.env.ETSY_CLIENT_SECRET || "",
    redirectUri: process.env.ETSY_REDIRECT_URI || "",
    environment: (process.env.ETSY_ENV || "SANDBOX") as "PRODUCTION" | "SANDBOX",
  })

  // Fetch shop listings
  const result = await client.apiRequest<{ results?: EtsyListing[] }>(
    { accessToken },
    "GET",
    "/application/shops/active/listings/active",
    { query: { limit: 50 } },
  )

  const listings = result.results || []

  let updated = 0
  for (const listing of listings) {
    const sku = listing.listing_id?.toString() || ""
    const quantity = Number(listing.quantity || 0)

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
          warehouse_location: "etsy",
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
