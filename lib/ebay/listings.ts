import { EbayRestClient } from "@/lib/ebay/rest-client"

export interface UpsertListingInput {
  sku: string
  title?: string
  description?: string
  price?: number
  quantity?: number
}

export async function upsertEbayListing(
  accessToken: string,
  input: UpsertListingInput,
): Promise<{ ok: true }> {
  const client = new EbayRestClient({
    clientId: process.env.EBAY_CLIENT_ID || "",
    clientSecret: process.env.EBAY_CLIENT_SECRET || "",
    redirectUri: process.env.EBAY_REDIRECT_URI || "",
    environment: (process.env.EBAY_ENV || "SANDBOX") as "PRODUCTION" | "SANDBOX",
  })

  // 1) Ensure inventory item exists/updated
  await client.apiRequest(
    { accessToken },
    "PUT",
    `/sell/inventory/v1/inventory_item/${encodeURIComponent(input.sku)}`,
    {
      body: {
        sku: input.sku,
        product: {
          title: input.title,
          description: input.description,
        },
        availability: {
          shipToLocationAvailability: {
            quantity: input.quantity ?? 0,
          },
        },
      },
    },
  )

  // Note: Offer management requires policies and marketplace data; keeping scope minimal here.
  // A production flow would: create or update offer, then publish.

  return { ok: true }
}


