"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Download, Clock, FileText, BarChart3, PieChart, TrendingUp, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ReportTemplate {
  id: string
  name: string
  description: string
  category: string
  config: any
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

interface GeneratedReport {
  id: string
  templateId: string
  name: string
  generatedAt: string
  data: any
  status: "generating" | "completed" | "failed"
  downloadUrl?: string
  expiresAt?: string
}

export function ReportBuilder() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([])
  const [loading, setLoading] = useState(true)
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Report builder form state
  const [reportConfig, setReportConfig] = useState({
    title: "",
    description: "",
    dateRange: {
      type: "preset" as "preset" | "custom",
      preset: "30d" as "7d" | "30d" | "90d" | "1y" | "ytd",
      startDate: undefined as Date | undefined,
      endDate: undefined as Date | undefined
    },
    metrics: [
      { id: "revenue", name: "Total Revenue", type: "revenue", aggregation: "sum", label: "Revenue" },
      { id: "orders", name: "Total Orders", type: "orders", aggregation: "count", label: "Orders" }
    ],
    visualization: {
      type: "both" as "table" | "chart" | "both",
      chartType: "bar" as "line" | "bar" | "pie" | "area"
    }
  })

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/reports?action=templates")
      const data = await response.json()
      
      if (data.success) {
        setTemplates(data.data)
      } else {
        toast.error("Failed to load report templates")
      }
    } catch (error) {
      toast.error("Error loading templates")
    } finally {
      setLoading(false)
    }
  }

  const fetchGeneratedReports = async () => {
    try {
      const response = await fetch("/api/reports?action=generated")
      const data = await response.json()
      
      if (data.success) {
        setGeneratedReports(data.data)
      }
    } catch (error) {
      console.error("Error loading generated reports")
    }
  }

  useEffect(() => {
    fetchTemplates()
    fetchGeneratedReports()
  }, [])

  const generateReport = async (templateId: string) => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", templateId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Report generated successfully")
        fetchGeneratedReports()
      } else {
        toast.error("Failed to generate report")
      }
    } catch (error) {
      toast.error("Error generating report")
    } finally {
      setIsGenerating(false)
    }
  }

  const createTemplate = async () => {
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "create-template", 
          template: {
            name: reportConfig.title,
            description: reportConfig.description,
            category: "custom",
            config: reportConfig,
            isDefault: false
          }
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Template created successfully")
        setIsBuilderOpen(false)
        fetchTemplates()
      } else {
        toast.error("Failed to create template")
      }
    } catch (error) {
      toast.error("Error creating template")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800"
      case "generating": return "bg-yellow-100 text-yellow-800"
      case "failed": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getChartIcon = (type: string) => {
    switch (type) {
      case "line": return <TrendingUp className="h-4 w-4" />
      case "bar": return <BarChart3 className="h-4 w-4" />
      case "pie": return <PieChart className="h-4 w-4" />
      default: return <BarChart3 className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Report Builder</h1>
          <p className="text-muted-foreground">
            Create custom reports and schedule automated delivery
          </p>
        </div>
        <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Custom Report</DialogTitle>
              <DialogDescription>
                Build a custom report with your preferred metrics and visualizations
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Report Title</Label>
                <Input
                  id="title"
                  value={reportConfig.title}
                  onChange={(e) => setReportConfig({ ...reportConfig, title: e.target.value })}
                  placeholder="Enter report title"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={reportConfig.description}
                  onChange={(e) => setReportConfig({ ...reportConfig, description: e.target.value })}
                  placeholder="Enter report description"
                />
              </div>

              <div className="grid gap-2">
                <Label>Date Range</Label>
                <Select
                  value={reportConfig.dateRange.type}
                  onValueChange={(value: "preset" | "custom") => 
                    setReportConfig({ 
                      ...reportConfig, 
                      dateRange: { ...reportConfig.dateRange, type: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preset">Preset Range</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>

                {reportConfig.dateRange.type === "preset" ? (
                  <Select
                    value={reportConfig.dateRange.preset}
                    onValueChange={(value: "7d" | "30d" | "90d" | "1y" | "ytd") => 
                      setReportConfig({ 
                        ...reportConfig, 
                        dateRange: { ...reportConfig.dateRange, preset: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="1y">Last year</SelectItem>
                      <SelectItem value="ytd">Year to date</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {reportConfig.dateRange.startDate ? (
                            format(reportConfig.dateRange.startDate, "MMM dd, yyyy")
                          ) : (
                            "Start date"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={reportConfig.dateRange.startDate}
                          onSelect={(date) => 
                            setReportConfig({ 
                              ...reportConfig, 
                              dateRange: { ...reportConfig.dateRange, startDate: date }
                            })
                          }
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {reportConfig.dateRange.endDate ? (
                            format(reportConfig.dateRange.endDate, "MMM dd, yyyy")
                          ) : (
                            "End date"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={reportConfig.dateRange.endDate}
                          onSelect={(date) => 
                            setReportConfig({ 
                              ...reportConfig, 
                              dateRange: { ...reportConfig.dateRange, endDate: date }
                            })
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Visualization Type</Label>
                <Select
                  value={reportConfig.visualization.type}
                  onValueChange={(value: "table" | "chart" | "both") => 
                    setReportConfig({ 
                      ...reportConfig, 
                      visualization: { ...reportConfig.visualization, type: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="table">Table Only</SelectItem>
                    <SelectItem value="chart">Chart Only</SelectItem>
                    <SelectItem value="both">Table + Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reportConfig.visualization.type !== "table" && (
                <div className="grid gap-2">
                  <Label>Chart Type</Label>
                  <Select
                    value={reportConfig.visualization.chartType}
                    onValueChange={(value: "line" | "bar" | "pie" | "area") => 
                      setReportConfig({ 
                        ...reportConfig, 
                        visualization: { ...reportConfig.visualization, chartType: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                      <SelectItem value="area">Area Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsBuilderOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createTemplate}>
                  Create Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList>
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="generated">Generated Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{template.category}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      {getChartIcon(template.config.visualization?.chartType || "bar")}
                      <span>{template.config.visualization?.type || "table"}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{template.config.dateRange?.preset || "custom"}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button
                      className="w-full"
                      onClick={() => generateReport(template.id)}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Generate Report
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="generated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
              <CardDescription>Your recently generated reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>
                        {format(new Date(report.generatedAt), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {report.expiresAt ? (
                          format(new Date(report.expiresAt), "MMM dd, yyyy")
                        ) : (
                          "Never"
                        )}
                      </TableCell>
                      <TableCell>
                        {report.status === "completed" && report.downloadUrl && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={report.downloadUrl} download>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
