export type MessageRole = 'system' | 'user' | 'assistant'

export interface Message {
  role: MessageRole
  content: string
}

export interface LLMRequest {
  transcript: Message[]
  maxTokens?: number
  temperature?: number
}

export interface LLMResponse {
  action: 'followup' | 'submit'
  content: string
}

export interface LLMError {
  message: string
  code?: string
  details?: unknown
}
