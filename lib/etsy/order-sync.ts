import { EtsyRestClient } from "@/lib/etsy/rest-client"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type EtsyReceipt = any

export async function syncEtsyOrdersForChannel(channelId: string, accessToken: string) {
  const supabase = await createSupabaseServerClient()

  const client = new EtsyRestClient({
    clientId: process.env.ETSY_CLIENT_ID || "",
    clientSecret: process.env.ETSY_CLIENT_SECRET || "",
    redirectUri: process.env.ETSY_REDIRECT_URI || "",
    environment: (process.env.ETSY_ENV || "SANDBOX") as "PRODUCTION" | "SANDBOX",
  })

  // Fetch recent receipts (orders)
  const result = await client.apiRequest<{ results?: EtsyReceipt[] }>(
    { accessToken },
    "GET",
    "/application/shops/active/receipts",
    { query: { limit: 50, was_paid: true } },
  )

  const receipts = result.results || []

  let upserted = 0
  for (const receipt of receipts) {
    const externalOrderId = receipt.receipt_id?.toString() || ""
    const buyer = receipt.buyer_user || {}
    const orderDate = receipt.creation_tsz ? new Date(receipt.creation_tsz * 1000).toISOString() : new Date().toISOString()

    const shippingAddress = receipt.shipping_address || {}
    const address = {
      street: shippingAddress.first_line,
      city: shippingAddress.city,
      state: shippingAddress.state,
      zip: shippingAddress.zip,
      country: shippingAddress.country_code,
    }

    const total = Number(receipt.total_price || 0)
    const tax = Number(receipt.total_tax_cost || 0)
    const shipping = Number(receipt.total_shipping_cost || 0)

    const { error: upsertErr } = await supabase.from("orders").upsert(
      {
        user_id: undefined, // RLS: inferred via joining channel in a secure RPC in production
        channel_id: channelId,
        external_order_id: externalOrderId,
        order_number: externalOrderId,
        customer_name: buyer.login_name || buyer.first_name || "",
        customer_email: buyer.email || null,
        shipping_address: address,
        total_amount: total,
        tax_amount: tax,
        shipping_amount: shipping,
        order_status: receipt.is_shipped ? "shipped" : "processing",
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

    const transactions = receipt.transactions || []
    for (const transaction of transactions) {
      const sku = transaction.listing_id?.toString() || ""
      const quantity = Number(transaction.quantity || 1)
      const unitPrice = Number(transaction.price || 0)

      const { error: itemErr } = await supabase.from("order_items").insert({
        order_id: orderRow.id,
        product_id: null,
        sku,
        product_name: transaction.title || sku,
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
