import { Elysia } from 'elysia'
import { getConfig, processTranscript, type LLMClientOptions, TLLMError, TLLMRequest, TLLMResponse, type LLMError, type LLMResponse } from './src/llm'
import staticPlugin from '@elysiajs/static'
import { submitFormData } from './src/api/externalApiClient'
import { createDataExtractor, extractAnswers } from './src/llm/extractor/surveyExtractor'
import survey from './surveys/GAD.json'
export const LLM_CONFIG = getConfig()

const createApp = (options: LLMClientOptions) => {
    const { conversationEngine } = options;
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
                    const dataExtractor = createDataExtractor({
                        // Hardcoded for now
                        survey: survey
                    })
                    const answers = await extractAnswers(body.transcript, dataExtractor)
                    const submit = await submitFormData(body.taskId, answers)
                    if (submit.status === 'failure') {
                        return status(500, {
                            action: 'error',
                            content: 'Failure on submission',
                        })
                    }
                    return llmResult
                }

                return llmResult
            },
            {
                body: TLLMRequest,
                response: {
                    200: TLLMResponse,
                    400: TLLMError,
                    500: TLLMError,
                },
            }
        )
}

export default createApp