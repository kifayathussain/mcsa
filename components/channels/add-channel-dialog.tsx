"use client"

import type React from "react"

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
import { createClient } from "@/lib/supabase/client"

interface AddChannelDialogProps {
  channelType: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const channelConfigs: Record<
  string,
  {
    name: string
    fields: Array<{ key: string; label: string; type: string; placeholder: string }>
  }
> = {
  amazon: {
    name: "Amazon",
    fields: [
      { key: "channel_name", label: "Channel Name", type: "text", placeholder: "My Amazon Store" },
      { key: "seller_id", label: "Seller ID", type: "text", placeholder: "A1BCDEFGHIJK2L" },
      { key: "marketplace_id", label: "Marketplace ID", type: "text", placeholder: "ATVPDKIKX0DER" },
      { key: "region", label: "Region", type: "text", placeholder: "us-east-1" },
      { key: "client_id", label: "LWA Client ID", type: "text", placeholder: "amzn1.application-oa2-client..." },
      { key: "client_secret", label: "LWA Client Secret", type: "password", placeholder: "Enter client secret" },
      { key: "refresh_token", label: "Refresh Token", type: "password", placeholder: "Enter refresh token" },
    ],
  },
  ebay: {
    name: "eBay",
    fields: [
      { key: "channel_name", label: "Channel Name", type: "text", placeholder: "My eBay Store" },
      { key: "app_id", label: "App ID (Client ID)", type: "text", placeholder: "YourAppI-YourApp-PRD-..." },
      { key: "cert_id", label: "Cert ID (Client Secret)", type: "password", placeholder: "PRD-..." },
      { key: "dev_id", label: "Dev ID", type: "text", placeholder: "Your Dev ID" },
      { key: "user_token", label: "User Token", type: "password", placeholder: "Enter user token" },
    ],
  },
  etsy: {
    name: "Etsy",
    fields: [
      { key: "channel_name", label: "Channel Name", type: "text", placeholder: "My Etsy Shop" },
      { key: "shop_id", label: "Shop ID", type: "text", placeholder: "12345678" },
      { key: "api_key", label: "API Key", type: "text", placeholder: "Enter API key" },
      { key: "api_secret", label: "API Secret", type: "password", placeholder: "Enter API secret" },
      { key: "access_token", label: "Access Token", type: "password", placeholder: "Enter access token" },
    ],
  },
  shopify: {
    name: "Shopify",
    fields: [
      { key: "channel_name", label: "Channel Name", type: "text", placeholder: "My Shopify Store" },
      { key: "shop_url", label: "Shop URL", type: "text", placeholder: "mystore.myshopify.com" },
      { key: "access_token", label: "Admin API Access Token", type: "password", placeholder: "shpat_..." },
      { key: "api_version", label: "API Version", type: "text", placeholder: "2024-01" },
    ],
  },
  walmart: {
    name: "Walmart",
    fields: [
      { key: "channel_name", label: "Channel Name", type: "text", placeholder: "My Walmart Store" },
      { key: "client_id", label: "Client ID", type: "text", placeholder: "Enter client ID" },
      { key: "client_secret", label: "Client Secret", type: "password", placeholder: "Enter client secret" },
    ],
  },
}

export function AddChannelDialog({ channelType, open, onOpenChange }: AddChannelDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const config = channelConfigs[channelType]
  const [formData, setFormData] = useState<Record<string, string>>(
    Object.fromEntries(config.fields.map((field) => [field.key, ""])),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // For eBay and Etsy, redirect to OAuth flow
      if (channelType === "ebay" || channelType === "etsy") {
        const state = Math.random().toString(36).substring(7)
        const oauthUrl = `/api/${channelType}/oauth?state=${state}`
        window.location.href = oauthUrl
        return
      }

      // For other channels, use manual credential entry
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      // Extract channel name and prepare API credentials
      const { channel_name, ...apiCredentials } = formData

      const { error: insertError } = await supabase.from("channels").insert({
        user_id: user.id,
        channel_type: channelType,
        channel_name: channel_name,
        is_connected: true,
        api_credentials: apiCredentials,
      })

      if (insertError) throw insertError

      onOpenChange(false)
      router.refresh()

      // Reset form
      setFormData(Object.fromEntries(config.fields.map((field) => [field.key, ""])))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add channel")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Connect {config.name}</DialogTitle>
          <DialogDescription>Enter your {config.name} API credentials to connect your account</DialogDescription>
        </DialogHeader>

        {(channelType === "ebay" || channelType === "etsy") ? (
          <div className="py-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the button below to authorize {config.name} access. You'll be redirected to {config.name} to complete the connection.
              </p>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "Redirecting..." : `Connect to ${config.name}`}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {config.fields.map((field) => (
                <div key={field.key} className="grid gap-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.key]}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    required
                  />
                </div>
              ))}

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Connecting..." : "Connect Channel"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
