import { Elysia, t } from 'elysia'
import { DEFAULT_CONFIG, type LLMConfig } from './src/llm/config'
import { TLLMRequest, type LLMError, type LLMRequest, type LLMResponse } from './src/llm/types'
import { constants } from 'node:http2'
import type { LLMClientOptions } from './src/llm/client'

export const LLM_CONFIG = DEFAULT_CONFIG

const app = (llmClient: LLMClientOptions) => {
    return new Elysia()
        .get('/', 'hello')
        .post('/', async ({ body, status }) => {
            return status(constants.HTTP_STATUS_OK)
        }, {
            body: TLLMRequest,
        })
        .listen(3000)
}


export default app
