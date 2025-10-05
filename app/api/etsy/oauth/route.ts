import { NextRequest, NextResponse } from "next/server"
import { createEtsyClientFromEnv } from "@/lib/etsy/rest-client"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const client = createEtsyClientFromEnv()
    const { searchParams } = new URL(req.url)
    const state = searchParams.get("state") || undefined
    const authorizeUrl = client.getAuthorizeUrl({ state })
    return NextResponse.redirect(authorizeUrl)
  } catch (error) {
    console.error("Etsy OAuth error:", error)
    return NextResponse.json(
      { success: false, error: "Etsy OAuth configuration missing" },
      { status: 500 }
    )
  }
}
