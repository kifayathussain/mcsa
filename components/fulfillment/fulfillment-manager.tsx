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
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Package, 
  ClipboardList, 
  FileText, 
  Warehouse,
  Plus,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Printer,
  Download
} from "lucide-react"
import { toast } from "sonner"

interface Warehouse {
  id: string
  name: string
  code: string
  address: any
  isActive: boolean
  isDefault: boolean
}

interface PickList {
  id: string
  warehouseId: string
  orderIds: string[]
  status: "pending" | "in_progress" | "completed" | "cancelled"
  assignedTo?: string
  createdAt: string
  completedAt?: string
}

interface PackingSlip {
  id: string
  orderId: string
  warehouseId: string
  slipNumber: string
  status: "pending" | "packed" | "shipped"
  packedBy?: string
  packedAt?: string
  createdAt: string
}

interface Order {
  id: string
  orderNumber: string
  orderDate: string
  totalAmount: number
  orderStatus: string
  customerEmail: string
  items: Array<{
    sku: string
    productName: string
    quantity: number
    unitPrice: number
  }>
}

export function FulfillmentManager() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [pickLists, setPickLists] = useState<PickList[]>([])
  const [packingSlips, setPackingSlips] = useState<PackingSlip[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [isPickListDialogOpen, setIsPickListDialogOpen] = useState(false)
  const [isPackingSlipDialogOpen, setIsPackingSlipDialogOpen] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState("")

  const fetchWarehouses = async () => {
    try {
      const response = await fetch("/api/fulfillment/warehouses")
      const data = await response.json()
      
      if (data.success) {
        setWarehouses(data.data)
        if (data.data.length > 0 && !selectedWarehouse) {
          setSelectedWarehouse(data.data[0].id)
        }
      } else {
        toast.error("Failed to load warehouses")
      }
    } catch (error) {
      toast.error("Error loading warehouses")
    }
  }

  const fetchPickLists = async () => {
    try {
      const response = await fetch("/api/fulfillment/pick-lists")
      const data = await response.json()
      
      if (data.success) {
        setPickLists(data.data)
      }
    } catch (error) {
      console.error("Error loading pick lists")
    }
  }

  const fetchPackingSlips = async () => {
    try {
      const response = await fetch("/api/fulfillment/packing-slips")
      const data = await response.json()
      
      if (data.success) {
        setPackingSlips(data.data)
      }
    } catch (error) {
      console.error("Error loading packing slips")
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/fulfillment/orders?status=pending")
      const data = await response.json()
      
      if (data.success) {
        setOrders(data.data)
      }
    } catch (error) {
      console.error("Error loading orders")
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchWarehouses(),
        fetchPickLists(),
        fetchPackingSlips(),
        fetchOrders()
      ])
      setLoading(false)
    }
    loadData()
  }, [])

  const createPickList = async () => {
    if (selectedOrders.length === 0 || !selectedWarehouse) {
      toast.error("Please select orders and warehouse")
      return
    }

    try {
      const response = await fetch("/api/fulfillment/pick-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseId: selectedWarehouse,
          orderIds: selectedOrders
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Pick list created successfully")
        setIsPickListDialogOpen(false)
        setSelectedOrders([])
        fetchPickLists()
      } else {
        toast.error("Failed to create pick list")
      }
    } catch (error) {
      toast.error("Error creating pick list")
    }
  }

  const createPackingSlip = async (orderId: string) => {
    if (!selectedWarehouse) {
      toast.error("Please select a warehouse")
      return
    }

    try {
      const response = await fetch("/api/fulfillment/packing-slips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          warehouseId: selectedWarehouse
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Packing slip created successfully")
        fetchPackingSlips()
      } else {
        toast.error("Failed to create packing slip")
      }
    } catch (error) {
      toast.error("Error creating packing slip")
    }
  }

  const updatePickListStatus = async (pickListId: string, status: string) => {
    try {
      const response = await fetch(`/api/fulfillment/pick-lists/${pickListId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Pick list status updated")
        fetchPickLists()
      } else {
        toast.error("Failed to update pick list status")
      }
    } catch (error) {
      toast.error("Error updating pick list")
    }
  }

  const printPickList = async (pickListId: string) => {
    try {
      const response = await fetch(`/api/fulfillment/pick-lists/${pickListId}/print`, {
        method: "POST"
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Pick list sent to printer")
      } else {
        toast.error("Failed to print pick list")
      }
    } catch (error) {
      toast.error("Error printing pick list")
    }
  }

  const printPackingSlip = async (slipId: string) => {
    try {
      const response = await fetch(`/api/fulfillment/packing-slips/${slipId}/print`, {
        method: "POST"
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Packing slip sent to printer")
      } else {
        toast.error("Failed to print packing slip")
      }
    } catch (error) {
      toast.error("Error printing packing slip")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "in_progress": return "bg-blue-100 text-blue-800"
      case "completed": return "bg-green-100 text-green-800"
      case "cancelled": return "bg-red-100 text-red-800"
      case "packed": return "bg-green-100 text-green-800"
      case "shipped": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />
      case "in_progress": return <RefreshCw className="h-4 w-4" />
      case "completed": return <CheckCircle className="h-4 w-4" />
      case "cancelled": return <AlertCircle className="h-4 w-4" />
      case "packed": return <Package className="h-4 w-4" />
      case "shipped": return <CheckCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
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
          <h1 className="text-3xl font-bold">Fulfillment Management</h1>
          <p className="text-muted-foreground">
            Manage pick lists, packing slips, and warehouse operations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isPickListDialogOpen} onOpenChange={setIsPickListDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create Pick List
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Pick List</DialogTitle>
                <DialogDescription>
                  Select orders to create a pick list for fulfillment
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Warehouse</Label>
                  <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} ({warehouse.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Select Orders</Label>
                  <div className="max-h-64 overflow-y-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Order #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Items</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedOrders.includes(order.id)}
                                onCheckedChange={() => toggleOrderSelection(order.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                            <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                            <TableCell>{order.customerEmail}</TableCell>
                            <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                            <TableCell>{order.items.length}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsPickListDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createPickList} disabled={selectedOrders.length === 0}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Pick List ({selectedOrders.length} orders)
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="pick-lists" className="w-full">
        <TabsList>
          <TabsTrigger value="pick-lists">Pick Lists</TabsTrigger>
          <TabsTrigger value="packing-slips">Packing Slips</TabsTrigger>
          <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
        </TabsList>

        <TabsContent value="pick-lists" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pick Lists</CardTitle>
              <CardDescription>Manage warehouse pick lists for order fulfillment</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pick List #</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pickLists.map((pickList) => (
                    <TableRow key={pickList.id}>
                      <TableCell className="font-medium">PL-{pickList.id.slice(-8)}</TableCell>
                      <TableCell>
                        {warehouses.find(w => w.id === pickList.warehouseId)?.name || "Unknown"}
                      </TableCell>
                      <TableCell>{pickList.orderIds.length}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(pickList.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(pickList.status)}
                            <span>{pickList.status}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>{pickList.assignedTo || "Unassigned"}</TableCell>
                      <TableCell>{new Date(pickList.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => printPickList(pickList.id)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          {pickList.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updatePickListStatus(pickList.id, "in_progress")}
                            >
                              Start
                            </Button>
                          )}
                          {pickList.status === "in_progress" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updatePickListStatus(pickList.id, "completed")}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packing-slips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Packing Slips</CardTitle>
              <CardDescription>Manage packing slips for order shipment</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slip #</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Packed By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packingSlips.map((slip) => (
                    <TableRow key={slip.id}>
                      <TableCell className="font-medium">{slip.slipNumber}</TableCell>
                      <TableCell>{slip.orderId}</TableCell>
                      <TableCell>
                        {warehouses.find(w => w.id === slip.warehouseId)?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(slip.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(slip.status)}
                            <span>{slip.status}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>{slip.packedBy || "Not packed"}</TableCell>
                      <TableCell>{new Date(slip.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => printPackingSlip(slip.id)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          {slip.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => createPackingSlip(slip.orderId)}
                            >
                              Pack
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {warehouses.map((warehouse) => (
              <Card key={warehouse.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      {warehouse.isDefault && (
                        <Badge variant="default">Default</Badge>
                      )}
                      <Badge variant={warehouse.isActive ? "default" : "secondary"}>
                        {warehouse.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{warehouse.code}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <p className="font-medium">{warehouse.address.name}</p>
                      <p className="text-muted-foreground">{warehouse.address.address1}</p>
                      <p className="text-muted-foreground">
                        {warehouse.address.city}, {warehouse.address.state} {warehouse.address.postalCode}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
