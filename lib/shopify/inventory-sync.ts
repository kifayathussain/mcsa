import { ShopifyRestClient } from "@/lib/shopify/rest-client"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type ShopifyProduct = any

export async function syncShopifyInventoryForChannel(channelId: string, credentials: any) {
  const supabase = await createSupabaseServerClient()
  const client = createShopifyClientFromCredentials(credentials)

  // Fetch products
  const result = await client.getProducts({ limit: 50 })
  const products = result.products || []

  let updated = 0
  for (const product of products) {
    const variants = product.variants || []
    
    for (const variant of variants) {
      const sku = variant.sku || variant.id?.toString() || ""
      const quantity = Number(variant.inventory_quantity || 0)

      // Map SKU to local product
      const { data: localProduct } = await supabase
        .from("products")
        .select("id")
        .eq("sku", sku)
        .maybeSingle()

      if (!localProduct?.id) continue

      const { error: invErr } = await supabase
        .from("inventory")
        .upsert(
          {
            product_id: localProduct.id,
            warehouse_location: "shopify",
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
  }

  await supabase.from("channels").update({ last_sync_at: new Date().toISOString() }).eq("id", channelId)

  return { count: updated }
}

export { createShopifyClientFromCredentials }
