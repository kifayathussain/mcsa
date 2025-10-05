"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Package, ShoppingCart } from "lucide-react"
import { toast } from "sonner"

interface ChannelSyncButtonsProps {
  channelId: string
  channelType: string
  lastSyncAt?: string
}

export function ChannelSyncButtons({ channelId, channelType, lastSyncAt }: ChannelSyncButtonsProps) {
  const [isSyncingOrders, setIsSyncingOrders] = useState(false)
  const [isSyncingInventory, setIsSyncingInventory] = useState(false)

  const handleSyncOrders = async () => {
    setIsSyncingOrders(true)
    try {
      const response = await fetch(`/api/${channelType}/sync-orders?channelId=${channelId}`, {
        method: "POST",
      })
      const data = await response.json()
      
      if (data.ok) {
        toast.success(`Synced ${data.count} orders from ${channelType}`)
      } else {
        toast.error(data.error || "Failed to sync orders")
      }
    } catch (error) {
      toast.error("Failed to sync orders")
    } finally {
      setIsSyncingOrders(false)
    }
  }

  const handleSyncInventory = async () => {
    setIsSyncingInventory(true)
    try {
      const response = await fetch(`/api/${channelType}/sync-inventory?channelId=${channelId}`, {
        method: "POST",
      })
      const data = await response.json()
      
      if (data.ok) {
        toast.success(`Synced ${data.count} inventory items from ${channelType}`)
      } else {
        toast.error(data.error || "Failed to sync inventory")
      }
    } catch (error) {
      toast.error("Failed to sync inventory")
    } finally {
      setIsSyncingInventory(false)
    }
  }

  // Only show sync buttons for eBay, Etsy, Shopify, and Walmart
  if (!["ebay", "etsy", "shopify", "walmart"].includes(channelType)) {
    return null
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleSyncOrders}
        disabled={isSyncingOrders || isSyncingInventory}
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        {isSyncingOrders ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Syncing...
          </>
        ) : (
          "Sync Orders"
        )}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleSyncInventory}
        disabled={isSyncingOrders || isSyncingInventory}
      >
        <Package className="mr-2 h-4 w-4" />
        {isSyncingInventory ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Syncing...
          </>
        ) : (
          "Sync Inventory"
        )}
      </Button>
    </div>
  )
}
