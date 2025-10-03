import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ChannelsHeader } from "@/components/channels/channels-header"
import { ChannelsList } from "@/components/channels/channels-list"
import { AvailableChannels } from "@/components/channels/available-channels"

export default async function ChannelsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch connected channels
  const { data: channels, error: channelsError } = await supabase
    .from("channels")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8">
      <ChannelsHeader />
      <AvailableChannels connectedChannels={channels || []} />
      <ChannelsList channels={channels || []} />
    </div>
  )
}
