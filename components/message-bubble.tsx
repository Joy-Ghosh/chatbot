"use client"

import { useState } from "react"
import type { Message } from "../types/chat"
import { Bot, User, Copy, Check, ThumbsUp, ThumbsDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface MessageBubbleProps {
  message: Message
  isLast?: boolean
}

export function MessageBubble({ message, isLast }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState<boolean | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const isBot = message.sender === "bot"

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLike = (isLike: boolean) => {
    setLiked(isLike)
    // Here you could send feedback to your analytics
    console.log(`Message ${isLike ? "liked" : "disliked"}:`, message.id)
  }

  return (
    <div
      className={`group flex gap-3 mb-6 animate-in slide-in-from-bottom-3 duration-500 ${
        isBot ? "justify-start" : "justify-end"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isBot && (
        <div className="flex-shrink-0 relative">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-emerald-100 dark:ring-emerald-900 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl">
            <Bot className="h-5 w-5 text-white animate-pulse" />
          </div>
          {/* Online indicator */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-bounce" />
        </div>
      )}

      <div className={`max-w-[75%] ${isBot ? "order-2" : "order-1"}`}>
        {/* Message bubble */}
        <div
          className={`relative px-4 py-3 rounded-2xl shadow-md transition-all duration-300 group-hover:shadow-lg ${
            isBot
              ? "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100 rounded-tl-sm"
              : "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-tr-sm"
          }`}
        >
          {/* Message content */}
          <p className="text-sm leading-relaxed break-words">{message.content}</p>

          {/* Decorative elements */}
          {isBot && (
            <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-gray-100 dark:border-r-gray-800" />
          )}
          {!isBot && (
            <div className="absolute -right-2 top-4 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-indigo-500" />
          )}

          {/* Shimmer effect for bot messages */}
          {isBot && (
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-500" />
          )}
        </div>

        {/* Message actions */}
        <div
          className={`flex items-center gap-2 mt-2 transition-all duration-300 ${
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          } ${isBot ? "justify-start" : "justify-end"}`}
        >
          {/* Timestamp */}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {/* Copy button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 text-gray-400 hover:text-gray-600" />
              )}
            </Button>

            {/* Like/Dislike for bot messages */}
            {isBot && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(true)}
                  className={`h-6 w-6 p-0 transition-all duration-200 ${
                    liked === true
                      ? "bg-green-100 text-green-600 hover:bg-green-200"
                      : "hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(false)}
                  className={`h-6 w-6 p-0 transition-all duration-200 ${
                    liked === false
                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                      : "hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
              </>
            )}

            {/* More options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700">
                  <MoreHorizontal className="h-3 w-3 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isBot ? "start" : "end"} className="w-40">
                <DropdownMenuItem onClick={handleCopy}>
                  <Copy className="h-3 w-3 mr-2" />
                  Copy text
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bot className="h-3 w-3 mr-2" />
                  Report issue
                </DropdownMenuItem>
                {isBot && (
                  <DropdownMenuItem>
                    <ThumbsUp className="h-3 w-3 mr-2" />
                    Regenerate
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Delivery status for user messages */}
        {!isBot && (
          <div
            className={`flex items-center justify-end gap-1 mt-1 text-xs text-gray-500 transition-all duration-300 ${
              isHovered ? "opacity-100" : "opacity-60"
            }`}
          >
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
            </div>
            <span>Delivered</span>
          </div>
        )}
      </div>

      {!isBot && (
        <div className="flex-shrink-0 relative">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-indigo-100 dark:ring-indigo-900 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl">
            <User className="h-5 w-5 text-white" />
          </div>
          {/* Active indicator */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900" />
        </div>
      )}
    </div>
  )
}
