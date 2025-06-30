export interface Message {
  id: string
  content: string
  sender: "bot" | "user"
  timestamp: Date
  language?: string
}

export interface Language {
  code: string
  name: string
  flag: string
}

export interface ChatState {
  isOpen: boolean
  messages: Message[]
  currentLanguage: Language
  isTyping: boolean
  hasNewMessages: boolean
  theme: "light" | "dark"
}

export interface QuickAction {
  id: string
  label: string
  icon: string
  action: () => void
}
