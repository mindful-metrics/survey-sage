import type { LLMConfig } from "../config";
import type { Survey, SurveySpec } from "../extractor/types";
import { createLLMClient } from "../openAi";
import { getSystemPrompt } from "./prompt";

export const createConversationEngine = (
  config?: LLMConfig,
  survey: SurveySpec | string = 'gad7',
) => createLLMClient(config, getSystemPrompt(survey))