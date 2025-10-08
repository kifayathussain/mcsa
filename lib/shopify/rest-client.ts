interface ShopifyOAuthTokens {
  accessToken: string
  scope: string
  expiresAt?: number
}

interface ShopifyClientConfig {
  shopDomain: string
  accessToken: string
  apiVersion?: string
}

const SHOPIFY_API_BASE = "https://{shop}.myshopify.com/admin/api/{version}"

export class ShopifyRestClient {
  private shopDomain: string
  private accessToken: string
  private apiVersion: string

  constructor(config: ShopifyClientConfig) {
    this.shopDomain = config.shopDomain
    this.accessToken = config.accessToken
    this.apiVersion = config.apiVersion || "2024-01"
  }

  private getApiUrl(path: string): string {
    const url = SHOPIFY_API_BASE
      .replace("{shop}", this.shopDomain)
      .replace("{version}", this.apiVersion) + path
    
    console.log("Constructed Shopify API URL:", url)
    return url
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
    const url = new URL(this.getApiUrl(path))
    if (options?.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined) url.searchParams.set(key, String(value))
      }
    }

    const headers = new Headers({
      "X-Shopify-Access-Token": this.accessToken,
      "Content-Type": "application/json",
    })
    if (options?.headers) {
      for (const [k, v] of Object.entries(options.headers)) headers.set(k, v)
    }

    console.log(`Making ${method} request to:`, url.toString())
    console.log("Headers:", Object.fromEntries(headers.entries()))

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body: options?.body ? JSON.stringify(options.body) : undefined,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Shopify API request failed: ${response.status} ${response.statusText}`)
        console.error("Error response:", errorText)
        throw new Error(`Shopify API request failed: ${response.status} ${errorText}`)
      }

      return (await response.json()) as T
    } catch (error) {
      console.error("Fetch error details:", {
        url: url.toString(),
        method,
        error: error.message,
        cause: error.cause
      })
      throw error
    }
  }

  // Orders API
  async getOrders(params?: { limit?: number; status?: string; created_at_min?: string }) {
    return this.apiRequest<{ orders: any[] }>("GET", "/orders.json", { query: params })
  }

  async getOrder(orderId: string) {
    return this.apiRequest<{ order: any }>("GET", `/orders/${orderId}.json`)
  }

  // Products API
  async getProducts(params?: { limit?: number; status?: string }) {
    return this.apiRequest<{ products: any[] }>("GET", "/products.json", { query: params })
  }

  async getProduct(productId: string) {
    return this.apiRequest<{ product: any }>("GET", `/products/${productId}.json`)
  }

  // Inventory API
  async getInventoryLevels(params?: { inventory_item_ids?: string[]; location_ids?: string[] }) {
    // Convert arrays to comma-separated strings for Shopify API
    const queryParams: Record<string, string | number | boolean | undefined> = {}
    if (params) {
      if (params.inventory_item_ids) {
        queryParams.inventory_item_ids = params.inventory_item_ids.join(',')
      }
      if (params.location_ids) {
        queryParams.location_ids = params.location_ids.join(',')
      }
    }
    return this.apiRequest<{ inventory_levels: any[] }>("GET", "/inventory_levels.json", { query: queryParams })
  }

  async updateInventoryLevel(inventoryItemId: string, locationId: string, quantity: number) {
    return this.apiRequest("POST", "/inventory_levels/set.json", {
      body: {
        location_id: locationId,
        inventory_item_id: inventoryItemId,
        available: quantity,
      },
    })
  }
}

export function createShopifyClientFromCredentials(credentials: any): ShopifyRestClient {
  if (!credentials) {
    throw new Error("Credentials object is required")
  }
  
  const shopDomain = credentials.shop_url || credentials.shopDomain
  const accessToken = credentials.access_token || credentials.accessToken
  
  if (!shopDomain) {
    throw new Error("Shop domain (shop_url) is required")
  }
  
  if (!accessToken) {
    throw new Error("Access token is required")
  }
  
  // Clean shop domain - handle various formats
  let cleanShopDomain = shopDomain
  
  // Remove protocol if present
  cleanShopDomain = cleanShopDomain.replace(/^https?:\/\//, '')
  
  // Remove .myshopify.com if present
  cleanShopDomain = cleanShopDomain.replace('.myshopify.com', '')
  
  // Remove trailing slash
  cleanShopDomain = cleanShopDomain.replace(/\/$/, '')
  
  console.log("Original shop domain:", shopDomain)
  console.log("Cleaned shop domain:", cleanShopDomain)
  
  return new ShopifyRestClient({
    shopDomain: cleanShopDomain,
    accessToken,
    apiVersion: credentials.api_version || credentials.apiVersion || "2024-01",
  })
}
