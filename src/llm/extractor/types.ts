export type Question = Record<string, string>

export type Survey = {
  questions: Question[]
}

export type SurveyField = {
  key: string
  prompt: string
  min: number
  max: number
  required?: boolean
}

export type SurveySpec = {
  id: string
  name: string
  description: string
  timeframe?: string
  fields: SurveyField[]
}

export type SurveyAnswers = Record<string, string>

export type ValidationResult =
  | { ok: true; answers: SurveyAnswers }
  | { ok: false; errors: string[]; answers: SurveyAnswers }

export interface Tool {
  type: 'function'
  name: string
  description: string
  parameters: Record<string, unknown>
  strict: true
}
