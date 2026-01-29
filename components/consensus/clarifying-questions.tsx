'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MessageCircleQuestion } from 'lucide-react'
import type { ClarifyingQuestion } from '@/lib/types'

interface ClarifyingQuestionsProps {
  questions: ClarifyingQuestion[]
  answers: Record<string, string>
  setAnswers: (answers: Record<string, string>) => void
}

export function ClarifyingQuestions({ questions, answers, setAnswers }: ClarifyingQuestionsProps) {
  if (questions.length === 0) return null

  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10">
            <MessageCircleQuestion className="w-5 h-5 text-accent" />
          </div>
          <div>
            <CardTitle className="text-xl">Clarifying Questions</CardTitle>
            <CardDescription>Answer these to improve your decision package</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((q, i) => (
          <div key={q.id} className="space-y-2">
            <Label htmlFor={q.id} className="text-sm font-medium">
              {i + 1}. {q.question}
            </Label>
            <Input
              id={q.id}
              placeholder="Your answer..."
              value={answers[q.id] || ''}
              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
