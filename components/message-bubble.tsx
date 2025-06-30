"use client"

import type { Message } from "../types/chat"
import { Bot, User } from "lucide-react"

interface MessageBubbleProps {
  message: Message
  isLast?: boolean
}

export function MessageBubble({ message, isLast }: MessageBubbleProps) {
  const isBot = message.sender === "bot"

  return (
    <div
      className={`flex gap-3 mb-4 animate-in slide-in-from-bottom-2 duration-200 ${isBot ? "justify-start" : "justify-end"}`}
    >
      {isBot && (
        <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
          <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
      )}

      <div className={`max-w-[80%] ${isBot ? "order-2" : "order-1"}`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isBot ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100" : "bg-indigo-500 text-white"
          }`}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
        <div className={`mt-1 text-xs text-gray-500 ${isBot ? "text-left" : "text-right"}`}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {!isBot && (
        <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center order-2">
          <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </div>
      )}
    </div>
  )
}
