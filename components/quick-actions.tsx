"use client"

import { MessageSquare, Globe, User } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QuickActionsProps {
  onCommonQuestions: () => void
  onChangeLanguage: () => void
  onTalkToHuman: () => void
  translations: any
  showQuestions?: boolean
  questions?: string[]
  onQuestionSelect?: (question: string) => void
}

export function QuickActions({
  onCommonQuestions,
  onChangeLanguage,
  onTalkToHuman,
  translations,
  showQuestions = false,
  questions = [],
  onQuestionSelect,
}: QuickActionsProps) {
  if (showQuestions && questions.length > 0) {
    return (
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{translations.selectQuestion}</p>
        <div className="space-y-2">
          {questions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onQuestionSelect?.(question)}
              className="w-full text-left justify-start text-xs hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-950 transition-all duration-200"
            >
              {question}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  const actions = [
    {
      icon: MessageSquare,
      label: translations.commonQuestions,
      onClick: onCommonQuestions,
    },
    {
      icon: Globe,
      label: translations.changeLanguage,
      onClick: onChangeLanguage,
    },
    {
      icon: User,
      label: translations.talkToHuman,
      onClick: onTalkToHuman,
    },
  ]

  return (
    <div className="flex flex-wrap gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={action.onClick}
          className="flex items-center gap-2 text-xs hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-950 transition-all duration-200 bg-transparent animate-in slide-in-from-bottom-2"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <action.icon className="h-3 w-3" />
          {action.label}
        </Button>
      ))}
    </div>
  )
}
