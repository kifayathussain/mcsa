interface EtsyOAuthTokens {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresInSeconds: number
  scope?: string
}

interface EtsyClientConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  environment?: "PRODUCTION" | "SANDBOX"
  defaultScopes?: string[]
}

const ETSY_AUTH_URL = {
  PRODUCTION: "https://www.etsy.com/oauth/connect",
  SANDBOX: "https://openapi.etsy.com/v3/public/oauth/connect",
} as const

const ETSY_TOKEN_URL = {
  PRODUCTION: "https://api.etsy.com/v3/public/oauth/token",
  SANDBOX: "https://openapi.etsy.com/v3/public/oauth/token",
} as const

const ETSY_API_BASE = {
  PRODUCTION: "https://openapi.etsy.com/v3",
  SANDBOX: "https://openapi.etsy.com/v3",
} as const

export class EtsyRestClient {
  private clientId: string
  private clientSecret: string
  private redirectUri: string
  private environment: "PRODUCTION" | "SANDBOX"
  private defaultScopes: string[]

  constructor(config: EtsyClientConfig) {
    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
    this.redirectUri = config.redirectUri
    this.environment = config.environment || "SANDBOX"
    this.defaultScopes = config.defaultScopes || [
      "listings_r",
      "listings_w",
      "shops_r",
      "shops_w",
      "transactions_r",
      "transactions_w",
      "profile_r",
      "profile_w",
    ]
  }

  getAuthorizeUrl(options?: { state?: string; scopes?: string[] }): string {
    const url = new URL(ETSY_AUTH_URL[this.environment])
    url.searchParams.set("response_type", "code")
    url.searchParams.set("client_id", this.clientId)
    url.searchParams.set("redirect_uri", this.redirectUri)
    url.searchParams.set("scope", (options?.scopes || this.defaultScopes).join(" "))
    if (options?.state) url.searchParams.set("state", options.state)
    return url.toString()
  }

  async exchangeCodeForTokens(code: string): Promise<EtsyOAuthTokens> {
    const body = new URLSearchParams()
    body.set("grant_type", "authorization_code")
    body.set("client_id", this.clientId)
    body.set("client_secret", this.clientSecret)
    body.set("redirect_uri", this.redirectUri)
    body.set("code", code)

    const response = await fetch(ETSY_TOKEN_URL[this.environment], {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Etsy token exchange failed: ${response.status} ${errorText}`)
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

  async refreshAccessToken(refreshToken: string, scopes?: string[]): Promise<EtsyOAuthTokens> {
    const body = new URLSearchParams()
    body.set("grant_type", "refresh_token")
    body.set("client_id", this.clientId)
    body.set("client_secret", this.clientSecret)
    body.set("refresh_token", refreshToken)
    if (scopes && scopes.length > 0) {
      body.set("scope", scopes.join(" "))
    }

    const response = await fetch(ETSY_TOKEN_URL[this.environment], {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Etsy token refresh failed: ${response.status} ${errorText}`)
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
    tokens: Pick<EtsyOAuthTokens, "accessToken">,
    method: string,
    path: string,
    options?: {
      query?: Record<string, string | number | boolean | undefined>
      body?: unknown
      headers?: Record<string, string>
      apiBaseOverride?: string
    },
  ): Promise<T> {
    const base = options?.apiBaseOverride || ETSY_API_BASE[this.environment]
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
      throw new Error(`Etsy API request failed: ${response.status} ${errorText}`)
    }

    // Some Etsy endpoints return empty body on 204
    if (response.status === 204) return undefined as unknown as T
    return (await response.json()) as T
  }
}

export function createEtsyClientFromEnv(): EtsyRestClient {
  const environment = (process.env.ETSY_ENV || "SANDBOX") as "PRODUCTION" | "SANDBOX"
  const clientId = process.env.ETSY_CLIENT_ID || ""
  const clientSecret = process.env.ETSY_CLIENT_SECRET || ""
  const redirectUri = process.env.ETSY_REDIRECT_URI || ""

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Etsy env config: ETSY_CLIENT_ID/ETSY_CLIENT_SECRET/ETSY_REDIRECT_URI")
  }

  const scopes = (process.env.ETSY_SCOPE || "")
    .split(" ")
    .map((s) => s.trim())
    .filter(Boolean)

  return new EtsyRestClient({
    clientId,
    clientSecret,
    redirectUri,
    environment,
    defaultScopes: scopes.length > 0 ? scopes : undefined,
  })
}
