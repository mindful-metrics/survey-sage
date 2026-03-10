import { test, expect, mock, describe, beforeAll, afterAll, it } from 'bun:test'
import { submitFormData } from '../src/api/externalApiClient'

describe('Integration tests for health app endpoints', () => {
  describe('submitFormData', () => {
    describe('Success cases', () => {
      let originalFetch: typeof fetch

      beforeAll(() => {
        originalFetch = globalThis.fetch
        globalThis.fetch = mock((url: string, config: any) => {
          expect(url).toBe('/tasks/task123/')
          expect(config.method).toBe('POST')
          expect(config.body).toBeInstanceOf(FormData)

          return Promise.resolve({
            json: () => Promise.resolve({ status: 'success' }),
          })
        })
      })

      afterAll(() => {
        globalThis.fetch = originalFetch
      })

      it('returns success for valid taskId and answers', async () => {
        const result = await submitFormData('task123', { '1': '5', '2': '3' })

        expect(result).toEqual({ status: 'success' })
        expect(fetch).toHaveBeenCalledTimes(1)
      })
    })
    describe('Failure cases', () => {
      let originalFetch: typeof fetch

      beforeAll(() => {
        originalFetch = globalThis.fetch
      })

      afterAll(() => {
        globalThis.fetch = originalFetch
      })

      test('returns failure for invalid taskId', async () => {
        const fetchMock = mock((url: string, config: any) => {
          return Promise.resolve({
            json: () => Promise.resolve({ status: 'failure' }),
          })
        })

        globalThis.fetch = fetchMock

        const result = await submitFormData('', { '1': '5' })

        expect(result).toEqual({ status: 'failure' })
      })

      test('returns failure for empty answers', async () => {
        const fetchMock = mock((url: string, config: any) => {
          return Promise.resolve({
            json: () => Promise.resolve({ status: 'failure' }),
          })
        })

        globalThis.fetch = fetchMock

        const result = await submitFormData('task456', {})

        expect(result).toEqual({ status: 'failure' })
      })
    })
  })
})