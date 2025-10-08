import { ShopifyRestClient, createShopifyClientFromCredentials } from "@/lib/shopify/rest-client"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type ShopifyOrder = any

export async function syncShopifyOrdersForChannel(channelId: string, credentials: any) {
  const supabase = await createSupabaseServerClient()
  
  // Validate credentials
  if (!credentials || !credentials.shop_url || !credentials.access_token) {
    throw new Error("Invalid Shopify credentials: missing shop_url or access_token")
  }
  
  const client = createShopifyClientFromCredentials(credentials)

  try {
    // Fetch recent orders
    console.log("Fetching orders from Shopify...")
    const result = await client.getOrders({ limit: 50, status: "any" })
    const orders = result.orders || []
    console.log(`Found ${orders.length} orders to sync`)

    let upserted = 0
    for (const order of orders) {
      try {
        const externalOrderId = order.id?.toString() || ""
        const customer = order.customer || {}
        const orderDate = order.created_at ? new Date(order.created_at).toISOString() : new Date().toISOString()

        const shippingAddress = order.shipping_address || order.billing_address || {}
        const address = {
          street: shippingAddress.address1,
          city: shippingAddress.city,
          state: shippingAddress.province,
          zip: shippingAddress.zip,
          country: shippingAddress.country_code,
        }

        const total = Number(order.total_price || 0)
        const tax = Number(order.total_tax || 0)
        const shipping = Number(order.shipping_lines?.reduce((sum: number, line: any) => sum + Number(line.price || 0), 0) || 0)

        const { error: upsertErr } = await supabase.from("orders").upsert(
          {
            user_id: undefined, // RLS: inferred via joining channel in a secure RPC in production
            channel_id: channelId,
            external_order_id: externalOrderId,
            order_number: order.order_number || externalOrderId,
            customer_name: `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || customer.email || "",
            customer_email: customer.email || null,
            shipping_address: address,
            total_amount: total,
            tax_amount: tax,
            shipping_amount: shipping,
            order_status: order.fulfillment_status === "fulfilled" ? "shipped" : "processing",
            order_date: orderDate,
          },
          { onConflict: "channel_id,external_order_id" },
        )

        if (upsertErr) {
          console.error("Order upsert failed for order", externalOrderId, upsertErr)
          continue
        }

        // Order items upsert: fetch reference to order row
        const { data: orderRow } = await supabase
          .from("orders")
          .select("id")
          .eq("channel_id", channelId)
          .eq("external_order_id", externalOrderId)
          .maybeSingle()

        if (!orderRow?.id) {
          console.error("Could not find order row after upsert for order", externalOrderId)
          continue
        }

        const lineItems = order.line_items || []
        for (const item of lineItems) {
          try {
            const sku = item.sku || item.variant_id?.toString() || ""
            const quantity = Number(item.quantity || 1)
            const unitPrice = Number(item.price || 0)

            const { error: itemErr } = await supabase.from("order_items").insert({
              order_id: orderRow.id,
              product_id: null,
              sku,
              product_name: item.title || item.name || sku,
              quantity,
              unit_price: unitPrice,
              total_price: unitPrice * quantity,
            })
            if (itemErr) {
              console.error("Order item insert failed for order", externalOrderId, "item", sku, itemErr)
            }
          } catch (itemError) {
            console.error("Error processing order item for order", externalOrderId, itemError)
          }
        }

        upserted += 1
      } catch (orderError) {
        console.error("Error processing order", order.id, orderError)
        continue
      }
    }

    await supabase.from("channels").update({ last_sync_at: new Date().toISOString() }).eq("id", channelId)

    return { count: upserted }
  } catch (error) {
    console.error("Shopify order sync failed:", error)
    throw error
  }
}

export { createShopifyClientFromCredentials }
