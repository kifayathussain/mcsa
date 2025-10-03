"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"

interface ChannelSalesChartProps {
  data: Array<{
    channel: string
    revenue: number
  }>
}

export function ChannelSalesChart({ data }: ChannelSalesChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales by Channel</CardTitle>
        <CardDescription>Revenue breakdown across sales channels</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            revenue: {
              label: "Revenue",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="channel" className="text-xs" tick={{ fill: "hsl(var(--foreground))" }} />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--foreground))" }}
                tickFormatter={(value) => `$${value}`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
