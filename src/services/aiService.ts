import { AIEventPlanResponse, EventCreationInput, AIEventPlanResponseSchema } from '../types/schemas';
import { generateDeterministicPlan } from './offlinePlanner';

export interface PlanGenerationResult {
  plan: AIEventPlanResponse;
  mode: 'live' | 'offline';
  sourceMessage: string;
}

/**
 * Client AI Service
 * Calls the secure backend proxy /api/gemini.
 * Never stores or exposes API keys on the browser client.
 */
export async function generateCelebrAIPlan(
  input: EventCreationInput
): Promise<PlanGenerationResult> {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'generate_full_plan',
        eventData: input,
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

    const json = await response.json();

    if (json.success && json.data) {
      // Validate schema with Zod
      const parsed = AIEventPlanResponseSchema.safeParse(json.data);
      if (parsed.success) {
        return {
          plan: parsed.data,
          mode: json.mode === 'live_ai' ? 'live' : 'offline',
          sourceMessage:
            json.mode === 'live_ai'
              ? `Live AI (Model: ${json.model || 'gemini-3.8-flash'})`
              : 'Offline Planner (Server deterministic fallback)',
        };
      } else {
        console.warn('AI Output failed Zod schema validation. Falling back safely.', parsed.error);
      }
    }

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
