import { WalmartRestClient, createWalmartClientFromCredentials } from "@/lib/walmart/rest-client"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type WalmartInventoryItem = any

export async function syncWalmartInventoryForChannel(channelId: string, credentials: any) {
  const supabase = await createSupabaseServerClient()
  const client = createWalmartClientFromCredentials(credentials)

  // Fetch inventory items
  const result = await client.getInventory({ limit: 50 })
  const items = result.elements || []

  let updated = 0
  for (const item of items) {
    const sku = item.sku || ""
    const quantity = Number(item.quantity?.amount || 0)

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
          warehouse_location: "walmart",
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

export { createWalmartClientFromCredentials }
