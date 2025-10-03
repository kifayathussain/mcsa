"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { AddChannelDialog } from "./add-channel-dialog"

interface Channel {
  id: string
  channel_type: string
}

interface AvailableChannelsProps {
  connectedChannels: Channel[]
}

const availableChannels = [
  {
    type: "amazon",
    name: "Amazon",
    icon: "🛒",
    description: "Connect to Amazon Seller Central via SP-API",
    color: "bg-orange-500/10 border-orange-500/20",
  },
  {
    type: "ebay",
    name: "eBay",
    icon: "🏪",
    description: "Integrate with eBay marketplace",
    color: "bg-blue-500/10 border-blue-500/20",
  },
  {
    type: "etsy",
    name: "Etsy",
    icon: "🎨",
    description: "Connect to Etsy for handmade and vintage items",
    color: "bg-orange-500/10 border-orange-500/20",
  },
  {
    type: "shopify",
    name: "Shopify",
    icon: "🛍️",
    description: "Integrate with your Shopify store",
    color: "bg-green-500/10 border-green-500/20",
  },
  {
    type: "walmart",
    name: "Walmart",
    icon: "🏬",
    description: "Connect to Walmart Marketplace",
    color: "bg-blue-500/10 border-blue-500/20",
  },
]

export function AvailableChannels({ connectedChannels }: AvailableChannelsProps) {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)

  const isConnected = (channelType: string) => {
    return connectedChannels.some((c) => c.channel_type === channelType)
  }

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Channels</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableChannels.map((channel) => {
            const connected = isConnected(channel.type)
            return (
              <Card key={channel.type} className={channel.color}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{channel.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{channel.name}</CardTitle>
                        {connected && <span className="text-xs text-green-500 font-medium">Connected</span>}
                      </div>
                    </div>
                  </div>
                  <CardDescription className="mt-2">{channel.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setSelectedChannel(channel.type)}
                    disabled={connected}
                    className="w-full"
                    variant={connected ? "secondary" : "default"}
                  >
                    {connected ? (
                      "Already Connected"
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Connect
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {selectedChannel && (
        <AddChannelDialog
          channelType={selectedChannel}
          open={!!selectedChannel}
          onOpenChange={(open) => !open && setSelectedChannel(null)}
        />
      )}
    </>
  )
}
