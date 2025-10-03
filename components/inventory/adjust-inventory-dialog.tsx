"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"

interface InventoryItem {
  id: string
  product_id: string
  warehouse_location: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  reorder_point: number
  reorder_quantity: number
  products: {
    sku: string
    title: string
  }
}

interface AdjustInventoryDialogProps {
  item: InventoryItem
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdjustInventoryDialog({ item, open, onOpenChange }: AdjustInventoryDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [adjustmentAmount, setAdjustmentAmount] = useState("")
  const [newQuantity, setNewQuantity] = useState(item.quantity.toString())
  const [reorderPoint, setReorderPoint] = useState(item.reorder_point.toString())
  const [reorderQuantity, setReorderQuantity] = useState(item.reorder_quantity.toString())

  const handleAdjustment = async (type: "add" | "subtract" | "set") => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      let newQty = item.quantity

      if (type === "add") {
        newQty = item.quantity + Number.parseInt(adjustmentAmount)
      } else if (type === "subtract") {
        newQty = Math.max(0, item.quantity - Number.parseInt(adjustmentAmount))
      } else if (type === "set") {
        newQty = Number.parseInt(newQuantity)
      }

      const { error: updateError } = await supabase
        .from("inventory")
        .update({
          quantity: newQty,
          last_updated_at: new Date().toISOString(),
        })
        .eq("id", item.id)

      if (updateError) throw updateError

      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to adjust inventory")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateSettings = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from("inventory")
        .update({
          reorder_point: Number.parseInt(reorderPoint),
          reorder_quantity: Number.parseInt(reorderQuantity),
        })
        .eq("id", item.id)

      if (updateError) throw updateError

      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update settings")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adjust Inventory</DialogTitle>
          <DialogDescription>
            {item.products.sku} - {item.products.title}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="adjust" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="adjust">Adjust Stock</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="adjust" className="space-y-4">
            <div className="rounded-lg border border-border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Quantity</span>
                <span className="font-semibold">{item.quantity} units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reserved</span>
                <span>{item.reserved_quantity} units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Available</span>
                <span className="font-semibold text-green-500">{item.available_quantity} units</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Add/Remove Stock</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                  />
                  <Button onClick={() => handleAdjustment("add")} disabled={isLoading || !adjustmentAmount}>
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAdjustment("subtract")}
                    disabled={isLoading || !adjustmentAmount}
                  >
                    Remove
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Set Exact Quantity</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Enter new quantity"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                  />
                  <Button onClick={() => handleAdjustment("set")} disabled={isLoading}>
                    Set
                  </Button>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="reorder-point">Reorder Point</Label>
                <Input
                  id="reorder-point"
                  type="number"
                  value={reorderPoint}
                  onChange={(e) => setReorderPoint(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Alert when stock falls below this level</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reorder-quantity">Reorder Quantity</Label>
                <Input
                  id="reorder-quantity"
                  type="number"
                  value={reorderQuantity}
                  onChange={(e) => setReorderQuantity(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Suggested quantity to reorder when stock is low</p>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleUpdateSettings} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
