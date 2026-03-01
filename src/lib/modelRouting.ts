import { env } from '@/lib/env';

type AIProvider = 'openai' | 'openrouter';
type RunMode = 'fast' | 'deep';
type ModelStage = 'plan' | 'summaries' | 'artifacts' | 'chat';

type ModelProfile = {
  model: string;
  modelFast: string;
  modelDeep: string;
  modelPlan: string;
  modelPlanFast: string;
  modelPlanDeep: string;
  modelArtifacts: string;
  modelArtifactsFast: string;
  modelArtifactsDeep: string;
  modelChat: string;
  modelChatFast: string;
  modelChatDeep: string;
  modelSummaries: string;
  modelSummariesFast: string;
  modelSummariesDeep: string;
};

function firstNonEmpty(...values: Array<string | undefined | null>): string | undefined {
  for (const value of values) {
    const s = String(value || '').trim();
    if (s) return s;
  }
  return undefined;
}

function stageModels(profile: ModelProfile, stage: ModelStage) {
  if (stage === 'plan') {
    return {
      base: profile.modelPlan,
      fast: profile.modelPlanFast,
      deep: profile.modelPlanDeep,
    };
  }
  if (stage === 'summaries') {
    return {
      base: profile.modelSummaries,
      fast: profile.modelSummariesFast,
      deep: profile.modelSummariesDeep,
    };
  }
  if (stage === 'artifacts') {
    return {
      base: profile.modelArtifacts,
      fast: profile.modelArtifactsFast,
      deep: profile.modelArtifactsDeep,
    };
  }
  return {
    base: profile.modelChat,
    fast: profile.modelChatFast,
    deep: profile.modelChatDeep,
  };
}

export function selectStageModel({
  provider,
  stage,
  mode,
  requestedModel,
}: {
  provider: AIProvider;
  stage: ModelStage;
  mode: RunMode;
  requestedModel?: string;
}): string | undefined {
  // Caller-supplied model wins. Useful for one-off experiments.
  const explicit = firstNonEmpty(requestedModel);
  if (explicit) return explicit;

  const profile = (provider === 'openrouter' ? env.ai.openrouter : env.ai.openai) as ModelProfile;
  const stageProfile = stageModels(profile, stage);
  const modeFallback = mode === 'fast' ? profile.modelFast : profile.modelDeep;

  if (mode === 'fast') {
    return firstNonEmpty(stageProfile.fast, stageProfile.base, modeFallback, profile.model);
  }
  return firstNonEmpty(stageProfile.deep, stageProfile.base, modeFallback, profile.model);
}
