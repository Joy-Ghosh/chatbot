"use client"

import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatLauncherProps {
  onClick: () => void
  hasNewMessages: boolean
  tooltip: string
}

export function ChatLauncher({ onClick, hasNewMessages, tooltip }: ChatLauncherProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={onClick}
        size="lg"
        className="relative h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-600 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
        aria-label="Open Chat Support"
        title={tooltip}
      >
        <MessageCircle className="h-6 w-6 text-white" />
        {hasNewMessages && <div className="absolute -top-1 -right-1 h-4 w-4 bg-amber-400 rounded-full animate-pulse" />}
      </Button>
    </div>
  )
}
