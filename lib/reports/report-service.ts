import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

export interface ReportTemplate {
  id: string
  name: string
  description: string
  category: string
  config: ReportConfig
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface ReportConfig {
  title: string
  description?: string
  dateRange: {
    type: "preset" | "custom"
    preset?: "7d" | "30d" | "90d" | "1y" | "ytd"
    startDate?: string
    endDate?: string
  }
  metrics: ReportMetric[]
  filters: ReportFilter[]
  visualization: {
    type: "table" | "chart" | "both"
    chartType?: "line" | "bar" | "pie" | "area"
    groupBy?: string
  }
  schedule?: {
    enabled: boolean
    frequency: "daily" | "weekly" | "monthly"
    dayOfWeek?: number
    dayOfMonth?: number
    time: string
    emailRecipients: string[]
  }
}

export interface ReportMetric {
  id: string
  name: string
  type: "revenue" | "orders" | "customers" | "products" | "channels" | "categories"
  aggregation: "sum" | "count" | "average" | "min" | "max"
  field?: string
  label: string
}

export interface ReportFilter {
  id: string
  field: string
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "greater_than" | "less_than" | "between"
  value: any
  label: string
}

export interface GeneratedReport {
  id: string
  templateId: string
  name: string
  generatedAt: string
  data: any
  status: "generating" | "completed" | "failed"
  downloadUrl?: string
  expiresAt?: string
}

export async function getReportTemplates(userId: string): Promise<ReportTemplate[]> {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from("report_templates")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error

  return data?.map(template => ({
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    config: template.config,
    isDefault: template.is_default,
    createdAt: template.created_at,
    updatedAt: template.updated_at
  })) || []
}

export async function createReportTemplate(
  userId: string,
  template: Omit<ReportTemplate, "id" | "createdAt" | "updatedAt">
): Promise<ReportTemplate> {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from("report_templates")
    .insert({
      user_id: userId,
      name: template.name,
      description: template.description,
      category: template.category,
      config: template.config,
      is_default: template.isDefault
    })
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    category: data.category,
    config: data.config,
    isDefault: data.is_default,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}

export async function generateReport(
  userId: string,
  templateId: string,
  customConfig?: Partial<ReportConfig>
): Promise<GeneratedReport> {
  const supabase = await createSupabaseServerClient()
  
  // Get template
  const { data: template, error: templateError } = await supabase
    .from("report_templates")
    .select("*")
    .eq("id", templateId)
    .eq("user_id", userId)
    .single()

  if (templateError || !template) throw new Error("Template not found")

  const config = { ...template.config, ...customConfig }
  
  // Create report record
  const { data: report, error: reportError } = await supabase
    .from("generated_reports")
    .insert({
      user_id: userId,
      template_id: templateId,
      name: config.title,
      status: "generating",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    })
    .select()
    .single()

  if (reportError) throw reportError

  try {
    // Generate report data based on config
    const reportData = await generateReportData(userId, config)
    
    // Update report with data
    await supabase
      .from("generated_reports")
      .update({
        data: reportData,
        status: "completed",
        download_url: `/api/reports/download/${report.id}`
      })
      .eq("id", report.id)

    return {
      id: report.id,
      templateId: templateId,
      name: config.title,
      generatedAt: report.created_at,
      data: reportData,
      status: "completed",
      downloadUrl: `/api/reports/download/${report.id}`,
      expiresAt: report.expires_at
    }
  } catch (error) {
    // Update report with error status
    await supabase
      .from("generated_reports")
      .update({ status: "failed" })
      .eq("id", report.id)
    
    throw error
  }
}

async function generateReportData(userId: string, config: ReportConfig): Promise<any> {
  const supabase = await createSupabaseServerClient()
  
  // Calculate date range
  const now = new Date()
  let startDate: Date, endDate: Date
  
  if (config.dateRange.type === "preset") {
    switch (config.dateRange.preset) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        endDate = now
        break
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        endDate = now
        break
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        endDate = now
        break
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        endDate = now
        break
      case "ytd":
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = now
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        endDate = now
    }
  } else {
    startDate = new Date(config.dateRange.startDate!)
    endDate = new Date(config.dateRange.endDate!)
  }

  // Build query based on metrics
  const reportData: any = {
    title: config.title,
    description: config.description,
    dateRange: {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    },
    generatedAt: new Date().toISOString(),
    metrics: {}
  }

  // Generate data for each metric
  for (const metric of config.metrics) {
    switch (metric.type) {
      case "revenue":
        const { data: revenueData } = await supabase
          .from("orders")
          .select("total_amount")
          .eq("user_id", userId)
          .gte("order_date", startDate.toISOString())
          .lte("order_date", endDate.toISOString())
        
        reportData.metrics[metric.id] = {
          name: metric.name,
          label: metric.label,
          value: revenueData?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0,
          aggregation: metric.aggregation
        }
        break
        
      case "orders":
        const { data: ordersData, count: ordersCount } = await supabase
          .from("orders")
          .select("id", { count: "exact" })
          .eq("user_id", userId)
          .gte("order_date", startDate.toISOString())
          .lte("order_date", endDate.toISOString())
        
        reportData.metrics[metric.id] = {
          name: metric.name,
          label: metric.label,
          value: ordersCount || 0,
          aggregation: metric.aggregation
        }
        break
        
      case "customers":
        const { data: customersData, count: customersCount } = await supabase
          .from("customers")
          .select("id", { count: "exact" })
          .eq("user_id", userId)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
        
        reportData.metrics[metric.id] = {
          name: metric.name,
          label: metric.label,
          value: customersCount || 0,
          aggregation: metric.aggregation
        }
        break
    }
  }

  return reportData
}

export async function getGeneratedReports(userId: string): Promise<GeneratedReport[]> {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from("generated_reports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) throw error

  return data?.map(report => ({
    id: report.id,
    templateId: report.template_id,
    name: report.name,
    generatedAt: report.created_at,
    data: report.data,
    status: report.status,
    downloadUrl: report.download_url,
    expiresAt: report.expires_at
  })) || []
}
