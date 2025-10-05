import { NextRequest, NextResponse } from "next/server"
import { createEtsyClientFromEnv } from "@/lib/etsy/rest-client"

export async function GET(req: NextRequest) {
  const client = createEtsyClientFromEnv()
  const { searchParams } = new URL(req.url)
  const state = searchParams.get("state") || undefined
  const authorizeUrl = client.getAuthorizeUrl({ state })
  return NextResponse.redirect(authorizeUrl)
}
