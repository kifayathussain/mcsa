import { NextRequest, NextResponse } from "next/server"
import { createEbayClientFromEnv } from "@/lib/ebay/rest-client"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const client = createEbayClientFromEnv()
    const url = new URL(req.url)
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")

    if (!code) {
      return NextResponse.json({ error: "Missing authorization code" }, { status: 400 })
    }

    const tokens = await client.exchangeCodeForTokens(code)
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const credentials = {
      provider: "ebay",
      token_type: tokens.tokenType,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: Math.floor(Date.now() / 1000) + tokens.expiresInSeconds,
      scope: tokens.scope,
      environment: process.env.EBAY_ENV || "SANDBOX",
    }

    const existing = await supabase
      .from("channels")
      .select("id")
      .eq("user_id", user.id)
      .eq("channel_type", "ebay")
      .limit(1)
      .maybeSingle()

    if (existing.data?.id) {
      await supabase
        .from("channels")
        .update({
          channel_name: "eBay",
          is_connected: true,
          api_credentials: credentials,
          last_sync_at: null,
        })
        .eq("id", existing.data.id)
    } else {
      await supabase.from("channels").insert({
        user_id: user.id,
        channel_type: "ebay",
        channel_name: "eBay",
        is_connected: true,
        api_credentials: credentials,
      })
    }

    return NextResponse.json({ ok: true, state })
  } catch (err: any) {
    console.error("eBay OAuth callback error:", err)
    return NextResponse.json({ error: err?.message || "Token exchange failed" }, { status: 500 })
  }
}


