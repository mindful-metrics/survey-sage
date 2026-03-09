import type { LLMConfig } from './config.js'
import type { Message, LLMRequest, LLMResponse, LLMError } from './types.js'
import { createContextWindow, truncateContext } from './prompt.js'
import { getConfig, validateConfig } from './config.js'

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

export interface LLMClientOptions {
  llmClient: {
    callLLM: (request: LLMRequest) => Promise<LLMResponse | LLMError>
  },
}

export const createLLMClient = (config: LLMConfig = getConfig()) => {
  if (!validateConfig(config)) {
    throw new Error("Invalid config")
  }

  const validateRequest = (request: LLMRequest): Error | null => {
    if (!request.transcript || !Array.isArray(request.transcript)) {
      return new Error('Invalid transcript: must be an array of messages')
    }
    if (request.transcript.length === 0) {
      return new Error('Invalid transcript: cannot be empty')
    }
    return null
  }

  const buildRequestBody = (request: LLMRequest): Record<string, unknown> => {
    const messages = truncateContext(
      createContextWindow(request.transcript, config.contextWindow), config.maxTokens
    )

    return {
      model: config.model,
      messages,
      max_tokens: config.maxTokens,
      temperature: config.temperature
    }
  }

  const parseOpenAIResponse = (response: OpenAIResponse): LLMResponse | LLMError => {
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

    const choice = response.choices[0]
    const content = choice?.message?.content || ''

    try {
      const parsed = JSON.parse(content) as LLMResponse
      if (parsed.action && (parsed.action === 'followup' || parsed.action === 'submit')) {
        return parsed
      }
    } catch {
      return {
        action: 'error',
        content: 'Failed to parse LLM response as JSON',
      }
    }

    return {
      action: 'error',
      content: 'Invalid response format: action must be followup or submit',
    }
  }

  const callLLM = async (request: LLMRequest): Promise<LLMResponse | LLMError> => {
    const validationError = validateRequest(request)
    if (validationError) {
      return {
        action: 'error',
        content: validationError.message,
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

interface LLMClient {
  callLLM: (request: LLMRequest) => Promise<LLMResponse | LLMError>
}

export const processTranscript = async (transcript: Message[], client: LLMClient): Promise<LLMResponse | LLMError> => {
  return client.callLLM({ transcript })
}
