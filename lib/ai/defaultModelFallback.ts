/**
 * Default cascade when GOOGLE_AI_MODEL_FALLBACK is unset (quota/error → next model).
 * Override via GOOGLE_AI_MODEL_FALLBACK if AI Studio model ids differ.
 */
export const DEFAULT_GOOGLE_AI_MODEL_FALLBACK = [
  "gemma-3-12b-it",
  "gemma-3-4b-it",
  "gemma-3-1b-it",
] as const;
