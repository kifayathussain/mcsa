"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Mail, Phone, Calendar, DollarSign, ShoppingCart, Tag, Edit, Eye } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface Customer {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  lastOrderDate?: string
  firstOrderDate?: string
  customerLifetimeValue: number
  tags: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

interface CustomerOrder {
  id: string
  orderNumber: string
  orderDate: string
  totalAmount: number
  orderStatus: string
  channel: string
  items: Array<{
    sku: string
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
}

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/customers?action=list&search=${encodeURIComponent(searchTerm)}`)
      const data = await response.json()
      
      if (data.success) {
        setCustomers(data.data.customers)
      } else {
        toast.error("Failed to load customers")
      }
    } catch (error) {
      toast.error("Error loading customers")
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomerDetails = async (customerId: string) => {
    try {
      const [detailsResponse, ordersResponse] = await Promise.all([
        fetch(`/api/customers?action=details&customerId=${customerId}`),
        fetch(`/api/customers?action=orders&customerId=${customerId}`)
      ])

      const detailsData = await detailsResponse.json()
      const ordersData = await ordersResponse.json()

      if (detailsData.success && ordersData.success) {
        setSelectedCustomer(detailsData.data)
        setCustomerOrders(ordersData.data)
        setIsDetailsOpen(true)
      } else {
        toast.error("Failed to load customer details")
      }
    } catch (error) {
      toast.error("Error loading customer details")
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [searchTerm])

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase()
    if (firstName) return firstName[0].toUpperCase()
    if (email) return email[0].toUpperCase()
    return "?"
  }

  const getCustomerSegment = (customer: Customer) => {
    if (customer.totalSpent > 1000) return "VIP"
    if (customer.totalOrders > 10) return "Loyal"
    if (customer.totalOrders > 5) return "Regular"
    return "New"
  }

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case "VIP": return "bg-purple-100 text-purple-800"
      case "Loyal": return "bg-blue-100 text-blue-800"
      case "Regular": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships and track their value
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP Customers</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => getCustomerSegment(c) === "VIP").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(customers.reduce((sum, c) => sum + c.totalSpent, 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                customers.length > 0 
                  ? customers.reduce((sum, c) => sum + c.averageOrderValue, 0) / customers.length 
                  : 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <CardDescription>Manage your customer database</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>Last Order</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => {
                const segment = getCustomerSegment(customer)
                return (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(customer.firstName, customer.lastName, customer.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {customer.firstName && customer.lastName 
                              ? `${customer.firstName} ${customer.lastName}`
                              : customer.email
                            }
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {customer.firstName && customer.lastName ? customer.email : "No name"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="h-3 w-3" />
                          <span>{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{customer.totalOrders}</div>
                        <div className="text-muted-foreground">
                          {formatCurrency(customer.averageOrderValue)} avg
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(customer.totalSpent)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSegmentColor(segment)}>
                        {segment}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {customer.lastOrderDate ? (
                        <div className="text-sm">
                          {format(new Date(customer.lastOrderDate), "MMM dd, yyyy")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchCustomerDetails(customer.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              View customer information and order history
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="orders">Order History</TabsTrigger>
                <TabsTrigger value="notes">Notes & Tags</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <p className="text-sm text-muted-foreground">
                          {selectedCustomer.firstName && selectedCustomer.lastName 
                            ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
                            : "Not provided"
                          }
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Phone</label>
                        <p className="text-sm text-muted-foreground">
                          {selectedCustomer.phone || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Customer Since</label>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(selectedCustomer.createdAt), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Purchase Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Total Orders</span>
                        <span className="text-sm">{selectedCustomer.totalOrders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Total Spent</span>
                        <span className="text-sm">{formatCurrency(selectedCustomer.totalSpent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Average Order Value</span>
                        <span className="text-sm">{formatCurrency(selectedCustomer.averageOrderValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Customer Lifetime Value</span>
                        <span className="text-sm font-bold">{formatCurrency(selectedCustomer.customerLifetimeValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Last Order</span>
                        <span className="text-sm">
                          {selectedCustomer.lastOrderDate 
                            ? format(new Date(selectedCustomer.lastOrderDate), "MMM dd, yyyy")
                            : "Never"
                          }
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="orders" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Order History</CardTitle>
                    <CardDescription>Recent orders from this customer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Channel</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                            <TableCell>{format(new Date(order.orderDate), "MMM dd, yyyy")}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{order.channel}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{order.orderStatus}</Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedCustomer.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {selectedCustomer.notes || "No notes available"}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
