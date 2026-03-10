import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { DEFAULT_CONFIG, type Message, createConversationEngine, getConfig, getSystemPrompt, processTranscript, validateConfig } from '../src/llm'

// describe('prompt', () => {
//   describe('getSystemPrompt', () => {
//     it('should return the system prompt string', () => {
//       const prompt = getSystemPrompt()
//       expect(prompt).toBeDefined()
//       expect(prompt).toContain('survey assistant')
//       expect(prompt).toContain('followup')
//       expect(prompt).toContain('submit')
//     })
//   })

//   describe('createContextWindow', () => {
//     it('should prepend system prompt to transcript', () => {
//       const transcript: Message[] = [
//         { role: 'user', content: 'Hello' },
//         { role: 'assistant', content: 'Hi there' }
//       ]
//       const result = createContextWindow(transcript, 10)
//       expect(result.length).toBe(3)
//       expect(result[0].role).toBe('system')
//       expect(result[1]).toBe(transcript[0])
//       expect(result[2]).toBe(transcript[1])
//     })

//     it('should limit transcript to maxTurns', () => {
//       const transcript: Message[] = Array.from({ length: 15 }, (_, i) => ({
//         role: i % 2 === 0 ? 'user' : 'assistant',
//         content: `Message ${i}`
//       }))
//       const result = createContextWindow(transcript, 10)
//       expect(result.length).toBe(11)
//       expect(result[0].role).toBe('system')
//     })
//   })

//   describe('truncateContext', () => {
//     it('should preserve system message if present', () => {
//       const transcript: Message[] = [
//         { role: 'system', content: 'System message' },
//         { role: 'user', content: 'User message' }
//       ]
//       const result = truncateContext(transcript, 4000)
//       expect(result[0].role).toBe('system')
//     })

//     it('should truncate messages when exceeding token limit', () => {
//       const longMessage = 'word '.repeat(55)
//       const transcript: Message[] = [
//         { role: 'system', content: 'System' },
//         { role: 'user', content: 'Short' },
//         { role: 'assistant', content: longMessage }
//       ]
//       const result = truncateContext(transcript, 55)
//       expect(result.length).toBe(2)
//       expect(result[0].role).toBe('system')
//     })

//     it('should handle empty transcript', () => {
//       const result = truncateContext([], 4000)
//       expect(result.length).toBe(0)
//     })
//   })
// })

describe('config', () => {
  beforeEach(() => {
    delete process.env.LLM_API_KEY
    delete process.env.LLM_API_URL
    delete process.env.LLM_MODEL
    delete process.env.LLM_MAX_TOKENS
    delete process.env.LLM_TEMPERATURE
    delete process.env.LLM_CONTEXT_WINDOW
  })

  describe('getConfig', () => {
    it('should return default config when no env vars set', () => {
      const config = getConfig()
      expect(config.apiUrl).toBe(DEFAULT_CONFIG.apiUrl)
      expect(config.model).toBe(DEFAULT_CONFIG.model)
      expect(config.maxTokens).toBe(DEFAULT_CONFIG.maxTokens)
    })

    it('should override with env vars', () => {
      process.env.LLM_API_KEY = 'test-key'
      process.env.LLM_API_URL = 'https://custom.api.com'
      process.env.LLM_MODEL = 'gpt-4'
      process.env.LLM_MAX_TOKENS = '8000'
      process.env.LLM_TEMPERATURE = '0.5'
      process.env.LLM_CONTEXT_WINDOW = '20'

      const config = getConfig()
      expect(config.apiKey).toBe('test-key')
      expect(config.apiUrl).toBe('https://custom.api.com')
      expect(config.model).toBe('gpt-4')
      expect(config.maxTokens).toBe(8000)
      expect(config.temperature).toBe(0.5)
      expect(config.contextWindow).toBe(20)
    })
  })

  describe('validateConfig', () => {
    it('should validate valid config', () => {
      const validConfig = { apiUrl: 'http://api.com', model: 'gpt-3.5-turbo' }
      expect(validateConfig(validConfig)).toBe(true)
    })

    it('should reject config without apiUrl', () => {
      const invalidConfig = { apiUrl: undefined, model: 'gpt-3.5-turbo' }
      expect(validateConfig(invalidConfig)).toBe(false)
    })

    it('should reject config without model', () => {
      const invalidConfig = { apiUrl: 'http://api.com', model: undefined }
      expect(validateConfig(invalidConfig)).toBe(false)
    })

    it('should reject invalid temperature', () => {
      const invalidConfig1 = { apiUrl: 'http://api.com', model: 'gpt-3.5-turbo', temperature: -1 }
      const invalidConfig2 = { apiUrl: 'http://api.com', model: 'gpt-3.5-turbo', temperature: 3 }
      expect(validateConfig(invalidConfig1)).toBe(false)
      expect(validateConfig(invalidConfig2)).toBe(false)
    })

    it('should reject invalid maxTokens', () => {
      const invalidConfig = { apiUrl: 'http://api.com', model: 'gpt-3.5-turbo', maxTokens: 0 }
      expect(validateConfig(invalidConfig)).toBe(false)
    })

    it('should reject invalid contextWindow', () => {
      const invalidConfig = { apiUrl: 'http://api.com', model: 'gpt-3.5-turbo', contextWindow: 0 }
      expect(validateConfig(invalidConfig)).toBe(false)
    })
  })
})

