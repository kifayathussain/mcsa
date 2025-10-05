import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8">
      <AnalyticsDashboard />
    </div>
  )
}
