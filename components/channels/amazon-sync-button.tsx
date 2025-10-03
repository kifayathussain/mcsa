"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface AmazonSyncButtonProps {
  channelId: string
  syncType: "orders" | "inventory"
}

export function AmazonSyncButton({ channelId, syncType }: AmazonSyncButtonProps) {
  const router = useRouter()
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const endpoint = syncType === "orders" ? "/api/amazon/sync-orders" : "/api/amazon/sync-inventory"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      })

      if (!response.ok) {
        throw new Error("Sync failed")
      }

      const data = await response.json()
      alert(`Successfully synced ${data.syncedCount} ${syncType}`)
      router.refresh()
    } catch (error) {
      alert(`Failed to sync ${syncType}`)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Button onClick={handleSync} disabled={isSyncing} size="sm" variant="outline">
      <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
      Sync {syncType === "orders" ? "Orders" : "Inventory"}
    </Button>
  )
}
