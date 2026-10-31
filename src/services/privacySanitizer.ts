import { EventCreationInput } from '../types/schemas';

/**
 * Client-Side PII Redaction & Data Boundary Anonymizer
 * 
 * Data Boundary Isolation:
 * - Sent to AI endpoint (/api/gemini): Event title, eventType, guestCount, totalBudget, currency,
 *   eventDate, timezone, location, venueType, vibeKeywords, and regex-sanitized specialNotes.
 * - Kept strictly local (never transmitted to AI): Guest directories (names, personal emails, phone numbers,
 *   RSVP responses, dietary restrictions, plus-ones, table assignments), individual expense
 *   vendor contacts, invoice records, and day-of operational logs.
 * 
 * Defense-in-depth:
 * Free-text notes undergo regex pattern redaction for standard email addresses and telephone numbers.
 * Users are advised not to enter confidential identity credentials into free-text notes.
 */
export function sanitizeEventPayloadForAI(input: EventCreationInput): Required<EventCreationInput> {
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
