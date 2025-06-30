"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { X, Send, Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ChatLauncher } from "./components/chat-launcher"
import { LanguageSelector } from "./components/language-selector"
import { MessageBubble } from "./components/message-bubble"
import { QuickActions } from "./components/quick-actions"
import { TypingIndicator } from "./components/typing-indicator"
import { FeedbackSection } from "./components/feedback-section"
import type { Message, Language, ChatState } from "./types/chat"
import { languages, translations, commonQuestions } from "./data/languages"

export default function MultilingualChatbot() {
  const [chatState, setChatState] = useState<ChatState>({
    isOpen: false,
    messages: [],
    currentLanguage: languages[0],
    isTyping: false,
    hasNewMessages: false,
    theme: "light",
  })

  const [inputValue, setInputValue] = useState("")
  const [showFeedback, setShowFeedback] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)
  const [networkError, setNetworkError] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isConnectedToHuman, setIsConnectedToHuman] = useState(false)
  const [lastMessageTime, setLastMessageTime] = useState(0)
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null)
  const [isEmbedded, setIsEmbedded] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentTranslations =
    translations[chatState.currentLanguage.code as keyof typeof translations] || translations.en

  const currentQuestions =
    commonQuestions[chatState.currentLanguage.code as keyof typeof commonQuestions] || commonQuestions.en

  // Check if embedded and setup resize communication
  useEffect(() => {
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

      // Send initial size to parent
      sendSizeToParent()
    }
  }, [])

  // Function to send size information to parent window
  const sendSizeToParent = useCallback(() => {
    if (!isEmbedded || window.parent === window) return

    try {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const message = {
        type: "CHATBOT_RESIZE",
        width: Math.max(rect.width, chatState.isOpen ? 400 : 80),
        height: Math.max(rect.height, chatState.isOpen ? 600 : 80),
        isOpen: chatState.isOpen,
      }

      window.parent.postMessage(message, "*")
    } catch (error) {
      console.log("Could not send size to parent:", error)
    }
  }, [isEmbedded, chatState.isOpen])

  // Send size updates when chat state changes
  useEffect(() => {
    if (isEmbedded) {
      // Small delay to ensure DOM has updated
      const timer = setTimeout(sendSizeToParent, 100)
      return () => clearTimeout(timer)
    }
  }, [chatState.isOpen, chatState.messages.length, showFeedback, showQuestions, sendSizeToParent])

  // Send size updates when window resizes
  useEffect(() => {
    if (!isEmbedded) return

    const handleResize = () => sendSizeToParent()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [sendSizeToParent])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatState.messages, chatState.isTyping])

  useEffect(() => {
    if (chatState.isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [chatState.isOpen])

  // Inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer)
    }

    const timer = setTimeout(
      () => {
        if (chatState.isOpen && chatState.messages.length > 0) {
          addMessage(currentTranslations.stillThere, "bot")
        }
      },
      5 * 60 * 1000,
    ) // 5 minutes

    setInactivityTimer(timer)
  }, [chatState.isOpen, chatState.messages.length, currentTranslations.stillThere])

  useEffect(() => {
    resetInactivityTimer()
    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer)
      }
    }
  }, [resetInactivityTimer])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = chatState.currentLanguage.code

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputValue(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
        addMessage(currentTranslations.voiceNotSupported, "bot")
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [chatState.currentLanguage.code, currentTranslations.voiceNotSupported])

  const toggleChat = () => {
    setChatState((prev) => ({
      ...prev,
      isOpen: !prev.isOpen,
      hasNewMessages: prev.isOpen ? false : prev.hasNewMessages,
    }))

    if (!chatState.isOpen) {
      // Welcome message when opening chat in current language
      setTimeout(() => {
        const welcomeMessage = "Hello! I'm LinguaBot, your AI assistant. How can I help you today?"
        addMessage(welcomeMessage, "bot")
      }, 500)
    }
  }

  const addMessage = (content: string, sender: "bot" | "user") => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender,
      timestamp: new Date(),
      language: chatState.currentLanguage.code,
    }

    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, newMessage],
      hasNewMessages: sender === "bot" && !prev.isOpen,
    }))

    resetInactivityTimer()
  }

  const simulateBotResponse = async (userMessage: string) => {
    setChatState((prev) => ({ ...prev, isTyping: true }))

    // Check for network connectivity
    if (!navigator.onLine) {
      setChatState((prev) => ({ ...prev, isTyping: false }))
      addMessage(currentTranslations.offline, "bot")
      return
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

    setChatState((prev) => ({ ...prev, isTyping: false }))

    // Simple bot response
    const lowerMessage = userMessage.toLowerCase()
    let response = ""

    if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
      response = "Hello! I'm here to help you. What can I assist you with today?"
    } else if (lowerMessage.includes("order")) {
      response = "I can help you track your order. Please provide your order number and I'll look it up for you."
    } else if (lowerMessage.includes("payment")) {
      response =
        "We accept all major credit cards, UPI, PayPal, and bank transfers. Is there a specific payment issue you're experiencing?"
    } else {
      response =
        "Thanks for your message! I'm here to help. Could you provide more details about what you need assistance with?"
    }

    try {
      addMessage(response, "bot")
      setNetworkError(false)
    } catch (error) {
      setNetworkError(true)
      addMessage(currentTranslations.networkError, "bot")
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // Rate limiting
    const now = Date.now()
    if (now - lastMessageTime < 1000) {
      addMessage(currentTranslations.rateLimited, "bot")
      return
    }
    setLastMessageTime(now)

    const message = inputValue.trim()
    setInputValue("")
    setShowQuestions(false)
    addMessage(message, "user")

    await simulateBotResponse(message)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleLanguageChange = (language: Language) => {
    setChatState((prev) => ({ ...prev, currentLanguage: language }))

    // Update speech recognition language
    if (recognitionRef.current) {
      recognitionRef.current.lang = language.code
    }

    // Add confirmation message in the NEW language
    setTimeout(() => {
      const newTranslations = translations[language.code as keyof typeof translations] || translations.en
      addMessage(newTranslations.languageChanged, "bot")
    }, 300)
  }

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      addMessage(currentTranslations.voiceNotSupported, "bot")
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setIsListening(true)
      recognitionRef.current.start()
    }
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "common":
        setShowQuestions(true)
        addMessage(currentTranslations.selectQuestion, "bot")
        break
      case "language":
        addMessage("You can change the language using the globe icon in the header above.", "bot")
        break
      case "human":
        setIsConnectedToHuman(true)
        addMessage(currentTranslations.connectingHuman, "bot")

        setTimeout(() => {
          addMessage(currentTranslations.humanConnected, "bot")
        }, 2000)
        break
    }
  }

  const handleQuestionSelect = (question: string) => {
    setShowQuestions(false)
    setInputValue(question)
    setTimeout(() => {
      addMessage(question, "user")
      simulateBotResponse(question)
    }, 100)
  }

  const handleFeedback = (rating: number, comment: string) => {
    console.log("Feedback submitted:", { rating, comment, language: chatState.currentLanguage.code })
    setShowFeedback(false)
    addMessage(currentTranslations.thanksFeedback, "bot")

    setTimeout(() => {
      addMessage("Is there anything else I can help you with today?", "bot")
    }, 1000)
  }

  if (!chatState.isOpen) {
    return (
      <div ref={containerRef} className="widget-container">
        <ChatLauncher
          onClick={toggleChat}
          hasNewMessages={chatState.hasNewMessages}
          tooltip={currentTranslations.needHelp}
        />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="widget-container">
      <ChatLauncher
        onClick={toggleChat}
        hasNewMessages={chatState.hasNewMessages}
        tooltip={currentTranslations.needHelp}
      />

      <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] animate-in slide-in-from-bottom-4 duration-300">
        <Card
          className={`flex flex-col h-[600px] max-h-[80vh] shadow-xl border-0 overflow-hidden chat-card ${isEmbedded ? "bg-white dark:bg-gray-900" : ""}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-emerald-500 rounded-full" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{currentTranslations.title}</h3>
                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  {isConnectedToHuman ? "Human Agent" : "Online"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LanguageSelector currentLanguage={chatState.currentLanguage} onLanguageChange={handleLanguageChange} />

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleChat}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950 chat-messages">
            {chatState.messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Welcome to LinguaBot!</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">How can I help you today?</p>
              </div>
            )}

            {chatState.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {chatState.isTyping && <TypingIndicator />}

            {networkError && (
              <div className="text-center py-2">
                <p className="text-sm text-red-500">{currentTranslations.networkError}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <QuickActions
            onCommonQuestions={() => handleQuickAction("common")}
            onChangeLanguage={() => handleQuickAction("language")}
            onTalkToHuman={() => handleQuickAction("human")}
            translations={currentTranslations}
            showQuestions={showQuestions}
            questions={currentQuestions}
            onQuestionSelect={handleQuestionSelect}
          />

          {/* Input */}
          <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening ? currentTranslations.listening : currentTranslations.placeholder}
                  className="pr-10 border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500"
                  disabled={isListening}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleVoiceInput}
                  className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 ${isListening ? "text-red-500" : "text-gray-400"}`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || chatState.isTyping || isListening}
                className="bg-emerald-500 hover:bg-emerald-600 transition-all duration-200 hover:rotate-12"
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Feedback Section */}
          {showFeedback && <FeedbackSection onSubmit={handleFeedback} translations={currentTranslations} />}
        </Card>
      </div>
    </div>
  )
}
