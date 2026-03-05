import { describe, it, expect, mock, beforeAll } from 'bun:test'
import type { LLMError, LLMRequest, LLMResponse, Message } from './src/llm/types'
import { treaty } from '@elysiajs/eden'
import app from '.'

describe('POST / handler', () => {
  describe('valid transcript', () => {
    it('expects followup', async () => {
      const mockClient = {
        callLLM: mock(() => Promise.resolve({ action: 'followup', content: 'Test response' } as LLMResponse))
      }
      const api = treaty(app({
        llmClient: mockClient
      }))
      const body = {
        transcript: [{ role: 'user', content: 'Hello' } as Message]
      }

      const result = await api.post(body)
      expect(result.status).toBe(200)
      expect(result.data).toEqual({ action: 'followup', content: 'Test response' })
    })

    it('successful submission', async () => {
      const mockClient = {
        callLLM: mock(() => Promise.resolve({ action: 'submit', content: 'Survey completed' } as LLMResponse))
      }
      const api = treaty(app({
        llmClient: mockClient
      }))
      const body = {
        transcript: [{ role: 'user', content: 'Hello' } as Message]
      }

      const result = await api.post(body)
      expect(result.status).toBe(200)
      expect(result.data).toEqual({ action: 'submit', content: 'Survey completed' })

    })
  })

  it('missing transcript field → 400 + error string', async () => {
    const mockClient = {
      callLLM: mock(() => Promise.resolve({ action: 'error', content: 'Missing transcript field' } as LLMError))
    }
    const api = treaty(app({
      llmClient: mockClient
    }))
    const body = {}
    const result = await api.post(body as LLMRequest)
    expect(result.status).toBe(400)
    expect(result.data).toContain('Missing transcript field')
  })

  it('empty transcript array → 400 + error string', async () => {
    const mockClient = {
      callLLM: mock(() => Promise.resolve({ action: 'error', content: 'cannot be empty' } as LLMError))
    }
    const api = treaty(app({
      llmClient: mockClient
    }))
    const body: unknown = {
      transcript: JSON.stringify([])
    }

    const result = await api.post(body as LLMRequest)

    expect(result.status).toBe(400)
    expect(result.data).toContain('cannot be empty')
  })

  it('invalid JSON → 400 + error string', async () => {
    const mockClient = {
      callLLM: mock(() => Promise.resolve({ action: 'error', content: 'must be valid JSON' } as LLMError))
    }
    const api = treaty(app({
      llmClient: mockClient
    }))
    const body: unknown = {
      transcript: 'not valid json'
    }
    const result = await api.post(body as LLMRequest)

    expect(result.status).toBe(400)
    expect(result.data).toContain('must be valid JSON')
  })

  it('LLM error action → 500 + error string', async () => {
    const mockClient = {
      callLLM: mock(() => Promise.resolve({ action: 'error', content: 'LLM failed' } as LLMError))
    }
    const api = treaty(app({
      llmClient: mockClient
    }))
    const body = {
      transcript: [{ role: 'user', content: 'Hello' } as Message]
    }

    const result = await api.post(body)

    expect(result.status).toBe(500)
    expect(result.data).toContain('LLM failed')
  })
})
