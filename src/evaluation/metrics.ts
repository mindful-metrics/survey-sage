import type { SurveyAnswers, SurveySpec } from "../llm/extractor/types"

export type EvaluationCase = {
  conversation: unknown[]
  expected_output: SurveyAnswers
}

export type EvaluationRow = {
  index: number
  key: string
  expected: string
  predicted: string
  correct: boolean
}

export type EvaluationSummary = {
  surveyId: string
  cases: number
  fields: number
  totalComparisons: number
  exactMatches: number
  accuracy: number
  mse: number
  failures: EvaluationRow[]
}

const toNumber = (value: string | undefined) => Number.parseInt(value ?? '0', 10)

export const evaluatePredictions = (
  expected: SurveyAnswers[],
  predicted: SurveyAnswers[],
  spec: SurveySpec,
): EvaluationSummary => {
  const failures: EvaluationRow[] = []
  let exactMatches = 0
  let squaredError = 0
  let totalComparisons = 0

  expected.forEach((expectedAnswers, index) => {
    const predictedAnswers = predicted[index] ?? {}
    for (const field of spec.fields) {
      const expectedValue = expectedAnswers[field.key] ?? ''
      const predictedValue = predictedAnswers[field.key] ?? ''
      const correct = expectedValue === predictedValue
      if (correct) {
        exactMatches += 1
      } else {
        failures.push({
          index,
          key: field.key,
          expected: expectedValue,
          predicted: predictedValue,
          correct,
        })
      }
      squaredError += (toNumber(expectedValue) - toNumber(predictedValue)) ** 2
      totalComparisons += 1
    }
  })

  return {
    surveyId: spec.id,
    cases: expected.length,
    fields: spec.fields.length,
    totalComparisons,
    exactMatches,
    accuracy: totalComparisons === 0 ? 0 : exactMatches / totalComparisons,
    mse: totalComparisons === 0 ? 0 : squaredError / totalComparisons,
    failures,
  }
}