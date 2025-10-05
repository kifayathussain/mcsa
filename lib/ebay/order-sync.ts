import { EbayRestClient } from "@/lib/ebay/rest-client"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type EbayOrder = any

export async function syncEbayOrdersForChannel(channelId: string, accessToken: string) {
  const supabase = await createSupabaseServerClient()

  const client = new EbayRestClient({
    clientId: process.env.EBAY_CLIENT_ID || "",
    clientSecret: process.env.EBAY_CLIENT_SECRET || "",
    redirectUri: process.env.EBAY_REDIRECT_URI || "",
    environment: (process.env.EBAY_ENV || "SANDBOX") as "PRODUCTION" | "SANDBOX",
  })

  // Fetch recent orders (placeholder; refine filters as needed)
  const result = await client.apiRequest<{ orders?: EbayOrder[] }>(
    { accessToken },
    "GET",
    "/sell/fulfillment/v1/order",
    { query: { limit: 50, filter: "orderfulfillmentstatus:{FULFILLED|NOT_STARTED|IN_PROGRESS}" } },
  )

  const orders = result.orders || []

  let upserted = 0
  for (const order of orders) {
    // Basic mapping (adjust according to actual eBay response schema)
    const externalOrderId = order.orderId || order.legacyOrderId
    const buyer = order.buyer || {}
    const fulfillmentStart = order.creationDate ? new Date(order.creationDate).toISOString() : new Date().toISOString()

    const shippingAddress = order.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo || {}
    const address = {
      street: shippingAddress?.contactAddress?.addressLine1,
      city: shippingAddress?.contactAddress?.city,
      state: shippingAddress?.contactAddress?.stateOrProvince,
      zip: shippingAddress?.contactAddress?.postalCode,
      country: shippingAddress?.contactAddress?.countryCode,
    }

    const totals = order.pricingSummary || {}
    const total = Number(totals.total?.value || 0)
    const tax = Number(totals.totalTax?.value || 0)
    const shipping = Number(totals.deliveryCost?.value || 0)

    const { error: upsertErr } = await supabase.from("orders").upsert(
      {
        user_id: undefined, // RLS: inferred via joining channel in a secure RPC in production
        channel_id: channelId,
        external_order_id: externalOrderId,
        order_number: externalOrderId,
        customer_name: buyer.username || buyer.fullName || "",
        customer_email: buyer.email || null,
        shipping_address: address,
        total_amount: total,
        tax_amount: tax,
        shipping_amount: shipping,
        order_status: "processing",
        order_date: fulfillmentStart,
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

    const lineItems = order.lineItems || []
    for (const li of lineItems) {
      const sku = li.sku || li.legacyItemId || ""
      const quantity = Number(li.quantity || 1)
      const unitPrice = Number(li.lineItemCost?.value || li.netPrice?.value || 0)

      const { error: itemErr } = await supabase.from("order_items").insert({
        order_id: orderRow.id,
        product_id: null,
        sku,
        product_name: li.title || sku,
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


