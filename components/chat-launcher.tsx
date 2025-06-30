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
        className="relative h-16 w-16 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:via-emerald-600 hover:to-emerald-700 hover:scale-110 transition-all duration-300 shadow-xl hover:shadow-2xl group overflow-hidden"
        aria-label="Open Chat Support"
        title={tooltip}
      >
        {/* Animated background pulse */}
        <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20" />

        {/* Shimmer effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 group-hover:animate-shimmer" />

        {/* Main icon */}
        <MessageCircle className="h-7 w-7 text-white relative z-10 group-hover:rotate-12 transition-transform duration-300" />

        {/* Floating particles */}
        <div
          className="absolute top-2 right-2 w-1 h-1 bg-white/60 rounded-full animate-bounce"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="absolute top-4 left-3 w-1 h-1 bg-white/40 rounded-full animate-bounce"
          style={{ animationDelay: "0.5s" }}
        />
        <div
          className="absolute bottom-3 right-4 w-1 h-1 bg-white/50 rounded-full animate-bounce"
          style={{ animationDelay: "1s" }}
        />

        {/* Enhanced notification badge */}
        {hasNewMessages && (
          <div className="absolute -top-2 -right-2 h-6 w-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-pulse shadow-lg border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          </div>
        )}

        {/* Ripple effect on hover */}
        <div className="absolute inset-0 rounded-full bg-white/10 scale-0 group-hover:scale-100 transition-transform duration-500" />
      </Button>
    </div>
  )
}
