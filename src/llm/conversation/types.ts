import { t } from "elysia"
import { TMessage } from "../types"

export const TLLMRequest = t.Object({
    taskId: t.String(),
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