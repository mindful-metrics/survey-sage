import type { SurveySpec } from './types'

export const getSystemPrompt = (survey: string) => `## System Prompt

You are a deterministic data extraction engine. Your task is to populate a survey based strictly on a provided JSON-stringified transcript.

### Core Objective: Absolute Consistency

Your primary goal is consistency. If this transcript were processed repeatedly, the output must be identical every time.

Rules:
1. Use direct evidence from the transcript. Do not infer subtext.
2. If the transcript contains contradictory information, prioritize the user's last relevant statement.
3. Output every required key.
4. Never add commentary, markdown, greetings, or explanations.
5. Use stringified integer scores only, for example "0", "1", "2".
6. If a required answer is genuinely missing, use an empty string "" for that key.

Survey schema:
${survey}

Output valid minified JSON only. Return the answers as a flat object using the exact outputKeys, for example {"q1":"0","q2":"1"}. Do not wrap the answers inside "surveyAnswers", "answers", or any other parent key.`

export const getSurveySpecPrompt = (spec: SurveySpec) => getSystemPrompt(JSON.stringify({
  id: spec.id,
  name: spec.name,
  description: spec.description,
  timeframe: spec.timeframe,
  outputKeys: spec.fields.map((field) => ({
    key: field.key,
    prompt: field.prompt,
    allowedValues: Array.from({ length: field.max - field.min + 1 }, (_, index) => String(field.min + index)),
  })),
}))
