interface AmazonCredentials {
  clientId: string
  clientSecret: string
  refreshToken: string
  region: string
  marketplaceId: string
}

interface SPAPIConfig {
  credentials: AmazonCredentials
  endpoint: string
}

export class AmazonSPAPIClient {
  private credentials: AmazonCredentials
  private endpoint: string
  private accessToken: string | null = null
  private tokenExpiry = 0

  constructor(config: SPAPIConfig) {
    this.credentials = config.credentials
    this.endpoint = config.endpoint
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    // Request new access token
    const tokenUrl = "https://api.amazon.com/auth/o2/token"
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: this.credentials.refreshToken,
      client_id: this.credentials.clientId,
      client_secret: this.credentials.clientSecret,
    })

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    })

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`)
    }

    const data = await response.json()
    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000 // Refresh 1 min before expiry

    if (!this.accessToken) {
      throw new Error("Failed to get access token from response")
    }

    return this.accessToken
  }

  private async signRequest(
    method: string,
    path: string,
    queryParams: Record<string, string> = {},
    body?: string,
  ): Promise<Headers> {
    const accessToken = await this.getAccessToken()
    const headers = new Headers({
      "x-amz-access-token": accessToken,
      "Content-Type": "application/json",
      host: new URL(this.endpoint).host,
    })

    return headers
  }

  async makeRequest(method: string, path: string, queryParams: Record<string, string> = {}, body?: any) {
    const headers = await this.signRequest(method, path, queryParams, body ? JSON.stringify(body) : undefined)

    const url = new URL(path, this.endpoint)
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Amazon SP-API request failed: ${response.status} ${errorText}`)
    }

    return response.json()
  }

  // Orders API
  async getOrders(params: {
    marketplaceIds: string[]
    createdAfter?: string
    createdBefore?: string
    orderStatuses?: string[]
  }) {
    const queryParams: Record<string, string> = {
      MarketplaceIds: params.marketplaceIds.join(","),
    }

    if (params.createdAfter) queryParams.CreatedAfter = params.createdAfter
    if (params.createdBefore) queryParams.CreatedBefore = params.createdBefore
    if (params.orderStatuses) queryParams.OrderStatuses = params.orderStatuses.join(",")

    return this.makeRequest("GET", "/orders/v0/orders", queryParams)
  }

  async getOrder(orderId: string) {
    return this.makeRequest("GET", `/orders/v0/orders/${orderId}`)
  }

  async getOrderItems(orderId: string) {
    return this.makeRequest("GET", `/orders/v0/orders/${orderId}/orderItems`)
  }

  // Catalog API
  async searchCatalogItems(params: { keywords?: string; marketplaceIds: string[]; identifiers?: string[] }) {
    const queryParams: Record<string, string> = {
      marketplaceIds: params.marketplaceIds.join(","),
    }

    if (params.keywords) queryParams.keywords = params.keywords
    if (params.identifiers) queryParams.identifiers = params.identifiers.join(",")

    return this.makeRequest("GET", "/catalog/2022-04-01/items", queryParams)
  }

  // Inventory API
  async getInventorySummaries(params: { marketplaceIds: string[]; sellerSkus?: string[] }) {
    const queryParams: Record<string, string> = {
      marketplaceIds: params.marketplaceIds.join(","),
      granularityType: "Marketplace",
    }

    if (params.sellerSkus) queryParams.sellerSkus = params.sellerSkus.join(",")

    return this.makeRequest("GET", "/fba/inventory/v1/summaries", queryParams)
  }

  // Listings API
  async getListingsItem(sellerId: string, sku: string, marketplaceIds: string[]) {
    const queryParams: Record<string, string> = {
      marketplaceIds: marketplaceIds.join(","),
    }

    return this.makeRequest("GET", `/listings/2021-08-01/items/${sellerId}/${sku}`, queryParams)
  }

  async putListingsItem(sellerId: string, sku: string, marketplaceIds: string[], productData: any) {
    const queryParams: Record<string, string> = {
      marketplaceIds: marketplaceIds.join(","),
    }

    return this.makeRequest("PUT", `/listings/2021-08-01/items/${sellerId}/${sku}`, queryParams, productData)
  }

  async deleteListingsItem(sellerId: string, sku: string, marketplaceIds: string[]) {
    const queryParams: Record<string, string> = {
      marketplaceIds: marketplaceIds.join(","),
    }

    return this.makeRequest("DELETE", `/listings/2021-08-01/items/${sellerId}/${sku}`, queryParams)
  }
}

// Helper function to create SP-API client from channel credentials
export function createAmazonClient(credentials: any): AmazonSPAPIClient {
  const region = credentials.region || "us-east-1"
  const endpoints: Record<string, string> = {
    "us-east-1": "https://sellingpartnerapi-na.amazon.com",
    "eu-west-1": "https://sellingpartnerapi-eu.amazon.com",
    "us-west-2": "https://sellingpartnerapi-fe.amazon.com",
  }

  return new AmazonSPAPIClient({
    credentials: {
      clientId: credentials.client_id,
      clientSecret: credentials.client_secret,
      refreshToken: credentials.refresh_token,
      region: credentials.region,
      marketplaceId: credentials.marketplace_id,
    },
    endpoint: endpoints[region] || endpoints["us-east-1"],
  })
}
