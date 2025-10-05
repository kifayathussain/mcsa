import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

export interface ShippingCarrier {
  id: string
  name: string
  code: string
  isActive: boolean
  apiConfig: {
    apiKey?: string
    apiSecret?: string
    accountNumber?: string
    testMode: boolean
  }
  services: ShippingService[]
  createdAt: string
  updatedAt: string
}

export interface ShippingService {
  id: string
  carrierId: string
  name: string
  code: string
  description: string
  isActive: boolean
  estimatedDays: number
  maxWeight: number
  maxDimensions: {
    length: number
    width: number
    height: number
  }
}

export interface ShippingRate {
  carrierId: string
  serviceId: string
  serviceName: string
  rate: number
  currency: string
  estimatedDays: number
  deliveryDate?: string
}

export interface ShippingLabel {
  id: string
  orderId: string
  carrierId: string
  serviceId: string
  trackingNumber: string
  labelUrl: string
  labelData: string
  status: "created" | "printed" | "shipped" | "delivered" | "exception"
  createdAt: string
  shippedAt?: string
  deliveredAt?: string
}

export interface ShippingAddress {
  name: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
  email?: string
}

export interface Package {
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  items: Array<{
    sku: string
    quantity: number
    weight: number
  }>
}

export async function getShippingCarriers(userId: string): Promise<ShippingCarrier[]> {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from("shipping_carriers")
    .select(`
      *,
      shipping_services(*)
    `)
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("name")

  if (error) throw error

  return data?.map(carrier => ({
    id: carrier.id,
    name: carrier.name,
    code: carrier.code,
    isActive: carrier.is_active,
    apiConfig: carrier.api_config,
    services: carrier.shipping_services?.map((service: any) => ({
      id: service.id,
      carrierId: service.carrier_id,
      name: service.name,
      code: service.code,
      description: service.description,
      isActive: service.is_active,
      estimatedDays: service.estimated_days,
      maxWeight: service.max_weight,
      maxDimensions: service.max_dimensions
    })) || [],
    createdAt: carrier.created_at,
    updatedAt: carrier.updated_at
  })) || []
}

export async function calculateShippingRates(
  userId: string,
  fromAddress: ShippingAddress,
  toAddress: ShippingAddress,
  packageData: Package
): Promise<ShippingRate[]> {
  const supabase = await createSupabaseServerClient()
  
  // Get active carriers
  const carriers = await getShippingCarriers(userId)
  const rates: ShippingRate[] = []

  for (const carrier of carriers) {
    try {
      const carrierRates = await calculateCarrierRates(carrier, fromAddress, toAddress, packageData)
      rates.push(...carrierRates)
    } catch (error) {
      console.error(`Error calculating rates for ${carrier.name}:`, error)
    }
  }

  return rates.sort((a, b) => a.rate - b.rate)
}

async function calculateCarrierRates(
  carrier: ShippingCarrier,
  fromAddress: ShippingAddress,
  toAddress: ShippingAddress,
  packageData: Package
): Promise<ShippingRate[]> {
  switch (carrier.code) {
    case "usps":
      return await calculateUSPSRates(carrier, fromAddress, toAddress, packageData)
    case "ups":
      return await calculateUPSRates(carrier, fromAddress, toAddress, packageData)
    case "fedex":
      return await calculateFedExRates(carrier, fromAddress, toAddress, packageData)
    case "dhl":
      return await calculateDHLRates(carrier, fromAddress, toAddress, packageData)
    case "postex":
      return await calculatePostexRates(carrier, fromAddress, toAddress, packageData)
    case "canadapost":
      return await calculateCanadaPostRates(carrier, fromAddress, toAddress, packageData)
    case "royalmail":
      return await calculateRoyalMailRates(carrier, fromAddress, toAddress, packageData)
    default:
      return []
  }
}

async function calculateUSPSRates(
  carrier: ShippingCarrier,
  fromAddress: ShippingAddress,
  toAddress: ShippingAddress,
  packageData: Package
): Promise<ShippingRate[]> {
  // Mock USPS rate calculation
  // In a real implementation, you would call the USPS API
  const rates: ShippingRate[] = []
  
  for (const service of carrier.services) {
    if (service.isActive && packageData.weight <= service.maxWeight) {
      const baseRate = packageData.weight * 0.5 // $0.50 per pound
      const distanceMultiplier = 1.2 // Mock distance calculation
      const rate = baseRate * distanceMultiplier

      rates.push({
        carrierId: carrier.id,
        serviceId: service.id,
        serviceName: service.name,
        rate: Math.round(rate * 100) / 100,
        currency: "USD",
        estimatedDays: service.estimatedDays,
        deliveryDate: new Date(Date.now() + service.estimatedDays * 24 * 60 * 60 * 1000).toISOString()
      })
    }
  }

  return rates
}

