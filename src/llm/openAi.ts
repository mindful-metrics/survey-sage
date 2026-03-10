import type { LLMConfig } from "./config"
import type { LLMError, LLMRequest, LLMResponse, OpenAIResponse } from "./types"

export const validateRequest = (request: LLMRequest): Error | null => {
    if (!request.transcript || !Array.isArray(request.transcript)) {
        return new Error('Invalid transcript: must be an array of messages')
    }
    if (request.transcript.length === 0) {
        return new Error('Invalid transcript: cannot be empty')
    }
    return null
}

export const buildRequestBody = (config: LLMConfig, request: LLMRequest): Record<string, unknown> => {
    const messages = [...request.transcript]

    return {
        model: config.model,
        messages,
        max_tokens: config.maxTokens,
        temperature: config.temperature
    }
}

export const parseOpenAIResponse = (response: OpenAIResponse): LLMResponse | LLMError => {
    if (response.error) {
        return {
            action: 'error',
            content: response.error.message,
        }
    }

    if (!response.choices || response.choices.length === 0) {
        return {
            action: 'error',
            content: 'No choices returned from LLM',
        }
    }

    const choice = response.choices[0]
    const content = choice?.message?.content || ''

    try {
        const parsed = JSON.parse(content)
        if (parsed.action && (parsed.action === 'followup' || parsed.action === 'submit')) {
            return parsed
        }
    } catch {
        return {
            action: 'error',
            content: 'Failed to parse LLM response as JSON',
        }
    }

    return {
        action: 'error',
        content: 'Invalid response format: action must be followup or submit',
    }
}
