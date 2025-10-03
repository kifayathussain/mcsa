import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProductsTable } from "@/components/products/products-table"
import { ProductsHeader } from "@/components/products/products-header"

export default async function ProductsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch products with their listings and inventory
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(`
      *,
      product_listings (
        id,
        channel_id,
        external_id,
        channel_sku,
        channel_price,
        is_active,
        channels (
          channel_type,
          channel_name
        )
      ),
      inventory (
        quantity,
        available_quantity,
        warehouse_location
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8">
      <ProductsHeader />
      <ProductsTable products={products || []} />
    </div>
  )
}
