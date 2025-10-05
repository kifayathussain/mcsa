import { WalmartRestClient, createWalmartClientFromCredentials } from "@/lib/walmart/rest-client"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type WalmartOrder = any

export async function syncWalmartOrdersForChannel(channelId: string, credentials: any) {
  const supabase = await createSupabaseServerClient()
  const client = createWalmartClientFromCredentials(credentials)

  // Fetch recent orders
  const result = await client.getOrders({ limit: 50 })
  const orders = result.elements || []

  let upserted = 0
  for (const order of orders) {
    const externalOrderId = order.purchaseOrderId || order.orderId || ""
    const customer = order.customerInfo || {}
    const orderDate = order.orderDate ? new Date(order.orderDate).toISOString() : new Date().toISOString()

    const shippingAddress = order.shippingInfo?.postalAddress || {}
    const address = {
      street: shippingAddress.addressLine1,
      city: shippingAddress.city,
      state: shippingAddress.state,
      zip: shippingAddress.postalCode,
      country: shippingAddress.countryCode,
    }

    const total = Number(order.orderTotal?.amount || 0)
    const tax = Number(order.orderTotal?.tax?.amount || 0)
    const shipping = Number(order.orderTotal?.shipping?.amount || 0)

    const { error: upsertErr } = await supabase.from("orders").upsert(
      {
        user_id: undefined, // RLS: inferred via joining channel in a secure RPC in production
        channel_id: channelId,
        external_order_id: externalOrderId,
        order_number: externalOrderId,
        customer_name: `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "",
        customer_email: customer.email || null,
        shipping_address: address,
        total_amount: total,
        tax_amount: tax,
        shipping_amount: shipping,
        order_status: order.orderStatus === "Shipped" ? "shipped" : "processing",
        order_date: orderDate,
      },
      { onConflict: "channel_id,external_order_id" },
    )

    if (upsertErr) {
      // eslint-disable-next-line no-console
      console.error("Order upsert failed", upsertErr)
      continue
    }

    // Order items upsert: fetch reference to order row
    const { data: orderRow } = await supabase
      .from("orders")
      .select("id")
      .eq("channel_id", channelId)
      .eq("external_order_id", externalOrderId)
      .maybeSingle()

    if (!orderRow?.id) continue

    const lineItems = order.orderLines || []
    for (const item of lineItems) {
      const sku = item.item?.sku || ""
      const quantity = Number(item.orderLineQuantity?.amount || 1)
      const unitPrice = Number(item.item?.unitPrice?.amount || 0)

      const { error: itemErr } = await supabase.from("order_items").insert({
        order_id: orderRow.id,
        product_id: null,
        sku,
        product_name: item.item?.productName || sku,
        quantity,
        unit_price: unitPrice,
        total_price: unitPrice * quantity,
      })
      if (itemErr) {
        // eslint-disable-next-line no-console
        console.error("Order item insert failed", itemErr)
      }
    }

    upserted += 1
  }

  await supabase.from("channels").update({ last_sync_at: new Date().toISOString() }).eq("id", channelId)

  return { count: upserted }
}

export { createWalmartClientFromCredentials }
