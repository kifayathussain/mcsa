"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { SalesAnalytics } from "./sales-analytics"
import { PerformanceMetrics } from "./performance-metrics"
import { toast } from "sonner"

interface AnalyticsData {
  sales: any
  performance: any
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"sales" | "performance">("sales")
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null)
  const [customRange, setCustomRange] = useState(false)

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateRange) {
        params.set("startDate", dateRange.start.toISOString())
        params.set("endDate", dateRange.end.toISOString())
      }

      const [salesResponse, performanceResponse] = await Promise.all([
        fetch(`/api/analytics?type=sales&${params.toString()}`),
        fetch(`/api/analytics?type=performance&${params.toString()}`)
      ])

      const salesData = await salesResponse.json()
      const performanceData = await performanceResponse.json()

      if (salesData.success && performanceData.success) {
        setData({
          sales: salesData.data,
          performance: performanceData.data
        })
      } else {
        toast.error("Failed to load analytics data")
      }
    } catch (error) {
      toast.error("Error loading analytics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const handleDateRangeChange = (range: string) => {
    const now = new Date()
    let start: Date, end: Date

    switch (range) {
      case "7d":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        end = now
        break
      case "30d":
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        end = now
        break
      case "90d":
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        end = now
        break
      case "1y":
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        end = now
        break
      case "custom":
        setCustomRange(true)
        return
      default:
        return
    }

    setDateRange({ start, end })
    setCustomRange(false)
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
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your sales performance and key metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select onValueChange={handleDateRangeChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>

          {customRange && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-60 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange ? (
                    `${format(dateRange.start, "MMM dd")} - ${format(dateRange.end, "MMM dd")}`
                  ) : (
                    "Pick date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange ? { from: dateRange.start, to: dateRange.end } : undefined}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ start: range.from, end: range.to })
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}

          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1">
        <Button
          variant={activeTab === "sales" ? "default" : "ghost"}
          onClick={() => setActiveTab("sales")}
        >
          Sales Analytics
        </Button>
        <Button
          variant={activeTab === "performance" ? "default" : "ghost"}
          onClick={() => setActiveTab("performance")}
        >
          Performance Metrics
        </Button>
      </div>

      {/* Content */}
      {data && (
        <>
          {activeTab === "sales" && <SalesAnalytics data={data.sales} />}
          {activeTab === "performance" && <PerformanceMetrics data={data.performance} />}
        </>
      )}
    </div>
  )
}
