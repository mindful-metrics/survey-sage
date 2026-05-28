import { getConfig, type LLMConfig } from '../config'
import { buildRequestBody, fetchOpenAI, normalizeOpenAIContent, validateRequest, type OpenAIResponse } from '../openAi'
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

export type SubmitFormData = (
  taskId: string,
  answers: Record<string, string | number>,
) => Promise<{ status: 'success' | 'failure' }>

export type LegacySubmitFormData = (
  taskId: string,
  answers: Record<string, number>,
) => Promise<{ status: 'success' | 'failure' }>

export async function extractAnswers(
  transcript: Message[],
  dataExtractor: DataExtractor,
  surveySpec?: SurveySpec,
): Promise<SurveyAnswers>

export async function extractAnswers(
  transcript: Message[],
  taskId: string,
  llmClient: { callLLM: (request: LLMRequest) => Promise<{ action: string; content: unknown }> },
  submitFormData: LegacySubmitFormData,
): Promise<{ status: 'success' | 'failure' }>

export async function extractAnswers(
  transcript: Message[],
  extractorOrTaskId: DataExtractor | string,
  surveySpecOrClient?: SurveySpec | { callLLM: (request: LLMRequest) => Promise<{ action: string; content: unknown }> },
  submitFormData?: SubmitFormData | LegacySubmitFormData,
): Promise<SurveyAnswers | { status: 'success' | 'failure' }> {
  if (typeof extractorOrTaskId === 'string') {
    return extractSurveyAnswers(
      transcript,
      extractorOrTaskId,
      surveySpecOrClient as { callLLM: (request: LLMRequest) => Promise<{ action: string; content: unknown }> },
      submitFormData as LegacySubmitFormData,
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
export const createSubmissionTool = (surveySpec?: SurveySpec): Tool => {
  const properties: Record<string, unknown> = {}
  const required: string[] = []

  if (surveySpec) {
    for (const field of surveySpec.fields) {
      properties[field.key] = {
        type: 'string',
        description: `${field.prompt} Integer score from ${field.min} to ${field.max}.`,
      }

      if (field.required !== false) {
        required.push(field.key)
      }
    }
  }

  return {
    type: 'function',
    name: 'submit',
    description: 'Submit completed survey answers.',
    parameters: {
      type: 'object',
      properties,
      required,
      additionalProperties: false,
    },
    strict: true,
  }
}

const unwrapExtractorAnswers = (parsed: unknown): unknown => {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return parsed
  }

  const object = parsed as Record<string, unknown>

  if (object.surveyAnswers && typeof object.surveyAnswers === 'object') {
    return object.surveyAnswers
  }

  if (object.answers && typeof object.answers === 'object') {
    return object.answers
  }

  return parsed
}

const parseExtractorContent = (content: string): Success | LLMError => {
  try {
    const parsed = JSON.parse(content)

    return {
      action: 'success',
      content: unwrapExtractorAnswers(parsed),
    }
  } catch (error) {
    return {
      action: 'error',
      content: error instanceof Error ? `Failed to parse extractor JSON: ${error.message}` : 'Failed to parse extractor JSON',
    }
  }
}

export const createDataExtractor = (survey: Survey | SurveySpec, config: LLMConfig = getConfig()): DataExtractor => {
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

      const content = normalizeOpenAIContent(data.choices[0]?.message?.content)
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

const legacyQuestionsPrompt = `Extract answers for these predefined questions:
- How satisfied are you?
- Would you recommend us?

Return JSON with this exact shape:
{
  "surveyAnswers": {
    "How satisfied are you?": 5,
    "Would you recommend us?": 10
  }
}`

const parseLegacyAnswers = (content: unknown): Record<string, number> => {
  const parsed = typeof content === 'string' ? JSON.parse(content) : content
  const answers = (parsed as { surveyAnswers?: Record<string, number> }).surveyAnswers
  return answers ?? {}
}

export const extractSurveyAnswers = async (
  transcript: Message[],
  taskId: string,
  llmClient: { callLLM: (request: LLMRequest) => Promise<{ action: string; content: unknown }> },
  submitFormData: LegacySubmitFormData,
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
