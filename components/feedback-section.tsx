"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface FeedbackSectionProps {
  onSubmit: (rating: number, comment: string) => void
  translations: any
}

export function FeedbackSection({ onSubmit, translations }: FeedbackSectionProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")

  const handleSubmit = () => {
    onSubmit(rating, comment)
    setRating(0)
    setComment("")
  }

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <div className="space-y-4">
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`h-6 w-6 ${
                  star <= (hoveredRating || rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>

        <Textarea
          placeholder={translations.feedback}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="resize-none"
          rows={3}
        />

        <Button onClick={handleSubmit} disabled={rating === 0} className="w-full bg-emerald-500 hover:bg-emerald-600">
          {translations.submitFeedback}
        </Button>
      </div>
    </div>
  )
}
