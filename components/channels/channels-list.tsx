"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { DeleteChannelDialog } from "./delete-channel-dialog"
import { AmazonSyncButton } from "./amazon-sync-button"

interface Channel {
  id: string
  channel_type: string
  channel_name: string
  is_connected: boolean
  last_sync_at: string | null
  created_at: string
}

interface ChannelsListProps {
  channels: Channel[]
}

const channelIcons: Record<string, string> = {
  amazon: "🛒",
  ebay: "🏪",
  etsy: "🎨",
  shopify: "🛍️",
  walmart: "🏬",
}

export function ChannelsList({ channels }: ChannelsListProps) {
  const [deletingChannel, setDeletingChannel] = useState<Channel | null>(null)

  if (channels.length === 0) {
    return null
  }

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold mb-4">Connected Channels</h2>
        <div className="grid gap-4">
          {channels.map((channel) => (
            <Card key={channel.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{channelIcons[channel.channel_type] || "🔗"}</span>
                    <div>
                      <CardTitle className="text-lg capitalize">{channel.channel_type}</CardTitle>
                      <p className="text-sm text-muted-foreground">{channel.channel_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={channel.is_connected ? "default" : "secondary"}>
                      {channel.is_connected ? "Connected" : "Disconnected"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDeletingChannel(channel)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {channel.last_sync_at ? (
                      <>
                        Last synced:{" "}
                        {new Date(channel.last_sync_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </>
                    ) : (
                      "Never synced"
                    )}
                  </div>
                  {channel.channel_type === "amazon" && (
                    <div className="flex gap-2">
                      <AmazonSyncButton channelId={channel.id} syncType="orders" />
                      <AmazonSyncButton channelId={channel.id} syncType="inventory" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {deletingChannel && (
        <DeleteChannelDialog
          channel={deletingChannel}
          open={!!deletingChannel}
          onOpenChange={(open) => !open && setDeletingChannel(null)}
        />
      )}
    </>
  )
}
