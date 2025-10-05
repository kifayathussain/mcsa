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
import { Textarea } from "@/components/ui/textarea"
import { 
  Truck, 
  Package, 
  MapPin, 
  Calculator, 
  Printer, 
  Download,
  Plus,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"

interface ShippingCarrier {
  id: string
  name: string
  code: string
  isActive: boolean
  apiConfig: any
  services: ShippingService[]
}

interface ShippingService {
  id: string
  carrierId: string
  name: string
  code: string
  description: string
  isActive: boolean
  estimatedDays: number
  maxWeight: number
  maxDimensions: {
    length: number
    width: number
    height: number
  }
}

interface ShippingRate {
  carrierId: string
  serviceId: string
  serviceName: string
  rate: number
  currency: string
  estimatedDays: number
  deliveryDate?: string
}

interface ShippingLabel {
  id: string
  orderId: string
  carrierId: string
  serviceId: string
  trackingNumber: string
  labelUrl: string
  status: "created" | "printed" | "shipped" | "delivered" | "exception"
  createdAt: string
  shippedAt?: string
  deliveredAt?: string
}

interface ShippingAddress {
  name: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
  email?: string
}

export function ShippingManager() {
  const [carriers, setCarriers] = useState<ShippingCarrier[]>([])
  const [labels, setLabels] = useState<ShippingLabel[]>([])
  const [rates, setRates] = useState<ShippingRate[]>([])
  const [loading, setLoading] = useState(true)
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false)
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false)
  const [calculatingRates, setCalculatingRates] = useState(false)
  const [creatingLabel, setCreatingLabel] = useState(false)

  // Rate calculation form state
  const [rateForm, setRateForm] = useState({
    fromAddress: {
      name: "",
      company: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "US",
      phone: "",
      email: ""
    } as ShippingAddress,
    toAddress: {
      name: "",
      company: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "US",
      phone: "",
      email: ""
    } as ShippingAddress,
    package: {
      weight: 1,
      dimensions: {
        length: 10,
        width: 8,
        height: 6
      },
      items: [{ sku: "", quantity: 1, weight: 1 }]
    }
  })

  // Label creation form state
  const [labelForm, setLabelForm] = useState({
    orderId: "",
    carrierId: "",
    serviceId: "",
    fromAddress: {
      name: "",
      company: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "US",
      phone: "",
      email: ""
    } as ShippingAddress,
    toAddress: {
      name: "",
      company: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "US",
      phone: "",
      email: ""
    } as ShippingAddress,
    package: {
      weight: 1,
      dimensions: {
        length: 10,
        width: 8,
        height: 6
      },
      items: [{ sku: "", quantity: 1, weight: 1 }]
    }
  })

  const fetchCarriers = async () => {
    try {
      const response = await fetch("/api/shipping/carriers")
      const data = await response.json()
      
      if (data.success) {
        setCarriers(data.data)
      } else {
        toast.error("Failed to load shipping carriers")
      }
    } catch (error) {
      toast.error("Error loading carriers")
    }
  }

  const fetchLabels = async () => {
    try {
      const response = await fetch("/api/shipping/labels")
      const data = await response.json()
      
      if (data.success) {
        setLabels(data.data)
      }
    } catch (error) {
      console.error("Error loading labels")
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchCarriers(), fetchLabels()])
      setLoading(false)
    }
    loadData()
  }, [])

  const calculateRates = async () => {
    setCalculatingRates(true)
    try {
      const response = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAddress: rateForm.fromAddress,
          toAddress: rateForm.toAddress,
          package: rateForm.package
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setRates(data.data)
        toast.success("Rates calculated successfully")
      } else {
        toast.error("Failed to calculate rates")
      }
    } catch (error) {
      toast.error("Error calculating rates")
    } finally {
      setCalculatingRates(false)
    }
  }

  const createLabel = async () => {
    setCreatingLabel(true)
    try {
      const response = await fetch("/api/shipping/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: labelForm.orderId,
          carrierId: labelForm.carrierId,
          serviceId: labelForm.serviceId,
          fromAddress: labelForm.fromAddress,
          toAddress: labelForm.toAddress,
          package: labelForm.package
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Shipping label created successfully")
        setIsLabelDialogOpen(false)
        fetchLabels()
      } else {
        toast.error("Failed to create shipping label")
      }
    } catch (error) {
      toast.error("Error creating label")
    } finally {
      setCreatingLabel(false)
    }
  }

  const printLabel = async (labelId: string) => {
    try {
      const response = await fetch(`/api/shipping/labels/${labelId}/print`, {
        method: "POST"
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Label sent to printer")
      } else {
        toast.error("Failed to print label")
      }
    } catch (error) {
      toast.error("Error printing label")
    }
  }

  const downloadLabel = async (labelId: string) => {
    try {
      const response = await fetch(`/api/shipping/labels/${labelId}/download`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `shipping-label-${labelId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success("Label downloaded")
      } else {
        toast.error("Failed to download label")
      }
    } catch (error) {
      toast.error("Error downloading label")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "created": return "bg-blue-100 text-blue-800"
      case "printed": return "bg-yellow-100 text-yellow-800"
      case "shipped": return "bg-green-100 text-green-800"
      case "delivered": return "bg-green-100 text-green-800"
      case "exception": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "created": return <Clock className="h-4 w-4" />
      case "printed": return <Printer className="h-4 w-4" />
      case "shipped": return <Truck className="h-4 w-4" />
      case "delivered": return <CheckCircle className="h-4 w-4" />
      case "exception": return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
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
          <h1 className="text-3xl font-bold">Shipping Management</h1>
          <p className="text-muted-foreground">
            Manage shipping carriers, calculate rates, and print labels
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Rates
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Calculate Shipping Rates</DialogTitle>
                <DialogDescription>
                  Get shipping rates from all configured carriers
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Address</Label>
                    <div className="space-y-2">
                      <Input
                        placeholder="Name"
                        value={rateForm.fromAddress.name}
                        onChange={(e) => setRateForm({
                          ...rateForm,
                          fromAddress: { ...rateForm.fromAddress, name: e.target.value }
                        })}
                      />
                      <Input
                        placeholder="Company"
                        value={rateForm.fromAddress.company}
                        onChange={(e) => setRateForm({
                          ...rateForm,
                          fromAddress: { ...rateForm.fromAddress, company: e.target.value }
                        })}
                      />
                      <Input
                        placeholder="Address Line 1"
                        value={rateForm.fromAddress.address1}
                        onChange={(e) => setRateForm({
                          ...rateForm,
                          fromAddress: { ...rateForm.fromAddress, address1: e.target.value }
                        })}
                      />
                      <Input
                        placeholder="Address Line 2"
                        value={rateForm.fromAddress.address2}
                        onChange={(e) => setRateForm({
                          ...rateForm,
                          fromAddress: { ...rateForm.fromAddress, address2: e.target.value }
                        })}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="City"
                          value={rateForm.fromAddress.city}
                          onChange={(e) => setRateForm({
                            ...rateForm,
                            fromAddress: { ...rateForm.fromAddress, city: e.target.value }
                          })}
                        />
                        <Input
                          placeholder="State"
                          value={rateForm.fromAddress.state}
                          onChange={(e) => setRateForm({
                            ...rateForm,
                            fromAddress: { ...rateForm.fromAddress, state: e.target.value }
                          })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Postal Code"
                          value={rateForm.fromAddress.postalCode}
                          onChange={(e) => setRateForm({
                            ...rateForm,
                            fromAddress: { ...rateForm.fromAddress, postalCode: e.target.value }
                          })}
                        />
                        <Input
                          placeholder="Country"
                          value={rateForm.fromAddress.country}
                          onChange={(e) => setRateForm({
                            ...rateForm,
                            fromAddress: { ...rateForm.fromAddress, country: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>To Address</Label>
                    <div className="space-y-2">
                      <Input
                        placeholder="Name"
                        value={rateForm.toAddress.name}
                        onChange={(e) => setRateForm({
                          ...rateForm,
                          toAddress: { ...rateForm.toAddress, name: e.target.value }
                        })}
                      />
                      <Input
                        placeholder="Company"
                        value={rateForm.toAddress.company}
                        onChange={(e) => setRateForm({
                          ...rateForm,
                          toAddress: { ...rateForm.toAddress, company: e.target.value }
                        })}
                      />
                      <Input
                        placeholder="Address Line 1"
                        value={rateForm.toAddress.address1}
                        onChange={(e) => setRateForm({
                          ...rateForm,
                          toAddress: { ...rateForm.toAddress, address1: e.target.value }
                        })}
                      />
                      <Input
                        placeholder="Address Line 2"
                        value={rateForm.toAddress.address2}
                        onChange={(e) => setRateForm({
                          ...rateForm,
                          toAddress: { ...rateForm.toAddress, address2: e.target.value }
                        })}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="City"
                          value={rateForm.toAddress.city}
                          onChange={(e) => setRateForm({
                            ...rateForm,
                            toAddress: { ...rateForm.toAddress, city: e.target.value }
                          })}
                        />
                        <Input
                          placeholder="State"
                          value={rateForm.toAddress.state}
                          onChange={(e) => setRateForm({
                            ...rateForm,
                            toAddress: { ...rateForm.toAddress, state: e.target.value }
                          })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Postal Code"
                          value={rateForm.toAddress.postalCode}
                          onChange={(e) => setRateForm({
                            ...rateForm,
                            toAddress: { ...rateForm.toAddress, postalCode: e.target.value }
                          })}
                        />
                        <Input
                          placeholder="Country"
                          value={rateForm.toAddress.country}
                          onChange={(e) => setRateForm({
                            ...rateForm,
                            toAddress: { ...rateForm.toAddress, country: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Package Details</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="number"
                      placeholder="Weight (lbs)"
                      value={rateForm.package.weight}
                      onChange={(e) => setRateForm({
                        ...rateForm,
                        package: { ...rateForm.package, weight: Number(e.target.value) }
                      })}
                    />
                    <Input
                      type="number"
                      placeholder="Length (in)"
                      value={rateForm.package.dimensions.length}
                      onChange={(e) => setRateForm({
                        ...rateForm,
                        package: { 
                          ...rateForm.package, 
                          dimensions: { ...rateForm.package.dimensions, length: Number(e.target.value) }
                        }
                      })}
                    />
                    <Input
                      type="number"
                      placeholder="Width (in)"
                      value={rateForm.package.dimensions.width}
                      onChange={(e) => setRateForm({
                        ...rateForm,
                        package: { 
                          ...rateForm.package, 
                          dimensions: { ...rateForm.package.dimensions, width: Number(e.target.value) }
                        }
                      })}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsRateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={calculateRates} disabled={calculatingRates}>
                    {calculatingRates ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Calculator className="mr-2 h-4 w-4" />
                        Calculate Rates
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isLabelDialogOpen} onOpenChange={setIsLabelDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Label
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Shipping Label</DialogTitle>
                <DialogDescription>
                  Create a shipping label for an order
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="orderId">Order ID</Label>
                  <Input
                    id="orderId"
                    placeholder="Enter order ID"
                    value={labelForm.orderId}
                    onChange={(e) => setLabelForm({ ...labelForm, orderId: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Carrier</Label>
                  <Select
                    value={labelForm.carrierId}
                    onValueChange={(value) => setLabelForm({ ...labelForm, carrierId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      {carriers.map((carrier) => (
                        <SelectItem key={carrier.id} value={carrier.id}>
                          {carrier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {labelForm.carrierId && (
                  <div className="grid gap-2">
                    <Label>Service</Label>
                    <Select
                      value={labelForm.serviceId}
                      onValueChange={(value) => setLabelForm({ ...labelForm, serviceId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {carriers
                          .find(c => c.id === labelForm.carrierId)
                          ?.services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} - {service.description}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsLabelDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createLabel} disabled={creatingLabel}>
                    {creatingLabel ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Label
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="labels" className="w-full">
        <TabsList>
          <TabsTrigger value="labels">Shipping Labels</TabsTrigger>
          <TabsTrigger value="rates">Rate Calculator</TabsTrigger>
          <TabsTrigger value="carriers">Carriers</TabsTrigger>
        </TabsList>

        <TabsContent value="labels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Labels</CardTitle>
              <CardDescription>Manage and track your shipping labels</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Tracking Number</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {labels.map((label) => (
                    <TableRow key={label.id}>
                      <TableCell className="font-medium">{label.orderId}</TableCell>
                      <TableCell>{label.trackingNumber}</TableCell>
                      <TableCell>
                        {carriers.find(c => c.id === label.carrierId)?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(label.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(label.status)}
                            <span>{label.status}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(label.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => printLabel(label.id)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadLabel(label.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Rates</CardTitle>
              <CardDescription>Compare rates from different carriers</CardDescription>
            </CardHeader>
            <CardContent>
              {rates.length > 0 ? (
                <div className="space-y-2">
                  {rates.map((rate, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{rate.serviceName}</p>
                        <p className="text-sm text-muted-foreground">
                          {rate.estimatedDays} days • {rate.deliveryDate && new Date(rate.deliveryDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${rate.rate.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{rate.currency}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No rates calculated yet</p>
                  <p className="text-sm text-muted-foreground">
                    Click "Calculate Rates" to get shipping quotes
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carriers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {carriers.map((carrier) => (
              <Card key={carrier.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{carrier.name}</CardTitle>
                    <Badge variant={carrier.isActive ? "default" : "secondary"}>
                      {carrier.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription>{carrier.code.toUpperCase()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {carrier.services.length} services configured
                    </p>
                    <div className="space-y-1">
                      {carrier.services.slice(0, 3).map((service) => (
                        <div key={service.id} className="text-sm">
                          <span className="font-medium">{service.name}</span>
                          <span className="text-muted-foreground ml-2">
                            {service.estimatedDays} days
                          </span>
                        </div>
                      ))}
                      {carrier.services.length > 3 && (
                        <p className="text-sm text-muted-foreground">
                          +{carrier.services.length - 3} more services
                        </p>
                      )}
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
