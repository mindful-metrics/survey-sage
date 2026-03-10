import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { extractAnswers, extractSurveyAnswers } from '../src/llm/extractor/surveyExtractor'
import type { Message } from '../src/llm/types'

describe('surveyExtractor', () => {
  it('should extract survey answers from transcript using LLM', async () => {
    let submitFormDataCalled = false
    let submitFormDataTaskId: string | undefined
    let submitFormDataAnswers: Record<string, number> | undefined

    const mockLlmClient = {
      callLLM: mock(async (request: { transcript: Message[] }) => {
        return {
          action: 'submit' as const,
          content: JSON.stringify({
            surveyAnswers: {
              'How satisfied are you?': 5,
              'Would you recommend us?': 10
            }
          })
        }
      })
    }

    const mockSubmitFormData = async (taskId: string, answers: Record<string, number>) => {
      submitFormDataCalled = true
      submitFormDataTaskId = taskId
      submitFormDataAnswers = answers
      return { status: 'success' as const }
    }

    const transcript: Message[] = [
      { role: 'user', content: 'I am very satisfied with the service' },
      { role: 'assistant', content: 'On a scale of 1-10, how satisfied are you?' },
      { role: 'user', content: 'I would rate it a 5 out of 5' },
      { role: 'assistant', content: 'Would you recommend us to others?' },
      { role: 'user', content: 'Yes, definitely a 10 out of 10' }
    ]
    const taskId = 'task-123'

    const result = await extractAnswers(transcript, taskId, mockLlmClient, mockSubmitFormData)

    expect(result).toEqual({ status: 'success' })
    expect(mockLlmClient.callLLM).toHaveBeenCalledTimes(1)
    expect(submitFormDataCalled).toBe(true)
    expect(submitFormDataTaskId).toBe(taskId)
    expect(submitFormDataAnswers).toEqual({
      'How satisfied are you?': 5,
      'Would you recommend us?': 10
    })
  })

  it('should handle empty transcript', async () => {
    let submitFormDataCalled = false

    const mockLlmClient = {
      callLLM: mock(async (request: { transcript: Message[] }) => {
        return {
          action: 'submit' as const,
          content: JSON.stringify({
            surveyAnswers: {
              'How satisfied are you?': 5,
              'Would you recommend us?': 10
            }
          })
        }
      })
    }

    const mockSubmitFormData = async (_taskId: string, _answers: Record<string, number>) => {
      submitFormDataCalled = true
      return { status: 'success' as const }
    }

    const transcript: Message[] = []
    const taskId = 'task-456'

    const result = await extractSurveyAnswers(transcript, taskId, mockLlmClient, mockSubmitFormData)

    expect(result).toEqual({ status: 'success' })
    expect(mockLlmClient.callLLM).toHaveBeenCalledTimes(1)
    expect(submitFormDataCalled).toBe(true)
  })

  it('should handle LLM error responses', async () => {
    let submitFormDataCalled = false

    const errorLlmClient = {
      callLLM: mock(async (_request: { transcript: Message[] }) => ({
        action: 'error' as const,
        content: 'Failed to parse survey answers'
      }))
    }

    const mockSubmitFormData = async (_taskId: string, _answers: Record<string, number>) => {
      submitFormDataCalled = true
      return { status: 'success' as const }
    }

    const transcript: Message[] = [{ role: 'user', content: 'Test' }]
    const taskId = 'task-789'

    const result = await extractSurveyAnswers(transcript, taskId, errorLlmClient, mockSubmitFormData)

    expect(result).toEqual({ status: 'success' })
    expect(submitFormDataCalled).toBe(false)
  })

  it('should handle form submission failure', async () => {
    const mockLlmClient = {
      callLLM: mock(async (_request: { transcript: Message[] }) => {
        return {
          action: 'submit' as const,
          content: JSON.stringify({
            surveyAnswers: {
              'How satisfied are you?': 5
            }
          })
        }
      })
    }

    const errorSubmitFormData = async (_taskId: string, _answers: Record<string, number>) => ({
      status: 'failure' as const
    })

    const transcript: Message[] = [{ role: 'user', content: 'Test' }]
    const taskId = 'task-999'

    const result = await extractSurveyAnswers(transcript, taskId, mockLlmClient, errorSubmitFormData)

    expect(result).toEqual({ status: 'failure' })
  })

  it('should pass predefined questions to LLM in prompt', async () => {
    let promptContent: string | undefined

    const customLlmClient = {
      callLLM: mock(async (request: { transcript: Message[] }) => {
        promptContent = request.transcript[0].content
        return {
          action: 'submit' as const,
          content: JSON.stringify({
            surveyAnswers: {
              'How satisfied are you?': 4,
              'Recommend?': 8
            }
          })
        }
      })
    }

    const mockSubmitFormData = async (_taskId: string, _answers: Record<string, number>) => ({
      status: 'success' as const
    })

    const transcript: Message[] = [{ role: 'user', content: 'Test' }]
    const taskId = 'task-custom'

    await extractSurveyAnswers(transcript, taskId, customLlmClient, mockSubmitFormData)

    expect(customLlmClient.callLLM).toHaveBeenCalledTimes(1)
    expect(promptContent).toBeTruthy()
    expect(promptContent).toContain('How satisfied are you?')
    expect(promptContent).toContain('Would you recommend us?')
  })
})
