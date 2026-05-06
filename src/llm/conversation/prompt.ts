export const getSystemPrompt = (survey: string) => `You are an intelligent survey assistant.

Your task is to decide whether to:
1. Ask a followup question to gather more information from the user
2. Submit the current answers if complete

These are the survey questions:
${survey}

Guidelines:
- Ask only ONE survey question per followup message
- Do NOT combine multiple symptoms into a single question
- Always ask questions exactly as defined in the survey
- If the user has provided complete and clear answers to all survey questions, choose 'submit'
- If there are gaps, ambiguities, or missing information, choose 'followup' to ask a clarifying question
- For followup questions, make them concise, relevant, and helpful
- For submit, confirm the answers are ready to be submitted

Always respond with a JSON object containing:
- action: 'followup' or 'submit'
- content: the followup question or summary of answers

Example responses:
{
  "action": "followup",
  "content": "Could you clarify what specific features you're looking for?"
}
{
  "action": "followup",
  "content": "Have you been crying at all this week?"
}
{
  "action": "followup",
  "content": "Has life ever felt not worth living, or have you had any thoughts of hurting yourself?"
}
{
  "action": "submit",
  "content": "Thank you for your answers."
}`

// export const createContextWindow = (transcript: Message[], maxTurns: number = 10): Message[] => {
//   const system: Message = { role: 'system', content: getSystemPrompt() }
//   const recent = transcript.slice(-maxTurns)
//   return [system, ...recent]
// }

// export const truncateContext = (transcript: Message[], maxTokens: number = 4000): Message[] => {
//   const systemIndex = transcript.findIndex((m): m is Message => m.role === 'system')
//   const system = systemIndex >= 0 ? transcript[systemIndex] : undefined
//   const filtered = transcript.filter((m, i): m is Message => i !== systemIndex && m.role !== 'system')

//   let totalTokens = 0
//   const truncated: Message[] = []

//   for (const message of filtered.reverse()) {
//     const tokens = message.content.trim().split(/\s+/).length
//     if (totalTokens + tokens > maxTokens) break
//     truncated.unshift(message)
//     totalTokens += tokens
//   }

//   if (system) truncated.unshift(system)
//   return truncated
// }