async function calculateUPSRates(
  carrier: ShippingCarrier,
  fromAddress: ShippingAddress,
  toAddress: ShippingAddress,
  packageData: Package
): Promise<ShippingRate[]> {
  // Mock UPS rate calculation
  const rates: ShippingRate[] = []
  
  for (const service of carrier.services) {
    if (service.isActive && packageData.weight <= service.maxWeight) {
      const baseRate = packageData.weight * 0.6 // $0.60 per pound
      const distanceMultiplier = 1.3
      const rate = baseRate * distanceMultiplier

      rates.push({
        carrierId: carrier.id,
        serviceId: service.id,
        serviceName: service.name,
        rate: Math.round(rate * 100) / 100,
        currency: "USD",
        estimatedDays: service.estimatedDays,
        deliveryDate: new Date(Date.now() + service.estimatedDays * 24 * 60 * 60 * 1000).toISOString()
      })
    }
  }

  return rates
}

async function calculateFedExRates(
  carrier: ShippingCarrier,
  fromAddress: ShippingAddress,
  toAddress: ShippingAddress,
  packageData: Package
): Promise<ShippingRate[]> {
  // Mock FedEx rate calculation
  const rates: ShippingRate[] = []
  
  for (const service of carrier.services) {
    if (service.isActive && packageData.weight <= service.maxWeight) {
      const baseRate = packageData.weight * 0.7 // $0.70 per pound
      const distanceMultiplier = 1.4
      const rate = baseRate * distanceMultiplier

      rates.push({
        carrierId: carrier.id,
        serviceId: service.id,
        serviceName: service.name,
        rate: Math.round(rate * 100) / 100,
        currency: "USD",
        estimatedDays: service.estimatedDays,
        deliveryDate: new Date(Date.now() + service.estimatedDays * 24 * 60 * 60 * 1000).toISOString()
      })
    }
  }

  return rates
}

async function calculateDHLRates(
  carrier: ShippingCarrier,
  fromAddress: ShippingAddress,
  toAddress: ShippingAddress,
  packageData: Package
): Promise<ShippingRate[]> {
  // Mock DHL rate calculation
  const rates: ShippingRate[] = []
  
  for (const service of carrier.services) {
    if (service.isActive && packageData.weight <= service.maxWeight) {
      const baseRate = packageData.weight * 0.8 // $0.80 per pound
      const distanceMultiplier = 1.5
      const internationalMultiplier = toAddress.country !== fromAddress.country ? 1.8 : 1.0
      const rate = baseRate * distanceMultiplier * internationalMultiplier

      rates.push({
        carrierId: carrier.id,
        serviceId: service.id,
        serviceName: service.name,
        rate: Math.round(rate * 100) / 100,
        currency: "USD",
        estimatedDays: service.estimatedDays,
        deliveryDate: new Date(Date.now() + service.estimatedDays * 24 * 60 * 60 * 1000).toISOString()
      })
    }
  }

  return rates
}

async function calculatePostexRates(
  carrier: ShippingCarrier,
  fromAddress: ShippingAddress,
  toAddress: ShippingAddress,
  packageData: Package
): Promise<ShippingRate[]> {
  // Mock Postex rate calculation
  const rates: ShippingRate[] = []
  
  for (const service of carrier.services) {
    if (service.isActive && packageData.weight <= service.maxWeight) {
      const baseRate = packageData.weight * 0.4 // $0.40 per pound
      const distanceMultiplier = 1.1
      const rate = baseRate * distanceMultiplier

      rates.push({
        carrierId: carrier.id,
        serviceId: service.id,
        serviceName: service.name,
        rate: Math.round(rate * 100) / 100,
        currency: "USD",
        estimatedDays: service.estimatedDays,
        deliveryDate: new Date(Date.now() + service.estimatedDays * 24 * 60 * 60 * 1000).toISOString()
      })
    }
  }

  return rates
}

async function calculateCanadaPostRates(
  carrier: ShippingCarrier,
  fromAddress: ShippingAddress,
  toAddress: ShippingAddress,
  packageData: Package
): Promise<ShippingRate[]> {
  // Mock Canada Post rate calculation
  const rates: ShippingRate[] = []
  
  for (const service of carrier.services) {
    if (service.isActive && packageData.weight <= service.maxWeight) {
      const baseRate = packageData.weight * 0.45 // $0.45 per pound
      const distanceMultiplier = 1.2
      const rate = baseRate * distanceMultiplier

      rates.push({
        carrierId: carrier.id,
        serviceId: service.id,
        serviceName: service.name,
        rate: Math.round(rate * 100) / 100,
        currency: "CAD",
        estimatedDays: service.estimatedDays,
        deliveryDate: new Date(Date.now() + service.estimatedDays * 24 * 60 * 60 * 1000).toISOString()
      })
    }
  }

  return rates
}

