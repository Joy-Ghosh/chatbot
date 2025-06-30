"use client"

import { useEffect } from "react"
import MultilingualChatbot from "../multilingual-chatbot"

export default function Page() {
  useEffect(() => {
    // Check if we're embedded as a widget
    const urlParams = new URLSearchParams(window.location.search)
    const isEmbedded = urlParams.get("embedded") === "true"

    if (isEmbedded) {
      // Add widget mode class to body
      document.body.classList.add("widget-mode")
      document.documentElement.style.background = "transparent"
      document.body.style.background = "transparent"

      // Remove any default margins/padding
      document.body.style.margin = "0"
      document.body.style.padding = "0"
      document.body.style.overflow = "hidden"
    }
  }, [])

  return (
    <div className="widget-container">
      <MultilingualChatbot />
    </div>
  )
}
