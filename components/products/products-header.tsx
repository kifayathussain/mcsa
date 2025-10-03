"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { AddProductDialog } from "./add-product-dialog"

export function ProductsHeader() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your product catalog across all channels</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <AddProductDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </>
  )
}
