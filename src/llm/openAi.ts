import { getConfig, validateConfig, type LLMConfig } from "./config"
import type { LLMError, LLMRequest, LLMResponse, Message } from "./types"

export interface OpenAIChoice {
    index?: number
    message: Message | { role?: string; content?: unknown }
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

export const validateRequest = (request: LLMRequest): Error | null => {
    if (!request.transcript || !Array.isArray(request.transcript)) {
        return new Error('Invalid transcript: must be an array of messages')
    }
    if (request.transcript.length === 0) {
        return new Error('Invalid transcript: cannot be empty')
    }
    return null
}

export const buildRequestBody = (
  config: LLMConfig,
  request: LLMRequest,
  systemPrompt: string,
): Record<string, unknown> => {
  const messages = [
    {
      role: 'system',
      content: systemPrompt,
    },
    ...request.transcript,
  ]

  return {
    model: config.model,
    messages,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    response_format: { type: 'json_object' },
  }
}

const isValidLLMResponse = (value: unknown): value is LLMResponse => {
    if (!value || typeof value !== 'object') {
        return false
    }

    const parsed = value as Partial<LLMResponse>

    return (
        (parsed.action === 'followup' || parsed.action === 'submit') &&
        typeof parsed.content === 'string'
    )
}

export const normalizeOpenAIContent = (content: unknown): string => {
    if (typeof content === 'string') {
        return content
    }

    if (Array.isArray(content)) {
        return content
            .map((part) => {
                if (typeof part === 'string') {
                    return part
                }

                if (part && typeof part === 'object' && 'text' in part) {
                    const text = (part as { text?: unknown }).text
                    return typeof text === 'string' ? text : ''
                }

                return ''
            })
            .join('')
    }

    return ''
}

const parseJsonObject = (content: string): unknown => {
    const trimmed = content.trim()

    try {
        return JSON.parse(trimmed)
    } catch {
        const withoutFence = trimmed
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/```$/i, '')
            .trim()

        const start = withoutFence.indexOf('{')
        const end = withoutFence.lastIndexOf('}')

        if (start >= 0 && end > start) {
            return JSON.parse(withoutFence.slice(start, end + 1))
        }

        throw new Error('No JSON object found in LLM response')
    }
}

export const parseOpenAIResponse = (response: OpenAIResponse): LLMResponse | LLMError => {
    if (response.error) {
        return {
            action: 'error',
            content: response.error.message,
        }
    }

    if (!response.choices || response.choices.length === 0) {
        return {
            action: 'error',
            content: 'No choices returned from LLM',
        }
    }

    const content = normalizeOpenAIContent(response.choices[0]?.message?.content)

    try {
        const parsed = parseJsonObject(content)
        if (isValidLLMResponse(parsed)) {
            return parsed
        }
        return {
            action: 'error',
            content: `Invalid response format: ${JSON.stringify(parsed)}`,
        }
    } catch {
        return {
            action: 'error',
            content: 'Failed to parse LLM response as JSON',
        }
    }
}

export const fetchOpenAI = async (config: LLMConfig, body: Record<string, unknown>): Promise<Response> => {
    return fetch(config.apiUrl || '', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: config.apiKey ? `Bearer ${config.apiKey}` : ''
        },
        body: JSON.stringify(body)
    })
}

export interface LLMClient {
    callLLM: (request: LLMRequest) => Promise<LLMResponse | LLMError>
}

export const createLLMClient = (config: LLMConfig = getConfig(), systemPrompt: string): LLMClient => {
    if (!validateConfig(config)) {
        throw new Error("Invalid config")
    }

    const callLLM = async (request: LLMRequest): Promise<LLMResponse | LLMError> => {
        const validationError = validateRequest(request)
        if (validationError) {
            return {
                action: 'error',
                content: validationError.message,
            }
        }

        const body = buildRequestBody(config, request, systemPrompt)

        try {
            const response = await fetchOpenAI(config, body)

            if (!response.ok) {
                return {
                    action: 'error',
                    content: `LLM API error: ${response.status} ${response.statusText}`,
                }
            }

            const data: OpenAIResponse = (await response.json()) as OpenAIResponse
            return parseOpenAIResponse(data)
        } catch (error) {
            if (error instanceof Error) {
                return {
                    action: 'error',
                    content: error.message,
                }
            }
            return {
                action: 'error',
                content: 'Unknown error occurred',
            }
        }
    }

    return {
        callLLM
    }
}


export const processTranscript = async (transcript: Message[], client: LLMClient): Promise<LLMResponse | LLMError> => {
    return client.callLLM({ transcript })
}
