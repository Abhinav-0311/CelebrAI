import { describe, it, expect } from 'vitest';
import { sanitizeEventPayloadForAI } from '../services/privacySanitizer';
import { EventCreationInput } from '../types/schemas';

describe('Client-Side Privacy Sanitizer & Data Boundary', () => {
  it('redacts email addresses and phone numbers from special notes', () => {
    const input: EventCreationInput = {
      title: 'Secret Milestone Jubilee',
      eventType: 'birthday',
      guestCount: 50,
      totalBudget: 15000,
      currency: 'USD',
      eventDate: '2026-11-20',
      timezone: 'America/Los_Angeles',
      location: 'Private Villa, Malibu',
      venueType: 'private_residence',
      vibeKeywords: ['Intimate', 'Luxe'],
      specialNotes: 'Contact coordinator at sarah.event@domain.com or call +1 (415) 555-2671. Back entrance only.',
    };

    const sanitized = sanitizeEventPayloadForAI(input);

    expect(sanitized.specialNotes).not.toContain('sarah.event@domain.com');
    expect(sanitized.specialNotes).toContain('[REDACTED_EMAIL]');
    expect(sanitized.specialNotes).not.toContain('415');
    expect(sanitized.specialNotes).toContain('[REDACTED_PHONE]');
    expect(sanitized.specialNotes).toContain('Back entrance only.');
  });

  it('preserves clean notes without modification when no PII is present', () => {
    const input: EventCreationInput = {
      title: 'Spring Garden Party',
      eventType: 'themed_party',
      guestCount: 30,
      totalBudget: 5000,
      currency: 'USD',
      eventDate: '2026-05-15',
      timezone: 'America/Los_Angeles',
      location: 'Rose Botanical Conservatory',
      venueType: 'garden',
      vibeKeywords: ['Floral', 'Bright'],
      specialNotes: 'Pastel colors preferred. Acoustic harp background music.',
    };

    const sanitized = sanitizeEventPayloadForAI(input);
    expect(sanitized.specialNotes).toBe('Pastel colors preferred. Acoustic harp background music.');
    expect(sanitized.title).toBe('Spring Garden Party');
    expect(sanitized.totalBudget).toBe(5000);
  });
});
