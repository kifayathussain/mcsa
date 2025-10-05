"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReportBuilder } from "@/components/reports/report-builder"
import { DataVisualization } from "@/components/analytics/data-visualization"
import { FileText, BarChart3 } from "lucide-react"

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("reports")

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Create custom reports and visualize your data
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Custom Reports</span>
          </TabsTrigger>
          <TabsTrigger value="visualization" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Data Visualization</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <ReportBuilder />
        </TabsContent>

        <TabsContent value="visualization" className="space-y-4">
          <DataVisualization />
        </TabsContent>
      </Tabs>
    </div>
  )
}
