import { file, resolve } from "bun"
import { createDataExtractor } from "../llm/extractor/surveyExtractor"
import type { Message } from "../llm/types"
import { getSurveySpec, SURVEY_SPECS } from "../surveys/specs"
import { validateSurveyAnswers } from "../surveys/validation"
import { evaluatePredictions, type EvaluationCase } from "./metrics"

const datasetBySurvey: Record<string, string> = {
  gad7: 'gad_valid_dataset.json',
  'gad7-impairment': 'gad7_valid_dataset.json',
  ace: 'ace_valid_dataset.json',
  dass21: 'dass_valid_dataset.json',
  hamd: 'hamd_valid_dataset.json',
  pss14: 'pss14_valid_dataset.json',
  qids: 'qids_valid_dataset.json',
}

type EvaluationOptions = {
  surveyId?: string
  datasetPath?: string
  datasetDir?: string
}

const usage = `Usage:
  bun run eval [surveyId] [datasetPath]

Environment alternatives:
  SURVEY_ID=gad7 EVAL_DATASET_PATH=/path/to/gad7_valid_dataset.json bun run eval
  SURVEY_ID=gad7 EVAL_DATASET_DIR=/path/to/datasets bun run eval

Dataset format:
  [
    {
      "conversation": [{ "role": "user", "content": "..." }],
      "expected_output": { "q1": "0" }
    }
  ]`

const resolveDatasetPath = (surveyId: string, options: EvaluationOptions = {}) => {
  if (options.datasetPath) return options.datasetPath
  if (Bun.env.EVAL_DATASET_PATH) return Bun.env.EVAL_DATASET_PATH

  const datasetDir = options.datasetDir || Bun.env.EVAL_DATASET_DIR
  const fileName = datasetBySurvey[surveyId]

  if (!fileName) {
    throw new Error(`No default evaluation dataset filename registered for ${surveyId}`)
  }

  if (!datasetDir) {
    throw new Error(`Missing evaluation dataset. Pass a dataset path or set EVAL_DATASET_PATH/EVAL_DATASET_DIR.\n\n${usage}`)
  }

  return `${datasetDir.replace(/\/$/, '')}/${fileName}`
}

const isEvaluationCase = (value: unknown): value is EvaluationCase => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<EvaluationCase>
  return Array.isArray(candidate.conversation)
    && !!candidate.expected_output
    && typeof candidate.expected_output === 'object'
}

const loadDataset = async (path: string): Promise<EvaluationCase[]> => {
  const file = Bun.file(path)

  if (!(await file.exists())) {
    throw new Error(`Dataset not found: ${path}`)
  }

  const parsed = JSON.parse(await file.text()) as unknown
  if (!Array.isArray(parsed) || !parsed.every(isEvaluationCase)) {
    throw new Error(`Invalid evaluation dataset: ${path}`)
  }

  return parsed
}

export const runEvaluation = async (options: string | EvaluationOptions = {}) => {
  const normalizedOptions = typeof options === 'string' ? { surveyId: options } : options
  const surveyId = normalizedOptions.surveyId || Bun.env.SURVEY_ID || 'gad7'
  const spec = getSurveySpec(surveyId)
  const datasetPath = resolveDatasetPath(spec.id, normalizedOptions)
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
  const datasetPath = Bun.argv[3]
  const summary = await runEvaluation({ surveyId, datasetPath })
  console.log(JSON.stringify(summary, null, 2))
}