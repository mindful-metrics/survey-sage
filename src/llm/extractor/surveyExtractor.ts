import { getConfig, validateConfig, type LLMConfig } from '../config'
import type { Message } from '../types'
import { getSystemPrompt } from './prompt'
import type { Survey, Tool } from './types'

interface DataExtractor {
  callLLM
}

export const extractAnswers = async (transcript: Message[], dataExtractor: DataExtractor): Promise<Record<string, string>> => {
  dataExtractor.callLLM()
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

interface DataExtractorParams {
  config?: LLMConfig
  survey: Survey
}
export const createDataExtractor = ({
  config = getConfig(),
  survey
}: DataExtractorParams) => {
  if (!validateConfig(config)) {
    throw new Error('Invalid config')
  }

  const callLLM = (transcript, systemPrompt = getSystemPrompt()) => {
    const transcript = [
      {
        role: 'system',
        content: systemPrompt,
      },

    ]
  }

  return {
    callLLM
  }
}