describe('client', () => {
  describe('createConversationEngine', () => {
    it('should create a client with default config', () => {
      const client = createConversationEngine()
      expect(client).toBeDefined()
      expect(typeof client.callLLM).toBe('function')
    })

    it('should create a client with custom config', () => {
      const customConfig = {
        apiUrl: 'http://custom.api.com',
        model: 'gpt-4',
        maxTokens: 8000
      }
      const client = createConversationEngine(customConfig)
      expect(client).toBeDefined()
    })
  })

  describe('callLLM', () => {
    it('should error on request with empty transcript', async () => {
      const client = createConversationEngine()
      const result = await client.callLLM({ transcript: [] })
      expect(result).toHaveProperty('action', 'error')
    })

    it('should error on request with invalid transcript', async () => {
      const client = createConversationEngine()
      const result = await client.callLLM({ transcript: null as unknown as Message[] })
      expect(result).toHaveProperty('action', 'error')
    })

    it('should handle JSON parse errors', async () => {
      const mockFetch = mock((url: string, init: RequestInit) => {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({
            choices: [{
              message: { content: 'not a json object' }
            }]
          })
        } as Response)
      })
      const originalFetch = global.fetch
      global.fetch = mockFetch

      const client = createConversationEngine()
      const result = await client.callLLM({ transcript: [{ role: 'user', content: 'Hello' }] })
      expect(result).toHaveProperty('action', 'error')

      global.fetch = originalFetch
    })

    it('should handle invalid action in response', async () => {
      const mockFetch = mock((url: string, init: RequestInit) => {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({
            choices: [{
              message: {
                content: JSON.stringify({ action: 'invalid', content: 'test' })
              }
            }]
          })
        } as Response)
      })
      const originalFetch = global.fetch
      global.fetch = mockFetch

      const client = createConversationEngine()
      const result = await client.callLLM({ transcript: [{ role: 'user', content: 'Hello' }] })
      expect(result).toHaveProperty('action', 'error')

      global.fetch = originalFetch
    })
  })

  describe('processTranscript', () => {
    it('should process transcript with valid response', async () => {
      const mockFetch = mock((url: string, init: RequestInit) => {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({
            choices: [{
              message: {
                content: JSON.stringify({ action: 'followup', content: 'test' })
              }
            }]
          })
        } as Response)
      })
      const originalFetch = global.fetch
      global.fetch = mockFetch

      const result = await processTranscript([
        { role: 'user', content: 'Hello' }
      ], createConversationEngine())

      expect(result).toBeDefined()
      expect(result.action).toBe('followup')
      expect(result.content).toBe('test')

      global.fetch = originalFetch
    })
  })
})
