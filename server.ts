import createApp from '.'
import { createConversationEngine, createDataExtractor } from './src/llm/'
import survey from './surveys/GAD.json'
createApp({
    conversationEngine: createConversationEngine(),
    dataExtractor: createDataExtractor(survey)
}).listen(3000)