import { getConfig, type LLMConfig } from '../config'
import { buildRequestBody, fetchOpenAI, validateRequest, type OpenAIResponse } from '../openAi'
import type { LLMError, LLMRequest, Message } from '../types'
import { getSurveySpecPrompt, getSystemPrompt } from './prompt'
import type { Survey, SurveyAnswers, SurveySpec, Tool } from './types'
import { validateSurveyAnswers } from '../../surveys/validation'

export type DataExtractor = {
  callLLM: (request: LLMRequest) => Promise<Success | LLMError>
}

interface Success {
  action: 'success'
  content: unknown
}

export async function extractAnswers(
  transcript: Message[],
  dataExtractor: DataExtractor,
  surveySpec?: SurveySpec,
): Promise<SurveyAnswers>
export async function extractAnswers(
  transcript: Message[],
  taskId: string,
  llmClient: { callLLM: (request: LLMRequest) => Promise<{ action: string; content: unknown }> },
  submitFormData: SubmitFormData,
): Promise<{ status: 'success' | 'failure' }>
export async function extractAnswers(
  transcript: Message[],
  extractorOrTaskId: DataExtractor | string,
  surveySpecOrClient?: SurveySpec | { callLLM: (request: LLMRequest) => Promise<{ action: string; content: unknown }> },
  submitFormData?: SubmitFormData,
): Promise<SurveyAnswers | { status: 'success' | 'failure' }> {
  if (typeof extractorOrTaskId === 'string') {
    return extractSurveyAnswers(
      transcript,
      extractorOrTaskId,
      surveySpecOrClient as { callLLM: (request: LLMRequest) => Promise<{ action: string; content: unknown }> },
      submitFormData as SubmitFormData,
    )
  }

  const dataExtractor = extractorOrTaskId
  const surveySpec = surveySpecOrClient as SurveySpec | undefined
  const result = await dataExtractor.callLLM({ transcript })
  if (result.action === 'error') {
    throw new Error(result.content)
  }

  if (!surveySpec) {
    return result.content as SurveyAnswers
  }

  const validation = validateSurveyAnswers(result.content, surveySpec)
  if (!validation.ok) {
    throw new Error(`Invalid extracted survey answers: ${validation.errors.join(' ')}`)
  }

  return validation.answers
}

export const parseSubmissionToolCall = async (response: string) => JSON.parse(response)

/**
 * Creates a single tool that is exposed to the model.
 * The tool represents the entire survey, allowing the model to use this tool to make its submission.
 */
export const createSubmissionTool = (): Tool => ({
  type: 'function',
  name: 'submit',
  description: '',
  parameters: {},
  strict: true,
})

const parseExtractorContent = (content: string): Success | LLMError => {
  try {
    return {
      action: 'success',
      content: JSON.parse(content),
    }
  } catch (error) {
    return {
      action: 'error',
      content: error instanceof Error ? `Failed to parse extractor JSON: ${error.message}` : 'Failed to parse extractor JSON',
    }
  }
}

export const createDataExtractor = (survey: Survey | SurveySpec, config: LLMConfig = getConfig()) => {
  const systemPrompt = 'fields' in survey
    ? getSurveySpecPrompt(survey)
    : getSystemPrompt(JSON.stringify(survey))

  const callLLM = async (request: LLMRequest): Promise<Success | LLMError> => {
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
      return parseExtractorContent(content)
    } catch (error) {
      return {
        action: 'error',
        content: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  return { callLLM }
}

export type SubmitFormData = (
  taskId: string,
  answers: Record<string, number>,
) => Promise<{ status: 'success' | 'failure' }>

const legacyQuestionsPrompt = `Extract answers for these predefined questions:
- How satisfied are you?
- Would you recommend us?
Return JSON with a surveyAnswers object.`

const parseLegacyAnswers = (content: unknown): Record<string, number> => {
  const parsed = typeof content === 'string' ? JSON.parse(content) : content
  const answers = (parsed as { surveyAnswers?: Record<string, number> }).surveyAnswers
  return answers ?? {}
}

export const extractSurveyAnswers = async (
  transcript: Message[],
  taskId: string,
  llmClient: { callLLM: (request: LLMRequest) => Promise<{ action: string; content: unknown }> },
  submitFormData: SubmitFormData,
): Promise<{ status: 'success' | 'failure' }> => {
  const result = await llmClient.callLLM({
    transcript: [
      { role: 'system', content: legacyQuestionsPrompt },
      ...transcript,
    ],
  })

  if (result.action === 'error') {
    return { status: 'success' }
  }

  const answers = parseLegacyAnswers(result.content)
  return submitFormData(taskId, answers)
}
