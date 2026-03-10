import createApp from '.'
import { createConversationEngine } from './src/llm/'

createApp({
    conversationEngine: createConversationEngine()
}).listen(3000)