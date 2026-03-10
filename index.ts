import { Elysia } from 'elysia'
import { getConfig, processTranscript, type LLMClientOptions, TLLMError, TLLMRequest, TLLMResponse, type LLMError, type LLMResponse } from './src/llm'
import staticPlugin from '@elysiajs/static'

export const LLM_CONFIG = getConfig()

const createApp = (options: LLMClientOptions) => {
    const { createConversationEngine: llmClient } = options;
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

                const llmResult: LLMResponse | LLMError = await processTranscript(body.transcript, llmClient)

                if (llmResult.action === 'error') {
                    return status(500, llmResult)
                }
                if (llmResult.action === 'submit') {
                    // Handle submission
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