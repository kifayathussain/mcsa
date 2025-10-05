import { NextRequest, NextResponse } from "next/server"
import { createEbayClientFromEnv } from "@/lib/ebay/rest-client"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const client = createEbayClientFromEnv()
    const { searchParams } = new URL(req.url)
    const state = searchParams.get("state") || undefined
    const authorizeUrl = client.getAuthorizeUrl({ state })
    return NextResponse.redirect(authorizeUrl)
  } catch (error) {
    console.error("eBay OAuth error:", error)
    return NextResponse.json(
      { success: false, error: "eBay OAuth configuration missing" },
      { status: 500 }
    )
  }
}


