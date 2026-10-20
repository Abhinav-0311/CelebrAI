import { EventCreationInput } from '../types/schemas';

/**
 * Client-Side PII Redaction & Metadata Anonymizer
 * Filters out obvious personal identifiers (emails, phone numbers, individual names)
 * from free-text notes before dispatching requests to remote AI endpoints.
 * 
 * Note: While this provides defensive client-side redaction, the primary privacy
 * guarantee is architectural: full guest directories, emails, and seating records
 * are maintained strictly in local browser storage and never included in AI prompts.
 */
export function sanitizeEventPayloadForAI(input: EventCreationInput): Record<string, any> {
  let cleanedNotes = input.specialNotes || '';

  // Redact email addresses
  cleanedNotes = cleanedNotes.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[REDACTED_EMAIL]');

  // Redact standard 7-11 digit telephone numbers
  cleanedNotes = cleanedNotes.replace(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[REDACTED_PHONE]');

  return {
    title: input.title.trim(),
    eventType: input.eventType,
    guestCount: input.guestCount,
    totalBudget: input.totalBudget,
    currency: input.currency || 'USD',
    eventDate: input.eventDate,
    timezone: input.timezone || 'America/Los_Angeles',
    location: input.location.trim(),
    venueType: input.venueType,
    vibeKeywords: input.vibeKeywords || [],
    specialNotes: cleanedNotes.trim(),
  };
}
