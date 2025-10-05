import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { 
  getReportTemplates, 
  createReportTemplate, 
  generateReport, 
  getGeneratedReports 
} from "@/lib/reports/report-service"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    switch (action) {
      case "templates":
        const templates = await getReportTemplates(user.id)
        return NextResponse.json({ success: true, data: templates })

      case "generated":
        const reports = await getGeneratedReports(user.id)
        return NextResponse.json({ success: true, data: reports })

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Reports API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, templateId, template } = body

    switch (action) {
      case "create-template":
        if (!template) {
          return NextResponse.json({ success: false, error: "Template data required" }, { status: 400 })
        }
        
        const newTemplate = await createReportTemplate(user.id, template)
        return NextResponse.json({ success: true, data: newTemplate })

      case "generate":
        if (!templateId) {
          return NextResponse.json({ success: false, error: "Template ID required" }, { status: 400 })
        }
        
        const report = await generateReport(user.id, templateId)
        return NextResponse.json({ success: true, data: report })

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Reports API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
