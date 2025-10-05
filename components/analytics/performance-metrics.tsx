"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Clock, Package, Target, DollarSign, Users } from "lucide-react"

interface PerformanceMetricsProps {
  data: {
    conversionRate: number
    averageOrderValue: number
    customerAcquisitionCost: number
    inventoryTurnoverRate: number
    orderFulfillmentTime: number
    returnRate: number
  }
}

export function PerformanceMetrics({ data }: PerformanceMetricsProps) {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  const formatPercentage = (value: number) => 
    `${(value * 100).toFixed(1)}%`

  const formatDays = (days: number) => 
    `${days.toFixed(1)} days`

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Average Order Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              Per order
            </p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(data.conversionRate)}</div>
            <p className="text-xs text-muted-foreground">
              Visitors to customers
            </p>
          </CardContent>
        </Card>

        {/* Customer Acquisition Cost */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Acquisition Cost</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.customerAcquisitionCost)}</div>
            <p className="text-xs text-muted-foreground">
              Cost per customer
            </p>
          </CardContent>
        </Card>

        {/* Inventory Turnover Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Turnover</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.inventoryTurnoverRate.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Times per year
            </p>
          </CardContent>
        </Card>

        {/* Order Fulfillment Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fulfillment Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDays(data.orderFulfillmentTime)}</div>
            <p className="text-xs text-muted-foreground">
              Average processing time
            </p>
          </CardContent>
        </Card>

        {/* Return Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Return Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(data.returnRate)}</div>
            <p className="text-xs text-muted-foreground">
              Of total orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>Key metrics and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center space-x-3">
                <Badge variant="outline">AOV</Badge>
                <div>
                  <p className="text-sm font-medium">Average Order Value</p>
                  <p className="text-xs text-muted-foreground">
                    {data.averageOrderValue > 50 ? "Good" : "Consider bundling products"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatCurrency(data.averageOrderValue)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center space-x-3">
                <Badge variant="outline">Turnover</Badge>
                <div>
                  <p className="text-sm font-medium">Inventory Turnover</p>
                  <p className="text-xs text-muted-foreground">
                    {data.inventoryTurnoverRate > 4 ? "Excellent" : "Consider inventory optimization"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{data.inventoryTurnoverRate.toFixed(2)}x</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center space-x-3">
                <Badge variant="outline">Fulfillment</Badge>
                <div>
                  <p className="text-sm font-medium">Order Processing</p>
                  <p className="text-xs text-muted-foreground">
                    {data.orderFulfillmentTime < 2 ? "Fast" : "Consider automation"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatDays(data.orderFulfillmentTime)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
