import createApp from '.'
import { createLLMClient } from './src/llm'

createApp({
    llmClient: createLLMClient()
}).listen(3000)