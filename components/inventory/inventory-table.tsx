"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, AlertTriangle } from "lucide-react"
import { useState } from "react"
import { AdjustInventoryDialog } from "./adjust-inventory-dialog"

interface InventoryItem {
  id: string
  product_id: string
  warehouse_location: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  reorder_point: number
  reorder_quantity: number
  last_updated_at: string
  products: {
    id: string
    sku: string
    title: string
    price: number
    status: string
  }
}

interface InventoryTableProps {
  inventory: InventoryItem[]
}

export function InventoryTable({ inventory }: InventoryTableProps) {
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null)

  const getStockStatus = (item: InventoryItem) => {
    if (item.available_quantity === 0) {
      return { label: "Out of Stock", color: "bg-red-500/10 text-red-500 border-red-500/20" }
    }
    if (item.available_quantity <= item.reorder_point) {
      return { label: "Low Stock", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" }
    }
    return { label: "In Stock", color: "bg-green-500/10 text-green-500 border-green-500/20" }
  }

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Total Qty</TableHead>
              <TableHead>Reserved</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Reorder Point</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <p className="text-muted-foreground">No inventory records found</p>
                  <p className="text-sm text-muted-foreground mt-1">Add products to start tracking inventory</p>
                </TableCell>
              </TableRow>
            ) : (
              inventory.map((item) => {
                const status = getStockStatus(item)
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.products.sku}</TableCell>
                    <TableCell className="font-medium">{item.products.title}</TableCell>
                    <TableCell className="capitalize">{item.warehouse_location}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.quantity}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.reserved_quantity}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{item.available_quantity}</Badge>
                    </TableCell>
                    <TableCell>{item.reorder_point}</TableCell>
                    <TableCell>
                      <Badge className={status.color}>
                        {item.available_quantity <= item.reorder_point && <AlertTriangle className="mr-1 h-3 w-3" />}
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(item.last_updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setAdjustingItem(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {adjustingItem && (
        <AdjustInventoryDialog
          item={adjustingItem}
          open={!!adjustingItem}
          onOpenChange={(open) => !open && setAdjustingItem(null)}
        />
      )}
    </>
  )
}
