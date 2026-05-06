import { submitFormData } from "../api/externalApiClient";
import { extractAnswers, type DataExtractor } from "../llm/extractor/surveyExtractor";
import { processTranscript, type LLMClient } from "../llm/openAi";
import type { LLMError, LLMResponse, Message } from "../llm/types";
import type { SurveyAnswers, SurveySpec } from "../llm/extractor/types"

export type SurveyPipelineOptions = {
  conversationEngine: LLMClient
  dataExtractor: DataExtractor
  surveySpec: SurveySpec
  submitAnswers?: boolean
}

export type SurveyPipelineSuccess = LLMResponse & {
  answers?: SurveyAnswers
}

export type SurveyPipelineResult = SurveyPipelineSuccess | LLMError

const toError = (content: string): LLMError => ({ action: 'error', content })

export const runSurveyPipeline = async (
  transcript: Message[],
  taskId: string,
  options: SurveyPipelineOptions,
): Promise<SurveyPipelineResult> => {
  const llmResult = await processTranscript(transcript, options.conversationEngine)

  if (llmResult.action === 'error') {
    return llmResult
  }

  if (llmResult.action !== 'submit') {
    return llmResult
  }

  let answers: SurveyAnswers
  try {
    answers = await extractAnswers(transcript, options.dataExtractor, options.surveySpec)
  } catch (error) {
    return toError(error instanceof Error ? error.message : 'Internal server error while processing responses')
  }

  if (options.submitAnswers) {
    const submission = await submitFormData(taskId, answers)
    if (submission.status === 'failure') {
      return toError('Failure on submission')
    }
  }

  return {
    action: 'submit',
    content: 'Thank you for your participation!',
    answers,
  }
}