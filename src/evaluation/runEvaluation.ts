import { createDataExtractor } from "../llm/extractor/surveyExtractor"
import type { Message } from "../llm/types"
import { getSurveySpec } from "../surveys/specs"
import { validateSurveyAnswers } from "../surveys/validation"
import { evaluatePredictions, type EvaluationCase } from "./metrics"

const datasetBySurvey: Record<string, string> = {
  gad7: 'test/fixtures/gad_valid_dataset.json',
  'gad7-impairment': 'test/fixtures/gad7_valid_dataset.json',
  ace: 'test/fixtures/ace_valid_dataset.json',
  dass21: 'test/fixtures/dass_valid_dataset.json',
  hamd: 'test/fixtures/hamd_valid_dataset.json',
  pss14: 'test/fixtures/pss14_valid_dataset.json',
  qids: 'test/fixtures/qids_valid_dataset.json',
}

const loadDataset = async (path: string): Promise<EvaluationCase[]> => {
  const file = Bun.file(path)

  if (!(await file.exists())) {
    throw new Error(`Dataset not found: ${path}`)
  }

  return JSON.parse(await file.text()) as EvaluationCase[]
}

export const runEvaluation = async (surveyId = Bun.env.SURVEY_ID || 'gad7') => {
  const spec = getSurveySpec(surveyId)
  const datasetPath = datasetBySurvey[spec.id]

  if (!datasetPath) {
    throw new Error(`No evaluation dataset registered for ${spec.id}`)
  }

  const data = await loadDataset(datasetPath)
  const extractor = createDataExtractor(spec)
  const predicted = []

  for (const [index, row] of data.entries()) {
    const result = await extractor.callLLM({ transcript: row.conversation as Message[] })

    if (result.action === 'error') {
      console.error(`case ${index}: ${result.content}`)
      predicted.push({})
      continue
    }

    const validation = validateSurveyAnswers(result.content, spec)

    if (!validation.ok) {
      console.error(`case ${index}: ${validation.errors.join(' ')}`)
    }

    predicted.push(validation.answers)
  }

  return evaluatePredictions(data.map((row) => row.expected_output), predicted, spec)
}

if (import.meta.main) {
  const surveyId = Bun.argv[2] || Bun.env.SURVEY_ID || 'gad7'
  const summary = await runEvaluation(surveyId)
  console.log(JSON.stringify(summary, null, 2))
}