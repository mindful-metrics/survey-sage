import { Elysia, file, t } from 'elysia'
import { DEFAULT_CONFIG, type LLMConfig } from './src/llm/config'
import { TLLMRequest, type LLMError, type LLMRequest, type LLMResponse } from './src/llm/types'
import { constants } from 'node:http2'
import type { LLMClientOptions } from './src/llm/client'
import client from './src/client/index.html'
import staticPlugin from '@elysiajs/static'

export const LLM_CONFIG = DEFAULT_CONFIG

const createApp = (llmClient: LLMClientOptions) => {
    return new Elysia()
        .use(staticPlugin({
            assets: 'src/client/',
            prefix: '/'
        }))
        .post('/', async ({ body, status }) => {
            return status(constants.HTTP_STATUS_OK)
        }, {
            body: TLLMRequest,
        })
}


export default createApp