async function calculateRoyalMailRates(
  carrier: ShippingCarrier,
  fromAddress: ShippingAddress,
  toAddress: ShippingAddress,
  packageData: Package
): Promise<ShippingRate[]> {
  // Mock Royal Mail rate calculation
  const rates: ShippingRate[] = []
  
  for (const service of carrier.services) {
    if (service.isActive && packageData.weight <= service.maxWeight) {
      const baseRate = packageData.weight * 0.35 // £0.35 per pound
      const distanceMultiplier = 1.1
      const rate = baseRate * distanceMultiplier

      rates.push({
        carrierId: carrier.id,
        serviceId: service.id,
        serviceName: service.name,
        rate: Math.round(rate * 100) / 100,
        currency: "GBP",
        estimatedDays: service.estimatedDays,
        deliveryDate: new Date(Date.now() + service.estimatedDays * 24 * 60 * 60 * 1000).toISOString()
      })
    }
  }

  return rates
}

export async function createShippingLabel(
  userId: string,
  orderId: string,
  carrierId: string,
  serviceId: string,
  fromAddress: ShippingAddress,
  toAddress: ShippingAddress,
  packageData: Package
): Promise<ShippingLabel> {
  const supabase = await createSupabaseServerClient()
  
  // Generate tracking number (mock)
  const trackingNumber = generateTrackingNumber()
  
  // Create label (mock - in real implementation, call carrier API)
  const labelData = await generateLabelData(carrierId, serviceId, fromAddress, toAddress, packageData, trackingNumber)
  
  const { data, error } = await supabase
    .from("shipping_labels")
    .insert({
      user_id: userId,
      order_id: orderId,
      carrier_id: carrierId,
      service_id: serviceId,
      tracking_number: trackingNumber,
      label_url: `/api/shipping/labels/${trackingNumber}`,
      label_data: labelData,
      status: "created"
    })
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    orderId: data.order_id,
    carrierId: data.carrier_id,
    serviceId: data.service_id,
    trackingNumber: data.tracking_number,
    labelUrl: data.label_url,
    labelData: data.label_data,
    status: data.status,
    createdAt: data.created_at,
    shippedAt: data.shipped_at,
    deliveredAt: data.delivered_at
  }
}

function generateTrackingNumber(): string {
  // Generate a mock tracking number
  const prefix = "1Z"
  const random = Math.random().toString(36).substring(2, 18).toUpperCase()
  return `${prefix}${random}`
}

async function generateLabelData(
  carrierId: string,
  serviceId: string,
  fromAddress: ShippingAddress,
  toAddress: ShippingAddress,
  packageData: Package,
  trackingNumber: string
): Promise<string> {
  // Mock label data generation
  // In a real implementation, this would call the carrier's label API
  return JSON.stringify({
    carrierId,
    serviceId,
    trackingNumber,
    fromAddress,
    toAddress,
    package: packageData,
    generatedAt: new Date().toISOString()
  })
}

export async function getShippingLabels(userId: string, orderId?: string): Promise<ShippingLabel[]> {
  const supabase = await createSupabaseServerClient()
  
  let query = supabase
    .from("shipping_labels")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (orderId) {
    query = query.eq("order_id", orderId)
  }

  const { data, error } = await query

  if (error) throw error

  return data?.map(label => ({
    id: label.id,
    orderId: label.order_id,
    carrierId: label.carrier_id,
    serviceId: label.service_id,
    trackingNumber: label.tracking_number,
    labelUrl: label.label_url,
    labelData: label.label_data,
    status: label.status,
    createdAt: label.created_at,
    shippedAt: label.shipped_at,
    deliveredAt: label.delivered_at
  })) || []
}

export async function updateShippingLabelStatus(
  userId: string,
  labelId: string,
  status: ShippingLabel["status"],
  trackingData?: any
): Promise<void> {
  const supabase = await createSupabaseServerClient()
  
  const updateData: any = { status }
  
  if (status === "shipped") {
    updateData.shipped_at = new Date().toISOString()
  } else if (status === "delivered") {
    updateData.delivered_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from("shipping_labels")
    .update(updateData)
    .eq("id", labelId)
    .eq("user_id", userId)

  if (error) throw error
}
