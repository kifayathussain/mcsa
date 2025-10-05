interface WalmartCredentials {
  clientId: string
  clientSecret: string
  accessToken?: string
  environment?: "PRODUCTION" | "SANDBOX"
}

interface WalmartClientConfig {
  credentials: WalmartCredentials
}

const WALMART_API_BASE = {
  PRODUCTION: "https://marketplace.walmartapis.com/v3",
  SANDBOX: "https://sandbox.walmartapis.com/v3",
} as const

export class WalmartRestClient {
  private credentials: WalmartCredentials
  private apiBase: string

  constructor(config: WalmartClientConfig) {
    this.credentials = config.credentials
    this.apiBase = WALMART_API_BASE[this.credentials.environment || "SANDBOX"]
  }

  private async getAccessToken(): Promise<string> {
    if (this.credentials.accessToken) {
      return this.credentials.accessToken
    }

    // Client credentials flow for Walmart
    const body = new URLSearchParams()
    body.set("grant_type", "client_credentials")
    body.set("client_id", this.credentials.clientId)
    body.set("client_secret", this.credentials.clientSecret)

    const response = await fetch(`${this.apiBase}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Walmart token request failed: ${response.status} ${errorText}`)
    }

    const data: any = await response.json()
    return data.access_token
  }

  async apiRequest<T = unknown>(
    method: string,
    path: string,
    options?: {
      query?: Record<string, string | number | boolean | undefined>
      body?: unknown
      headers?: Record<string, string>
    },
  ): Promise<T> {
    const accessToken = await this.getAccessToken()
    const url = new URL(path, this.apiBase)
    
    if (options?.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined) url.searchParams.set(key, String(value))
      }
    }

    const headers = new Headers({
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "WM_QOS.CORRELATION_ID": Math.random().toString(36).substring(7),
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
      throw new Error(`Walmart API request failed: ${response.status} ${errorText}`)
    }

    return (await response.json()) as T
  }

  // Orders API
  async getOrders(params?: { limit?: number; createdStartDate?: string; createdEndDate?: string }) {
    return this.apiRequest<{ elements: any[] }>("GET", "/orders", { query: params })
  }

  async getOrder(orderId: string) {
    return this.apiRequest<{ order: any }>("GET", `/orders/${orderId}`)
  }

  // Inventory API
  async getInventory(params?: { limit?: number; sku?: string }) {
    return this.apiRequest<{ elements: any[] }>("GET", "/feeds", { query: params })
  }

  async updateInventory(sku: string, quantity: number) {
    return this.apiRequest("PUT", "/feeds", {
      body: {
        feedType: "inventory",
        items: [
          {
            sku,
            quantity: {
              unit: "EACH",
              amount: quantity,
            },
          },
        ],
      },
    })
  }
}

export function createWalmartClientFromCredentials(credentials: any): WalmartRestClient {
  return new WalmartRestClient({
    credentials: {
      clientId: credentials.client_id || credentials.clientId,
      clientSecret: credentials.client_secret || credentials.clientSecret,
      accessToken: credentials.access_token || credentials.accessToken,
      environment: (credentials.environment || "SANDBOX") as "PRODUCTION" | "SANDBOX",
    },
  })
}
