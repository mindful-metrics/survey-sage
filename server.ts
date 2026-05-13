import createApp from '.'
import { createConversationEngine, createDataExtractor } from './src/llm/'
import { getSurveySpec } from './src/surveys/specs'

const surveySpec = getSurveySpec(Bun.env.SURVEY_ID || 'gad7')

createApp({
  conversationEngine: createConversationEngine(undefined, surveySpec),
  dataExtractor: createDataExtractor(surveySpec),
  surveySpec,
  submitAnswers: Bun.env.SUBMIT_ANSWERS === 'true',
}).listen(3000)

console.log(`Survey Sage server running on http://localhost:3000 using survey ${surveySpec.id}`)