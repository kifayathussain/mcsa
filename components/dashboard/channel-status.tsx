import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle } from "lucide-react"

interface Channel {
  id: string
  channel_type: string
  channel_name: string
  is_connected: boolean
  last_sync_at: string | null
}

interface ChannelStatusProps {
  channels: Channel[]
}

export function ChannelStatus({ channels }: ChannelStatusProps) {
  const channelIcons: Record<string, string> = {
    amazon: "🛒",
    ebay: "🏪",
    etsy: "🎨",
    shopify: "🛍️",
    walmart: "🏬",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel Status</CardTitle>
        <p className="text-sm text-muted-foreground">Connected marketplaces</p>
      </CardHeader>
      <CardContent>
        {channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">No channels connected yet</p>
            <p className="text-xs text-muted-foreground mt-1">Connect your first marketplace to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {channels.map((channel) => (
              <div key={channel.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{channelIcons[channel.channel_type] || "🔗"}</span>
                  <div>
                    <p className="font-medium capitalize">{channel.channel_type}</p>
                    <p className="text-xs text-muted-foreground">{channel.channel_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {channel.is_connected ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <Badge variant="outline" className="text-green-500 border-green-500">
                        Connected
                      </Badge>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <Badge variant="outline" className="text-red-500 border-red-500">
                        Disconnected
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
