import { t } from "elysia"


export const TMessageRole = t.Union([t.Literal('system'), t.Literal('user'), t.Literal('assistant')])

export type MessageRole = typeof TMessageRole.static

export const TMessage = t.Object({
  role: TMessageRole,
  content: t.String(),
})

export type Message = typeof TMessage.static