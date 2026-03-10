import { t } from "elysia"

export const TMessageRole = t.Union([t.Literal('system'), t.Literal('user'), t.Literal('assistant')])

export type MessageRole = typeof TMessageRole.static

export const TMessage = t.Object({
  role: TMessageRole,
  content: t.String(),
})

export type Message = typeof TMessage.static

export const TLLMRequest = t.Object({
  transcript: t.Array(TMessage),
})

export type LLMRequest = typeof TLLMRequest.static

export const TLLMResponse = t.Object({
  action: t.Union([t.Literal('followup'), t.Literal('submit')]),
  content: t.String(),
})

export type LLMResponse = typeof TLLMResponse.static

export const TLLMError = t.Object({
  action: t.Literal('error'),
  content: t.String(),
})

export type LLMError = typeof TLLMError.static

export interface OpenAIChoice {
  index?: number
  message: {
    role: string
    content: string
  }
  finish_reason?: string
}

export interface OpenAIResponse {
  id?: string
  object?: string
  created?: number
  model?: string
  choices: OpenAIChoice[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  error?: {
    message: string
    type: string
    code?: string
  }
}