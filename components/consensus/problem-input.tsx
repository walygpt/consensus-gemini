'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, X, FileText } from 'lucide-react'
import type { Constraints } from '@/lib/types'

interface ProblemInputProps {
  problem: string
  setProblem: (value: string) => void
  constraints: Constraints
  setConstraints: (value: Constraints) => void
  onRequestClarification: () => void
  isLoading: boolean
  geminiConfigured: boolean
}

export function ProblemInput({
  problem,
  setProblem,
  constraints,
  setConstraints,
  onRequestClarification,
  isLoading,
  geminiConfigured
}: ProblemInputProps) {
  const [newStakeholder, setNewStakeholder] = useState('')

  const addStakeholder = () => {
    if (newStakeholder.trim()) {
      setConstraints({
        ...constraints,
        stakeholders: [...(constraints.stakeholders || []), newStakeholder.trim()]
      })
      setNewStakeholder('')
    }
  }

  const removeStakeholder = (index: number) => {
    const updated = [...(constraints.stakeholders || [])]
    updated.splice(index, 1)
    setConstraints({ ...constraints, stakeholders: updated })
  }

  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Describe Your Problem</CardTitle>
            <CardDescription>Enter the details of the decision you need to make</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="problem" className="text-sm font-medium">
            Problem Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="problem"
            placeholder="Describe your problem or decision in detail. Include background context, goals, and any relevant information..."
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            className="min-h-[140px] resize-y"
          />
          <p className="text-xs text-muted-foreground">
            {problem.length} characters (minimum 10 required)
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="budget">Budget</Label>
            <Input
              id="budget"
              placeholder="e.g., $10,000 - $50,000"
              value={constraints.budget || ''}
              onChange={(e) => setConstraints({ ...constraints, budget: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeframe">Timeframe</Label>
            <Input
              id="timeframe"
              placeholder="e.g., 3 months"
              value={constraints.timeframe || ''}
              onChange={(e) => setConstraints({ ...constraints, timeframe: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="legal">Legal / Regulatory Constraints</Label>
          <Input
            id="legal"
            placeholder="e.g., GDPR compliance required, industry regulations..."
            value={constraints.legal || ''}
            onChange={(e) => setConstraints({ ...constraints, legal: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority Level</Label>
          <Input
            id="priority"
            placeholder="e.g., High, Medium, Low or Critical"
            value={constraints.priority || ''}
            onChange={(e) => setConstraints({ ...constraints, priority: e.target.value })}
          />
        </div>

        <div className="space-y-3">
          <Label>Stakeholders</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add a stakeholder (e.g., CEO, Engineering Team)"
              value={newStakeholder}
              onChange={(e) => setNewStakeholder(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStakeholder())}
            />
            <Button 
              type="button" 
              variant="outline" 
              size="icon"
              onClick={addStakeholder}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {constraints.stakeholders && constraints.stakeholders.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {constraints.stakeholders.map((s, i) => (
                <Badge key={i} variant="secondary" className="pl-3 pr-1.5 py-1.5 gap-1">
                  {s}
                  <button
                    type="button"
                    onClick={() => removeStakeholder(i)}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={onRequestClarification}
          disabled={!geminiConfigured || problem.length < 10 || isLoading}
          variant="secondary"
          className="w-full"
        >
          {isLoading ? 'Generating Questions...' : 'Request Clarifying Questions (Optional)'}
        </Button>

        {!geminiConfigured && (
          <p className="text-sm text-destructive text-center">
            Gemini API not configured. Please set the GEMINI_API_KEY environment variable.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
