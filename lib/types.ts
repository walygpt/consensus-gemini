export interface ClarifyingQuestion {
  id: string
  question: string
}

export interface Constraints {
  budget?: string
  timeframe?: string
  stakeholders?: string[]
  legal?: string
  priority?: string
}

export interface GeminiStatus {
  geminiConfigured: boolean
  reason?: string
}
