import { describe, it, expect, mock } from 'bun:test'
import type { LLMError, LLMRequest, LLMResponse, Message } from './src/llm/types'
import { treaty } from '@elysiajs/eden'
import createApp from '.'

describe('POST / handler', () => {
  describe('valid transcript', () => {
    it('expects followup', async () => {
      const mockClient = {
        callLLM: mock(() =>
          Promise.resolve({ action: 'followup', content: 'Test response' } as LLMResponse)
        ),
      }

      const api = treaty(
        createApp({
          llmClient: mockClient,
        })
      )

      const body = {
        transcript: [{ role: 'user', content: 'Hello' } as Message],
      }

      const result = await api.post(body)

      expect(result.status).toBe(200)
      expect(result.data).toEqual({ action: 'followup', content: 'Test response' })
    })

    it('successful submission', async () => {
      const mockClient = {
        callLLM: mock(() =>
          Promise.resolve({ action: 'submit', content: 'Survey completed' } as LLMResponse)
        ),
      }

      const api = treaty(
        createApp({
          llmClient: mockClient,
        })
      )

      const body = {
        transcript: [{ role: 'user', content: 'Hello' } as Message],
      }

      const result = await api.post(body)

      expect(result.status).toBe(200)
      expect(result.data).toEqual({ action: 'submit', content: 'Survey completed' })
    })
  })

  it('missing transcript field → 400 + error string', async () => {
    const mockClient = {
      callLLM: mock(() =>
        Promise.resolve({ action: 'error', content: 'Missing transcript field' } as LLMError)
      ),
    }

    const app = createApp({
      llmClient: mockClient,
    })

    const response = await app.handle(
      new Request('http://localhost/', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      })
    )

    expect(response.status).toBe(400)

    const json = (await response.json()) as LLMError
    expect(json.action).toBe('error')
    expect(typeof json.content).toBe('string')
  })

  it('empty transcript array → 400 + error string', async () => {
    const mockClient = {
      callLLM: mock(() =>
        Promise.resolve({ action: 'error', content: 'cannot be empty' } as LLMError)
      ),
    }

    const app = createApp({
      llmClient: mockClient,
    })

    const body: unknown = {
      transcript: JSON.stringify([]),
    }

    const response = await app.handle(
      new Request('http://localhost/', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      })
    )

    expect(response.status).toBe(400)

    const json = (await response.json()) as LLMError
    expect(json.action).toBe('error')
    expect(typeof json.content).toBe('string')
  })

  it('invalid JSON → 400 + error string', async () => {
    const mockClient = {
      callLLM: mock(() =>
        Promise.resolve({ action: 'error', content: 'must be valid JSON' } as LLMError)
      ),
    }

    const app = createApp({
      llmClient: mockClient,
    })

    const body: unknown = {
      transcript: 'not valid json',
    }

    const response = await app.handle(
      new Request('http://localhost/', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      })
    )

    expect(response.status).toBe(400)

    const json = (await response.json()) as LLMError
    expect(json.action).toBe('error')
    expect(typeof json.content).toBe('string')
  })

  it('LLM error action → 500 + error string', async () => {
    const mockClient = {
      callLLM: mock(() =>
        Promise.resolve({ action: 'error', content: 'LLM failed' } as LLMError)
      ),
    }

    const app = createApp({
      llmClient: mockClient,
    })

    const body = {
      transcript: [{ role: 'user', content: 'Hello' } as Message],
    }

    const response = await app.handle(
      new Request('http://localhost/', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      })
    )

    expect(response.status).toBe(500)

    const json = (await response.json()) as LLMError
    expect(json.action).toBe('error')
    expect(typeof json.content).toBe('string')
  })
})