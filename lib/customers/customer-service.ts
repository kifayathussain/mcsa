import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

export interface Customer {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  lastOrderDate?: string
  firstOrderDate?: string
  customerLifetimeValue: number
  tags: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CustomerOrder {
  id: string
  orderNumber: string
  orderDate: string
  totalAmount: number
  orderStatus: string
  channel: string
  items: Array<{
    sku: string
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
}

export interface CustomerSegment {
  id: string
  name: string
  description: string
  criteria: {
    minOrders?: number
    minSpent?: number
    maxDaysSinceLastOrder?: number
    tags?: string[]
  }
  customerCount: number
}

export async function getCustomers(
  userId: string,
  options?: {
    search?: string
    segment?: string
    tags?: string[]
    limit?: number
    offset?: number
  }
): Promise<{ customers: Customer[]; total: number }> {
  const supabase = await createSupabaseServerClient()
  
  let query = supabase
    .from("customers")
    .select(`
      *,
      orders!inner(
        id,
        total_amount,
        order_date,
        order_status,
        channels!inner(channel_type)
      )
    `)
    .eq("user_id", userId)

  if (options?.search) {
    query = query.or(`email.ilike.%${options.search}%,first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%`)
  }

  if (options?.tags && options.tags.length > 0) {
    query = query.contains("tags", options.tags)
  }

  const { data, error, count } = await query
    .range(options?.offset || 0, (options?.offset || 0) + (options?.limit || 50) - 1)
    .order("created_at", { ascending: false })

  if (error) throw error

  const customers = data?.map(customer => {
    const orders = customer.orders || []
    const totalOrders = orders.length
    const totalSpent = orders.reduce((sum: number, order: any) => sum + Number(order.total_amount || 0), 0)
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
    const orderDates = orders.map((order: any) => new Date(order.order_date)).sort()
    const lastOrderDate = orderDates.length > 0 ? orderDates[orderDates.length - 1].toISOString() : undefined
    const firstOrderDate = orderDates.length > 0 ? orderDates[0].toISOString() : undefined

    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone,
      totalOrders,
      totalSpent,
      averageOrderValue,
      lastOrderDate,
      firstOrderDate,
      customerLifetimeValue: totalSpent, // Simplified CLV calculation
      tags: customer.tags || [],
      notes: customer.notes,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at
    }
  }) || []

  return { customers, total: count || 0 }
}

export async function getCustomerDetails(userId: string, customerId: string): Promise<Customer | null> {
  const supabase = await createSupabaseServerClient()
  
  const { data: customer, error } = await supabase
    .from("customers")
    .select(`
      *,
      orders!inner(
        id,
        total_amount,
        order_date,
        order_status,
        channels!inner(channel_type)
      )
    `)
    .eq("id", customerId)
    .eq("user_id", userId)
    .single()

  if (error || !customer) return null

  const orders = customer.orders || []
  const totalOrders = orders.length
  const totalSpent = orders.reduce((sum: number, order: any) => sum + Number(order.total_amount || 0), 0)
  const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
  const orderDates = orders.map((order: any) => new Date(order.order_date)).sort()
  const lastOrderDate = orderDates.length > 0 ? orderDates[orderDates.length - 1].toISOString() : undefined
  const firstOrderDate = orderDates.length > 0 ? orderDates[0].toISOString() : undefined

  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.first_name,
    lastName: customer.last_name,
    phone: customer.phone,
    totalOrders,
    totalSpent,
    averageOrderValue,
    lastOrderDate,
    firstOrderDate,
    customerLifetimeValue: totalSpent,
    tags: customer.tags || [],
    notes: customer.notes,
    createdAt: customer.created_at,
    updatedAt: customer.updated_at
  }
}

export async function getCustomerOrders(
  userId: string,
  customerId: string,
  limit = 20
): Promise<CustomerOrder[]> {
  const supabase = await createSupabaseServerClient()
  
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      external_order_id,
      order_number,
      order_date,
      total_amount,
      order_status,
      channels!inner(channel_type),
      order_items!inner(
        sku,
        product_name,
        quantity,
        unit_price,
        total_price
      )
    `)
    .eq("user_id", userId)
    .eq("customer_email", (await supabase.from("customers").select("email").eq("id", customerId).single()).data?.email)
    .order("order_date", { ascending: false })
    .limit(limit)

  if (error) throw error

  return orders?.map(order => ({
    id: order.id,
    orderNumber: order.order_number || order.external_order_id,
    orderDate: order.order_date,
    totalAmount: Number(order.total_amount || 0),
    orderStatus: order.order_status,
    channel: order.channels?.[0]?.channel_type || "unknown",
    items: order.order_items?.map((item: any) => ({
      sku: item.sku,
      productName: item.product_name,
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unit_price || 0),
      totalPrice: Number(item.total_price || 0)
    })) || []
  })) || []
}

export async function updateCustomer(
  userId: string,
  customerId: string,
  updates: {
    firstName?: string
    lastName?: string
    phone?: string
    tags?: string[]
    notes?: string
  }
): Promise<void> {
  const supabase = await createSupabaseServerClient()
  
  const { error } = await supabase
    .from("customers")
    .update({
      first_name: updates.firstName,
      last_name: updates.lastName,
      phone: updates.phone,
      tags: updates.tags,
      notes: updates.notes,
      updated_at: new Date().toISOString()
    })
    .eq("id", customerId)
    .eq("user_id", userId)

  if (error) throw error
}

export async function createCustomerSegment(
  userId: string,
  segment: Omit<CustomerSegment, "id" | "customerCount">
): Promise<CustomerSegment> {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from("customer_segments")
    .insert({
      user_id: userId,
      name: segment.name,
      description: segment.description,
      criteria: segment.criteria
    })
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    criteria: data.criteria,
    customerCount: 0 // Will be calculated separately
  }
}
