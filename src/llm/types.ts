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

export const TLLMSubmitRequest = t.Object({
  transcript: t.Array(TMessage),
  taskId: t.String(),
})

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
