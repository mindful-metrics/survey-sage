import createApp from '.'
import { createConversationEngine } from './src/llm/'

createApp({
    createConversationEngine: createConversationEngine()
}).listen(3000)