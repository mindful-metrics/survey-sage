import type { LLMConfig } from './config.js'
import type { Message, LLMRequest, LLMResponse, LLMError } from './types.js'
import { createContextWindow, truncateContext } from './prompt.js'
import { getConfig } from './config.js'

interface OpenAIChoice {
  index?: number
  message: {
    role: string
    content: string
  }
  finish_reason?: string
}

interface OpenAIResponse {
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

export const createLLMClient = (config: LLMConfig = getConfig()) => {
  const validateRequest = (request: LLMRequest): Error | null => {
    if (!request.transcript || !Array.isArray(request.transcript)) {
      return new Error('Invalid transcript: must be an array of messages')
    }
    if (request.transcript.length === 0) {
      return new Error('Invalid transcript: cannot be empty')
    }
    if (request.maxTokens !== undefined && request.maxTokens < 1) {
      return new Error('Invalid maxTokens: must be at least 1')
    }
    if (request.temperature !== undefined && (request.temperature < 0 || request.temperature > 2)) {
      return new Error('Invalid temperature: must be between 0 and 2')
    }
    return null
  }

  const buildRequestBody = (request: LLMRequest): Record<string, unknown> => {
    const messages = truncateContext(
      createContextWindow(request.transcript, config.contextWindow),
      request.maxTokens || config.maxTokens
    )

    return {
      model: config.model,
      messages,
      max_tokens: request.maxTokens || config.maxTokens,
      temperature: request.temperature ?? config.temperature,
      response_format: { type: 'json_object' }
    }
  }

  const parseOpenAIResponse = (response: OpenAIResponse): LLMResponse | LLMError => {
    if (response.error) {
      return {
        message: response.error.message,
        code: response.error.code,
        details: response
      }
    }

    if (!response.choices || response.choices.length === 0) {
      return {
        message: 'No choices returned from LLM',
        code: 'NO_CHOICES',
        details: response
      }
    }

    const choice = response.choices[0]
    const content = choice?.message?.content || ''

    try {
      const parsed = JSON.parse(content) as LLMResponse
      if (parsed.action && (parsed.action === 'followup' || parsed.action === 'submit')) {
        return parsed
      }
    } catch {
      return {
        message: 'Failed to parse LLM response as JSON',
        code: 'PARSE_ERROR',
        details: { rawContent: content }
      }
    }

    return {
      message: 'Invalid response format: action must be followup or submit',
      code: 'INVALID_FORMAT',
      details: { rawContent: content }
    }
  }

  const callLLM = async (request: LLMRequest): Promise<LLMResponse | LLMError> => {
    const validationError = validateRequest(request)
    if (validationError) {
      return {
        message: validationError.message,
        code: 'VALIDATION_ERROR'
      }
    }

    const body = buildRequestBody(request)

    try {
      const response = await fetch(config.apiUrl || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': config.apiKey ? `Bearer ${config.apiKey}` : ''
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        return {
          message: `LLM API error: ${response.status} ${response.statusText}`,
          code: 'API_ERROR',
          details: errorText
        }
      }

      const data: OpenAIResponse = (await response.json()) as OpenAIResponse
      return parseOpenAIResponse(data)
    } catch (error) {
      if (error instanceof Error) {
        return {
          message: error.message,
          code: 'NETWORK_ERROR'
        }
      }
      return {
        message: 'Unknown error occurred',
        code: 'UNKNOWN_ERROR'
      }
    }
  }

  return {
    callLLM
  }
}

export const processTranscript = async (transcript: Message[], config?: LLMConfig): Promise<LLMResponse | LLMError> => {
  const client = createLLMClient(config)
  return client.callLLM({ transcript })
}
