import { Elysia } from 'elysia'
import { getConfig, TLLMError, TLLMResponse, type LLMError, type LLMResponse } from './src/llm'
import staticPlugin from '@elysiajs/static'
import { type DataExtractor } from './src/llm/extractor/surveyExtractor'
import { type LLMClient } from './src/llm/openAi'
import { TLLMSubmitRequest } from './src/llm/types'
import type { SurveySpec } from './src/llm/extractor/types'
import { runSurveyPipeline } from './src/services/surveyPipeline'
import { getSurveySpec } from './src/surveys/specs'

export const LLM_CONFIG = getConfig()

export interface LLMClientOptions {
  conversationEngine: LLMClient
  dataExtractor?: DataExtractor
  surveySpec?: SurveySpec
  submitAnswers?: boolean
}

const defaultSurveySpec = getSurveySpec('gad7')
const defaultDataExtractor: DataExtractor = {
  callLLM: async () => ({ action: 'success', content: {} }),
}

const createApp = (options: LLMClientOptions) => {
  const surveySpec = options.surveySpec ?? defaultSurveySpec
  const dataExtractor = options.dataExtractor ?? defaultDataExtractor

  return new Elysia()
    .use(
      staticPlugin({
        assets: 'src/client/',
        prefix: '/',
      }),
    )
    .post(
      '/',
      async ({ body, status }) => {
        const result = await runSurveyPipeline(
          body.transcript,
          body.taskId ?? 'local-task',
          {
            conversationEngine: options.conversationEngine,
            dataExtractor,
            surveySpec,
            submitAnswers: options.submitAnswers,
          }
        )

        if (result.action === 'error') {
          return status(500, result)
        }

        return result
      },
      {
        body: TLLMSubmitRequest,
        response: {
          200: TLLMResponse,
          400: TLLMError,
          500: TLLMError,
        },
      },
    )
}

export default createApp
