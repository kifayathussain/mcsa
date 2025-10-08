import { ShopifyRestClient, createShopifyClientFromCredentials } from "@/lib/shopify/rest-client"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type ShopifyProduct = any

export async function syncShopifyInventoryForChannel(channelId: string, credentials: any) {
  const supabase = await createSupabaseServerClient()
  
  // Get the user_id from the channel
  const { data: channelData } = await supabase
    .from("channels")
    .select("user_id")
    .eq("id", channelId)
    .single()
  
  if (!channelData?.user_id) {
    throw new Error("Could not find user_id for channel")
  }
  
  // Validate credentials
  if (!credentials || !credentials.shop_url || !credentials.access_token) {
    throw new Error("Invalid Shopify credentials: missing shop_url or access_token")
  }
  
  const client = createShopifyClientFromCredentials(credentials)

  try {
    // Fetch products
    console.log("Fetching products from Shopify...")
    const result = await client.getProducts({ limit: 50 })
    const products = result.products || []
    console.log(`Found ${products.length} products to sync`)

    let updated = 0
    for (const product of products) {
      try {
        console.log(`Processing Shopify product:`, {
          id: product.id,
          title: product.title,
          status: product.status,
          variants: product.variants?.length || 0
        })
        
        const variants = product.variants || []
        
        for (const variant of variants) {
          try {
            const sku = variant.sku || variant.id?.toString() || ""
            const quantity = Number(variant.inventory_quantity || 0)
            
            console.log(`Processing variant:`, {
              sku,
              title: variant.title,
              product_title: product.title,
              quantity
            })

            // Map SKU to local product
            const { data: localProduct } = await supabase
              .from("products")
              .select("id, title")
              .eq("sku", sku)
              .maybeSingle()

            if (!localProduct?.id) {
              console.log(`No local product found for SKU: ${sku}, creating new product`)
              
              // Create a new product if it doesn't exist
              let productTitle = product.title || sku
              
              // Only use variant title if it's meaningful (not "Default Title")
              if (variant.title && variant.title !== "Default Title" && product.title === "Default Title") {
                productTitle = variant.title
              }
              // Don't combine with "Default Title" - just use the product title
              
              console.log(`Creating product with title: "${productTitle}" for SKU: ${sku}`)
              console.log(`Original product title: "${product.title}", variant title: "${variant.title}"`)
              
              const { data: newProduct, error: createError } = await supabase
                .from("products")
                .insert({
                  user_id: channelData.user_id,
                  sku,
                  title: productTitle,
                  description: product.body_html || "",
                  price: Number(variant.price || 0),
                  cost: Number(variant.price || 0) * 0.7, // Assume 30% margin
                  weight: Number(variant.weight || 0),
                  status: product.status === "active" ? "active" : "inactive",
                })
                .select("id")
                .single()

              if (createError) {
                console.error("Failed to create product for SKU", sku, createError)
                continue
              }

              console.log(`Created new product for SKU: ${sku}`)
              
              // Use the newly created product
              const { error: invErr } = await supabase
                .from("inventory")
                .upsert(
                  {
                    product_id: newProduct.id,
                    warehouse_location: "shopify",
                    quantity,
                    reserved_quantity: 0,
                    reorder_point: 0,
                  },
                  { onConflict: "product_id,warehouse_location" },
                )

              if (invErr) {
                console.error("Inventory upsert failed for new product SKU", sku, invErr)
                continue
              }

              updated += 1
              continue
            }

            // Check if existing product has "Default Title" and update it
            if (localProduct.title === "Default Title" || localProduct.title === "default title" || localProduct.title.includes("Default Title")) {
              let productTitle = product.title || sku
              
              // Only use variant title if it's meaningful (not "Default Title")
              if (variant.title && variant.title !== "Default Title" && product.title === "Default Title") {
                productTitle = variant.title
              }
              // Don't combine with "Default Title" - just use the product title
              
              console.log(`Updating product title from "${localProduct.title}" to "${productTitle}" for SKU: ${sku}`)
              
              const { error: updateError } = await supabase
                .from("products")
                .update({ title: productTitle })
                .eq("id", localProduct.id)
              
              if (updateError) {
                console.error("Failed to update product title for SKU", sku, updateError)
              } else {
                console.log(`Successfully updated product title for SKU: ${sku}`)
              }
            }

            const { error: invErr } = await supabase
              .from("inventory")
              .upsert(
                {
                  product_id: localProduct.id,
                  warehouse_location: "shopify",
                  quantity,
                  reserved_quantity: 0,
                  reorder_point: 0,
                },
                { onConflict: "product_id,warehouse_location" },
              )

            if (invErr) {
              console.error("Inventory upsert failed for SKU", sku, invErr)
              continue
            }

            updated += 1
          } catch (variantError) {
            console.error("Error processing variant", variant.id, variantError)
            continue
          }
        }
      } catch (productError) {
        console.error("Error processing product", product.id, productError)
        continue
      }
    }

    await supabase.from("channels").update({ last_sync_at: new Date().toISOString() }).eq("id", channelId)

    return { count: updated }
  } catch (error) {
    console.error("Shopify inventory sync failed:", error)
    throw error
  }
}

export { createShopifyClientFromCredentials }
