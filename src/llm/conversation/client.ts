import type { LLMConfig } from "../config";
import { createLLMClient } from "../openAi";
import { getSystemPrompt } from "./prompt";

export const createConversationEngine = (config?: LLMConfig, survey = 'gad7') =>
  createLLMClient(config, getSystemPrompt(survey))