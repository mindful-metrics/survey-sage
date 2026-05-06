import type { Survey, SurveyField, SurveySpec } from "../llm/extractor/types";

const rangeFields = (
  count: number,
  min: number,
  max: number,
  prompts: string[] = [],
  prefix = 'q',
): SurveyField[] => Array.from({ length: count }, (_, index) => {
  const key = `${prefix}${index + 1}`
  return {
    key,
    prompt: prompts[index] ?? key,
    min,
    max,
    required: true,
  }
})

export const GAD_7_SPEC: SurveySpec = {
  id: 'gad7',
  name: 'GAD-7',
  description: 'Generalized Anxiety Disorder 7-item scale. Extract item-level answers from the transcript.',
  timeframe: 'last two weeks',
  fields: rangeFields(7, 0, 3, [
    'Feeling nervous, anxious, or on edge.',
    'Not being able to stop or control worrying.',
    'Worrying too much about different things.',
    'Trouble relaxing.',
    'Being so restless that it is hard to sit still.',
    'Becoming easily annoyed or irritable.',
    'Feeling afraid, as if something awful might happen.',
  ]),
}

export const GAD_7_WITH_IMPAIRMENT_SPEC: SurveySpec = {
  ...GAD_7_SPEC,
  id: 'gad7-impairment',
  fields: [
    ...GAD_7_SPEC.fields,
    {
      key: 'functional_impairment',
      prompt: 'Difficulty caused by these problems in work, home, or social functioning.',
      min: 0,
      max: 3,
      required: true,
    },
  ],
}

export const ACE_SPEC: SurveySpec = {
  id: 'ace',
  name: 'ACE',
  description: 'Adverse Childhood Experiences questionnaire. Extract yes/no item-level answers as 0 or 1.',
  timeframe: 'before age 18',
  fields: rangeFields(10, 0, 1),
}

export const PSS_14_SPEC: SurveySpec = {
  id: 'pss14',
  name: 'PSS-14',
  description: 'Perceived Stress Scale 14-item questionnaire. Extract item-level frequency answers.',
  timeframe: 'last month',
  fields: rangeFields(14, 0, 4),
}

export const QIDS_SPEC: SurveySpec = {
  id: 'qids',
  name: 'QIDS-SR',
  description: 'Quick Inventory of Depressive Symptomatology self-report. Extract item-level scores.',
  timeframe: 'past seven days',
  fields: rangeFields(16, 0, 3, [], 'item'),
}

export const HAMD_SPEC: SurveySpec = {
  id: 'hamd',
  name: 'HAM-D',
  description: 'Hamilton Depression Rating Scale. Extract item-level scores.',
  fields: rangeFields(20, 0, 4),
}

export const DASS_21_SPEC: SurveySpec = {
  id: 'dass21',
  name: 'DASS-21',
  description: 'Depression Anxiety Stress Scales 21-item questionnaire. Extract item-level scores.',
  timeframe: 'past week',
  fields: [1, 6, 8, 11, 12, 14, 18, 2, 4, 7, 9, 15, 19, 20, 3, 5, 10, 13, 16, 17, 21].map((number) => ({
    key: `q${number}`,
    prompt: `DASS-21 item ${number}`,
    min: 0,
    max: 3,
    required: true,
  })),
}

export const SURVEY_SPECS = {
  gad7: GAD_7_SPEC,
  'gad7-impairment': GAD_7_WITH_IMPAIRMENT_SPEC,
  ace: ACE_SPEC,
  pss14: PSS_14_SPEC,
  qids: QIDS_SPEC,
  hamd: HAMD_SPEC,
  dass21: DASS_21_SPEC,
} as const

export type SurveyId = keyof typeof SURVEY_SPECS

export const getSurveySpec = (surveyId: string = 'gad7'): SurveySpec => {
  const spec = SURVEY_SPECS[surveyId as SurveyId]
  if (!spec) {
    throw new Error(`Unknown survey id: ${surveyId}`)
  }
  return spec
}

export const specToLegacySurvey = (spec: SurveySpec): Survey => ({
  questions: spec.fields.map((field) => ({
    key: field.key,
    prompt: field.prompt,
    acceptableAnswer: `A number between ${field.min} and ${field.max}`,
  }))
})
