import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { upsertEbayListing } from "@/lib/ebay/listings"

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const channelId = searchParams.get("channelId")
  if (!channelId) return NextResponse.json({ error: "Missing channelId" }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const sku = body?.sku
  if (!sku) return NextResponse.json({ error: "Missing sku" }, { status: 400 })

  const { data: channel, error } = await supabase
    .from("channels")
    .select("id, api_credentials")
    .eq("id", channelId)
    .eq("user_id", user.id)
    .eq("channel_type", "ebay")
    .maybeSingle()

  if (error || !channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 })

  const creds = channel.api_credentials as any
  try {
    await upsertEbayListing(creds.access_token, body)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Listing update failed" }, { status: 500 })
  }
}


