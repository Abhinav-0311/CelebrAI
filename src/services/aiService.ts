import { AIEventPlanResponse, EventCreationInput, GeminiPlanResponseSchema } from '../types/schemas';
import { generateDeterministicPlan } from './offlinePlanner';
import { sanitizeEventPayloadForAI } from './privacySanitizer';

export interface PlanGenerationResult {
  plan: AIEventPlanResponse;
  mode: 'live' | 'offline';
  sourceMessage: string;
}

/**
 * Client AI Service
 * Calls the secure backend proxy /api/gemini with sanitized PII.
 * Never stores or exposes API keys on the browser client.
 */
export async function generateCelebrAIPlan(
  input: EventCreationInput
): Promise<PlanGenerationResult> {
  try {
    const sanitizedInput = sanitizeEventPayloadForAI(input);

    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'generate_full_plan',
        eventData: sanitizedInput,
      }),
    });

    if (!response.ok) {
      console.warn(`Proxy returned HTTP ${response.status}. Using high-fidelity offline planner.`);
      const fallback = generateDeterministicPlan(input);
      return {
        plan: fallback,
        mode: 'offline',
        sourceMessage: 'Offline Planner (Deterministic calculation engine)',
      };
    }

    const json: unknown = await response.json();
    const parsed = GeminiPlanResponseSchema.safeParse(json);
    if (parsed.success) {
      const result = parsed.data;
      return {
        plan: result.data,
        mode: result.mode === 'live_ai' ? 'live' : 'offline',
        sourceMessage: result.mode === 'live_ai'
          ? `Live AI (Model: ${result.model})`
          : 'Offline Planner (Server deterministic fallback)',
      };
    }
    console.warn('AI response failed schema validation. Falling back safely.', parsed.error);

    // Default fallback
    const fallback = generateDeterministicPlan(input);
    return {
      plan: fallback,
      mode: 'offline',
      sourceMessage: 'Offline Planner (Domain engine fallback)',
    };
  } catch (err) {
    console.warn('Network call to /api/gemini failed (offline or standalone static). Using deterministic planner.', err);
    const fallback = generateDeterministicPlan(input);
    return {
      plan: fallback,
      mode: 'offline',
      sourceMessage: 'Offline Planner (Local deterministic engine)',
    };
  }
}
