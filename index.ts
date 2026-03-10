import { Elysia } from 'elysia'
import { getConfig, TLLMError, TLLMResponse, type LLMError, type LLMResponse } from './src/llm'
import staticPlugin from '@elysiajs/static'
import { submitFormData } from './src/api/externalApiClient'
import { extractAnswers, type DataExtractor } from './src/llm/extractor/surveyExtractor'
import { processTranscript, type LLMClient } from './src/llm/openAi'
import { TLLMSubmitRequest } from './src/llm/types'
export const LLM_CONFIG = getConfig()

export interface LLMClientOptions {
    conversationEngine: LLMClient
    dataExtractor: DataExtractor
}

const createApp = (options: LLMClientOptions) => {
    const { conversationEngine, dataExtractor } = options;
    return new Elysia()
        .use(
            staticPlugin({
                assets: 'src/client/',
                prefix: '/',
            })
        )
        .post(
            '/',
            async ({ body, status }) => {
                const llmResult: LLMResponse | LLMError = await processTranscript(body.transcript, conversationEngine)

                if (llmResult.action === 'error') {
                    return status(500, llmResult)
                }
                if (llmResult.action === 'submit') {
                    // Handle submission
                    const answers = await extractAnswers(body.transcript, dataExtractor)
                    return {
                        action: "submit",
                        content: "Thank you for your participation!"
                    }
                    // const submit = await submitFormData(body.taskId, answers)
                    // if (submit.status === 'failure') {
                    //     return status(500, {
                    //         action: 'error',
                    //         content: 'Failure on submission',
                    //     })
                    // }
                    // return llmResult
                }

                return llmResult
            },
            {
                body: TLLMSubmitRequest,
                response: {
                    200: TLLMResponse,
                    400: TLLMError,
                    500: TLLMError,
                },
            }
        )
}

export default createApp