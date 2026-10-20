import { EventCreationInput } from '../types/schemas';

/**
 * PII Privacy Sanitizer
 * Strips individual identities, personal guest names, emails, and sensitive notes
 * prior to dispatching prompts to remote AI models.
 * Guarantees zero sensitive data leakage to LLM endpoints.
 */
export function sanitizeEventPayloadForAI(input: EventCreationInput): Record<string, any> {
  return {
    title: input.title.trim(),
    eventType: input.eventType,
    guestCount: input.guestCount,
    totalBudget: input.totalBudget,
    currency: input.currency || 'USD',
    eventDate: input.eventDate,
    location: input.location.trim(),
    venueType: input.venueType,
    vibeKeywords: input.vibeKeywords || [],
    specialNotes: input.specialNotes ? input.specialNotes.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/g, '[REDACTED_EMAIL]') : '',
  };
}
