import type { SurveyAnswers, SurveySpec, ValidationResult } from "../llm/extractor/types";

const normalizeValue = (value: unknown): string | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^-?\d+$/.test(trimmed)) {
      return String(Number.parseInt(trimmed, 10))
    }
  }
  return undefined
}

export const validateSurveyAnswers = (rawAnswers: unknown, spec: SurveySpec): ValidationResult => {
  const errors: string[] = []
  const answers: SurveyAnswers = {}

  if (!rawAnswers || typeof rawAnswers !== 'object' || Array.isArray(rawAnswers)) {
    return {
      ok: false,
      errors: ['Extractor output must be a JSON object.'],
      answers,
    }
  }

  const raw = rawAnswers as Record<string, unknown>

  for (const field of spec.fields) {
    const normalized = normalizeValue(raw[field.key])
    if (normalized === undefined) {
      if (field.required !== false) {
        errors.push(`${field.key} is missing or not an integer-like value.`)
      }
      continue
    }
    
    const numberValue = Number.parseInt(normalized, 10)
    if (numberValue < field.min || numberValue > field.max) {
      errors.push(`${field.key}=${normalized} is outside allowed range ${field.min}-${field.max}.`)
      continue
    }

    answers[field.key] = normalized
  }

  return errors.length === 0
    ? { ok: true, answers }
    : { ok: false, errors, answers }
}
