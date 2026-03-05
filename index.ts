import { Elysia, t } from 'elysia'
import { DEFAULT_CONFIG, type LLMConfig } from './src/llm/config'
import { createLLMClient } from './src/llm/client'
import { TLLMRequest, type LLMError, type LLMRequest, type LLMResponse } from './src/llm/types'
import { constants } from 'node:http2'

export const LLM_CONFIG = DEFAULT_CONFIG

const app = (llmClient: { llmClient: { callLLM: (request: LLMRequest) => Promise<LLMResponse | LLMError> } }) => {
    return new Elysia()
        .get('/', 'hello')
        .post('/', async ({ body, status }) => {
            return status(constants.HTTP_STATUS_OK)
            const llmClient = createLLMClient(LLM_CONFIG);
            // // if (!body || typeof body !== 'object') {
            // //     return new Response('Missing transcript field', { status: 400 })
            // // }

            // const transcriptData = 'transcript' in body ? body.transcript : undefined
            // if (transcriptData === undefined) {
            //     return new Response('Missing transcript field', { status: 400 })
            // }

            // let transcript: unknown
            // if (typeof transcriptData === 'string') {
            //     try {
            //         transcript = JSON.parse(transcriptData)
            //     } catch {
            //         return new Response('Invalid transcript: must be valid JSON', { status: 400 })
            //     }
            // } else {
            //     transcript = transcriptData
            // }

            // if (!Array.isArray(transcript)) {
            //     return new Response('Invalid transcript: must be an array', { status: 400 })
            // }

            // if (transcript.length === 0) {
            //     return new Response('Invalid transcript: cannot be empty', { status: 400 })
            // }

            // const result = await llmClient.callLLM({
            //     transcript
            // })

            // if (result.action === "error") {
            //     return new Response(result.content, { status: 500 })
            // }

            // return result
        }, {
            body: TLLMRequest,
        })
        .listen(3000)
}


export default app
