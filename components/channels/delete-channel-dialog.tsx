"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createClient } from "@/lib/supabase/client"

interface Channel {
  id: string
  channel_type: string
  channel_name: string
}

interface DeleteChannelDialogProps {
  channel: Channel
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteChannelDialog({ channel, open, onOpenChange }: DeleteChannelDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.from("channels").delete().eq("id", channel.id)

      if (error) throw error

      onOpenChange(false)
      router.refresh()
    } catch (err) {
      console.error("Failed to delete channel:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Channel?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove <strong>{channel.channel_name}</strong> ({channel.channel_type}) from your account. Product
            listings and order history will be preserved, but you will need to reconnect to sync new data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Removing..." : "Remove Channel"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
