"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShippingManager } from "@/components/shipping/shipping-manager"
import { FulfillmentManager } from "@/components/fulfillment/fulfillment-manager"
import { Truck, Package } from "lucide-react"

export default function ShippingPage() {
  const [activeTab, setActiveTab] = useState("shipping")

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shipping & Fulfillment</h1>
          <p className="text-muted-foreground">
            Manage shipping carriers, fulfillment workflows, and warehouse operations
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shipping" className="flex items-center space-x-2">
            <Truck className="h-4 w-4" />
            <span>Shipping Management</span>
          </TabsTrigger>
          <TabsTrigger value="fulfillment" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Fulfillment</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shipping" className="space-y-4">
          <ShippingManager />
        </TabsContent>

        <TabsContent value="fulfillment" className="space-y-4">
          <FulfillmentManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
