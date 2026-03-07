import createApp from '.'
import { createLLMClient } from './src/llm/client'

createApp({
    llmClient: createLLMClient()
}).listen(3000)