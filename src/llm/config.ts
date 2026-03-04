export interface LLMConfig {
  apiKey?: string
  apiUrl?: string
  model?: string
  maxTokens?: number
  temperature?: number
  contextWindow?: number
}

export const DEFAULT_CONFIG: LLMConfig = {
  apiUrl: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-3.5-turbo',
  maxTokens: 4000,
  temperature: 0.7,
  contextWindow: 10
}

export const getConfig = (): LLMConfig => {
  const envKey = Bun.env.LLM_API_KEY
  const envUrl = Bun.env.LLM_API_URL
  const envModel = Bun.env.LLM_MODEL
  const envMaxTokens = Bun.env.LLM_MAX_TOKENS
  const envTemperature = Bun.env.LLM_TEMPERATURE
  const envContextWindow = Bun.env.LLM_CONTEXT_WINDOW

  return {
    apiKey: envKey || DEFAULT_CONFIG.apiKey,
    apiUrl: envUrl || DEFAULT_CONFIG.apiUrl,
    model: envModel || DEFAULT_CONFIG.model,
    maxTokens: envMaxTokens ? parseInt(envMaxTokens, 10) : DEFAULT_CONFIG.maxTokens,
    temperature: envTemperature ? parseFloat(envTemperature) : DEFAULT_CONFIG.temperature,
    contextWindow: envContextWindow ? parseInt(envContextWindow, 10) : DEFAULT_CONFIG.contextWindow
  }
}

export const validateConfig = (config: LLMConfig): boolean => {
  if (!config.apiUrl) return false
  if (!config.model) return false
  if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) return false
  if (config.maxTokens !== undefined && config.maxTokens < 1) return false
  if (config.contextWindow !== undefined && config.contextWindow < 1) return false
  return true
}
