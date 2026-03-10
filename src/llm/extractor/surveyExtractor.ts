import { getConfig, validateConfig } from '../config'
import type { Message } from '../types'
import type { Schema, Tool } from './types'

// interface Question {
//   prompt: string
//   acceptableAnswer: string
// }


export const extractAnswers = async (transcript: Message[], dataExtractor: DataExtractor): Promise<Record<string, string>> => {

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

export const createDataExtractor = ({
  config = getConfig()
}) => {
  if (!validateConfig(config)) {
    throw new Error('Invalid config')
  }

  const callLLM = () => {

  }

  return {
    callLLM
  }
}