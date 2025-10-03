import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { InventoryTable } from "@/components/inventory/inventory-table"
import { InventoryHeader } from "@/components/inventory/inventory-header"
import { InventoryStats } from "@/components/inventory/inventory-stats"

export default async function InventoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch inventory with product information
  const { data: inventory, error: inventoryError } = await supabase
    .from("inventory")
    .select(`
      *,
      products (
        id,
        sku,
        title,
        price,
        status,
        user_id
      )
    `)
    .order("last_updated_at", { ascending: false })

  // Filter inventory for current user's products
  const userInventory = (inventory || []).filter((inv) => inv.products?.user_id === user.id)

  // Calculate stats
  const totalProducts = userInventory.length
  const totalStock = userInventory.reduce((sum, inv) => sum + inv.quantity, 0)
  const availableStock = userInventory.reduce((sum, inv) => sum + inv.available_quantity, 0)
  const lowStockItems = userInventory.filter((inv) => inv.available_quantity <= inv.reorder_point).length

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8">
      <InventoryHeader />
      <InventoryStats
        totalProducts={totalProducts}
        totalStock={totalStock}
        availableStock={availableStock}
        lowStockItems={lowStockItems}
      />
      <InventoryTable inventory={userInventory} />
    </div>
  )
}
