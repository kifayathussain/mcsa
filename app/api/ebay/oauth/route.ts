import { NextRequest, NextResponse } from "next/server"
import { createEbayClientFromEnv } from "@/lib/ebay/rest-client"

export async function GET(req: NextRequest) {
  const client = createEbayClientFromEnv()
  const { searchParams } = new URL(req.url)
  const state = searchParams.get("state") || undefined
  const authorizeUrl = client.getAuthorizeUrl({ state })
  return NextResponse.redirect(authorizeUrl)
}


