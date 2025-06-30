"use client"

import { useEffect, useState } from "react"
import MultilingualChatbot from "../multilingual-chatbot"

export default function Page() {
  const [isEmbedded, setIsEmbedded] = useState(false)

  useEffect(() => {
    // Check if we're embedded as a widget
    const urlParams = new URLSearchParams(window.location.search)
    const embedded = urlParams.get("embedded") === "true"
    setIsEmbedded(embedded)

    if (embedded) {
      // Add widget mode class to html and body
      document.documentElement.classList.add("widget-mode")
      document.body.classList.add("widget-mode")

      // Force transparent backgrounds
      document.documentElement.style.setProperty("background", "transparent", "important")
      document.documentElement.style.setProperty("background-color", "transparent", "important")
      document.body.style.setProperty("background", "transparent", "important")
      document.body.style.setProperty("background-color", "transparent", "important")

      // Remove any default margins/padding
      document.body.style.setProperty("margin", "0", "important")
      document.body.style.setProperty("padding", "0", "important")
      document.body.style.setProperty("overflow", "hidden", "important")
      document.body.style.setProperty("min-height", "auto", "important")
      document.body.style.setProperty("height", "auto", "important")

      // Detect parent theme by checking if parent has dark background
      try {
        const parentBg = window.parent.getComputedStyle(window.parent.document.body).backgroundColor
        const parentHtml = window.parent.getComputedStyle(window.parent.document.documentElement).backgroundColor

        // Check if parent has dark background
        const isDarkParent =
          parentBg.includes("rgb(") &&
          (parentBg.includes("rgb(0") ||
            parentBg.includes("rgb(1") ||
            parentBg.includes("rgb(2") ||
            parentHtml.includes("rgb(0") ||
            parentHtml.includes("rgb(1") ||
            parentHtml.includes("rgb(2"))

        if (isDarkParent) {
          document.documentElement.classList.add("dark")
        }
      } catch (e) {
        // Cross-origin restrictions, use default theme
        console.log("Cannot detect parent theme due to cross-origin restrictions")
      }
    }
  }, [])

  return (
    <div
      className="widget-container"
      style={{
        background: isEmbedded ? "transparent" : undefined,
        backgroundColor: isEmbedded ? "transparent" : undefined,
      }}
    >
      <MultilingualChatbot />
    </div>
  )
}
