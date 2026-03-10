import { getConfig, validateConfig, type LLMConfig } from '../config'
import type { LLMRequest, LLMResponse, LLMError, Message, OpenAIResponse } from '../types'
import { getSystemPrompt } from './prompt'
import { buildRequestBody, parseOpenAIResponse, validateRequest } from '../openAi'


interface LLMClient {
  callLLM: (request: LLMRequest) => Promise<LLMResponse | LLMError>
}

export interface LLMClientOptions {
  conversationEngine: LLMClient
}

export const createLLMClient = (config: LLMConfig = getConfig()): LLMClient => {
  if (!validateConfig(config)) {
    throw new Error("Invalid config")
  }



  const callLLM = async (request: LLMRequest, systemPrompt = getSystemPrompt()): Promise<LLMResponse | LLMError> => {
    const validationError = validateRequest(request)
    if (validationError) {
      return {
        action: 'error',
        content: validationError.message,
      }
    }

    request.transcript = [
      {
        role: 'system',
        content: systemPrompt,
      }, ...request.transcript
    ]

    const body = buildRequestBody(config, request)

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


export const processTranscript = async (transcript: Message[], client: LLMClient): Promise<LLMResponse | LLMError> => {
  return client.callLLM({ transcript })
}
