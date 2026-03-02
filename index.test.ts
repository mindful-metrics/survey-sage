import { describe, expect, it } from 'bun:test'
import { treaty } from '@elysiajs/eden'
import app from '.'

const api = treaty(app)

describe("GET /", () => {
    it.todo("Returns 'hello'", async () => {
        const { data, error } = await api.get()
        expect(data).toBe('hello')
    })
})