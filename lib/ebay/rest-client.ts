interface EbayOAuthTokens {
  accessToken: string
  refreshToken?: string
  tokenType: string
  expiresInSeconds: number
  scope?: string
}

interface EbayClientConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  environment?: "PRODUCTION" | "SANDBOX"
  defaultScopes?: string[]
}

const EBAY_AUTH_URL = {
  PRODUCTION: "https://auth.ebay.com/oauth2/authorize",
  SANDBOX: "https://auth.sandbox.ebay.com/oauth2/authorize",
} as const

const EBAY_TOKEN_URL = {
  PRODUCTION: "https://api.ebay.com/identity/v1/oauth2/token",
  SANDBOX: "https://api.sandbox.ebay.com/identity/v1/oauth2/token",
} as const

const EBAY_API_BASE = {
  PRODUCTION: "https://api.ebay.com",
  SANDBOX: "https://api.sandbox.ebay.com",
} as const

export class EbayRestClient {
  private clientId: string
  private clientSecret: string
  private redirectUri: string
  private environment: "PRODUCTION" | "SANDBOX"
  private defaultScopes: string[]

  constructor(config: EbayClientConfig) {
    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
    this.redirectUri = config.redirectUri
    this.environment = config.environment || "SANDBOX"
    this.defaultScopes = config.defaultScopes || [
      // Common scopes – adjust per feature needs
      "https://api.ebay.com/oauth/api_scope",
      "https://api.ebay.com/oauth/api_scope/sell.inventory",
      "https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly",
      "https://api.ebay.com/oauth/api_scope/sell.marketing.readonly",
      "https://api.ebay.com/oauth/api_scope/sell.account.readonly",
      "https://api.ebay.com/oauth/api_scope/sell.marketplace.insights.readonly",
      "https://api.ebay.com/oauth/api_scope/sell.finances.readonly",
      "https://api.ebay.com/oauth/api_scope/sell.item.readonly",
    ]
  }

  getAuthorizeUrl(options?: { state?: string; scopes?: string[] }): string {
    const url = new URL(EBAY_AUTH_URL[this.environment])
    url.searchParams.set("client_id", this.clientId)
    url.searchParams.set("redirect_uri", this.redirectUri)
    url.searchParams.set("response_type", "code")
    url.searchParams.set("scope", (options?.scopes || this.defaultScopes).join(" "))
    if (options?.state) url.searchParams.set("state", options.state)
    return url.toString()
  }

  async exchangeCodeForTokens(code: string): Promise<EbayOAuthTokens> {
    const body = new URLSearchParams()
    body.set("grant_type", "authorization_code")
    body.set("code", code)
    body.set("redirect_uri", this.redirectUri)

    const response = await fetch(EBAY_TOKEN_URL[this.environment], {
      method: "POST",
      headers: this.getTokenHeaders(),
      body: body.toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`eBay token exchange failed: ${response.status} ${errorText}`)
    }

    const data: any = await response.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
      expiresInSeconds: data.expires_in,
      scope: data.scope,
    }
  }

  async refreshAccessToken(refreshToken: string, scopes?: string[]): Promise<EbayOAuthTokens> {
    const body = new URLSearchParams()
    body.set("grant_type", "refresh_token")
    body.set("refresh_token", refreshToken)
    if (scopes && scopes.length > 0) {
      body.set("scope", scopes.join(" "))
    }

    const response = await fetch(EBAY_TOKEN_URL[this.environment], {
      method: "POST",
      headers: this.getTokenHeaders(),
      body: body.toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`eBay token refresh failed: ${response.status} ${errorText}`)
    }

    const data: any = await response.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      tokenType: data.token_type,
      expiresInSeconds: data.expires_in,
      scope: data.scope,
    }
  }

  async apiRequest<T = unknown>(
    tokens: Pick<EbayOAuthTokens, "accessToken">,
    method: string,
    path: string,
    options?: {
      query?: Record<string, string | number | boolean | undefined>
      body?: unknown
      headers?: Record<string, string>
      apiBaseOverride?: string
    },
  ): Promise<T> {
    const base = options?.apiBaseOverride || EBAY_API_BASE[this.environment]
    const url = new URL(path, base)
    if (options?.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined) url.searchParams.set(key, String(value))
      }
    }

    const headers = new Headers({
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.accessToken}`,
    })
    if (options?.headers) {
      for (const [k, v] of Object.entries(options.headers)) headers.set(k, v)
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`eBay API request failed: ${response.status} ${errorText}`)
    }

    // Some eBay endpoints return empty body on 204
    if (response.status === 204) return undefined as unknown as T
    return (await response.json()) as T
  }

  private getTokenHeaders(): HeadersInit {
    const basic = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")
    return {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    }
  }
}

export function createEbayClientFromEnv(): EbayRestClient {
  const environment = (process.env.EBAY_ENV || "SANDBOX") as "PRODUCTION" | "SANDBOX"
  const clientId = process.env.EBAY_CLIENT_ID || ""
  const clientSecret = process.env.EBAY_CLIENT_SECRET || ""
  const redirectUri = process.env.EBAY_REDIRECT_URI || ""

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing eBay env config: EBAY_CLIENT_ID/EBAY_CLIENT_SECRET/EBAY_REDIRECT_URI")
  }

  const scopes = (process.env.EBAY_SCOPE || "")
    .split(" ")
    .map((s) => s.trim())
    .filter(Boolean)

  return new EbayRestClient({
    clientId,
    clientSecret,
    redirectUri,
    environment,
    defaultScopes: scopes.length > 0 ? scopes : undefined,
  })
}


