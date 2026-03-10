import { getConfig, type LLMConfig } from '../config'
import { buildRequestBody, fetchOpenAI, validateRequest, type LLMClient, type OpenAIResponse } from '../openAi'
import type { LLMError, LLMRequest, Message } from '../types'
import { getSystemPrompt } from './prompt'
import type { Survey, Tool } from './types'

export type DataExtractor = {
  callLLM: (request: LLMRequest) => Promise<Success | LLMError>
}
interface Success {
  action: 'success',
  content: unknown,
}

export const extractAnswers = async (transcript: Message[], dataExtractor: DataExtractor): Promise<Record<string, string>> => {
  const result = await dataExtractor.callLLM({ transcript })
  if (result.action === 'error') {
    throw new Error('Internal server error while processing responses')
  }
  return result.content
}

export const parseSubmissionToolCall = async (response: string) => {
  const toolCall = JSON.parse(response)

}

/**
 * Creates a single tool that is exposed to the model
 * The tool represents the entire survey, allowing the model to use this tool to make its submission
 */
export const createSubmissionTool = (): Tool => {
  return {
    type: 'function',
    name: 'submit',
    description: '',
    parameters: {},
    strict: true,
  }
}

export const createDataExtractor = (survey: Survey, config: LLMConfig = getConfig()) => {
  const callLLM = async (request: LLMRequest): Promise<Success | LLMError> => {
    const validationError = validateRequest(request)
    if (validationError) {
      return {
        action: 'error',
        content: validationError.message,
      }
    }

    const body = buildRequestBody(config, request, getSystemPrompt(JSON.stringify(survey)))

    try {
      const response = await fetchOpenAI(config, body)


      if (!response.ok) {
        return {
          action: 'error',
          content: `LLM API error: ${response.status} ${response.statusText}`,
        }
      }
      const data = (await response.json()) as OpenAIResponse

      if (data.error) {
        return {
          action: 'error',
          content: data.error.message,
        }
      }

      if (!data.choices || data.choices.length === 0) {
        return {
          action: 'error',
          content: 'No choices returned from LLM',
        }
      }

      const choice = data.choices[0]
      const content = choice?.message?.content || ''
      const parsed = JSON.parse(content)
      return {
        action: 'success',
        content: parsed,
      }
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