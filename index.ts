import { Elysia, t, file } from 'elysia'
import { DEFAULT_CONFIG } from './src/llm/config'
import type { LLMClientOptions } from './src/llm/client'
import type { LLMError, LLMRequest, LLMResponse, Message } from './src/llm/types'
import staticPlugin from '@elysiajs/static'

export const LLM_CONFIG = DEFAULT_CONFIG

type ParsedTranscript =
  | { ok: true; transcript: Message[] }
  | { ok: false; error: string }

const isMessage = (value: unknown): value is Message => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Record<string, unknown>

  return (
    (candidate.role === 'system' ||
      candidate.role === 'user' ||
      candidate.role === 'assistant') &&
    typeof candidate.content === 'string'
  )
}

const parseTranscript = (rawTranscript: unknown): ParsedTranscript => {
  if (rawTranscript === undefined) {
    return { ok: false, error: 'Missing transcript field' }
  }

  let parsedTranscript: unknown = rawTranscript

  if (typeof rawTranscript === 'string') {
    try {
      parsedTranscript = JSON.parse(rawTranscript) as unknown
    } catch {
      return { ok: false, error: 'Transcript must be valid JSON' }
    }
  }

  if (!Array.isArray(parsedTranscript)) {
    return { ok: false, error: 'Invalid transcript: must be an array of messages' }
  }

  if (parsedTranscript.length === 0) {
    return { ok: false, error: 'Invalid transcript: cannot be empty' }
  }

  if (!parsedTranscript.every(isMessage)) {
    return {
      ok: false,
      error: 'Invalid transcript: each message must have a valid role and string content',
    }
  }

  return { ok: true, transcript: parsedTranscript }
}

const createApp = (llmClient: LLMClientOptions) => {
  return new Elysia()
    .use(
      staticPlugin({
        assets: 'src/client/',
        prefix: '/',
      })
    )
    .get('/', () => file('src/client/index.html'))
    .post(
      '/',
      async ({ body, status }) => {
        const requestBody = (body ?? {}) as Partial<LLMRequest> & {
          transcript?: unknown
        }

        const parsed = parseTranscript(requestBody.transcript)

        if (!parsed.ok) {
          const err: LLMError = {
            action: 'error',
            content: parsed.error,
          }

          return status(400, err)
        }

        const llmResult: LLMResponse | LLMError =
          await llmClient.llmClient.callLLM({
            transcript: parsed.transcript,
          })

        if (llmResult.action === 'error') {
          return status(500, llmResult)
        }

        return llmResult
      },
      {
        body: t.Any(),
        response: {
          200: t.Object({
            action: t.Union([t.Literal('followup'), t.Literal('submit')]),
            content: t.String(),
          }),
          400: t.Object({
            action: t.Literal('error'),
            content: t.String(),
          }),
          500: t.Object({
            action: t.Literal('error'),
            content: t.String(),
          }),
        },
      }
    )
}

export default createApp