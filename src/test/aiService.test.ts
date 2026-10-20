import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateCelebrAIPlan } from '../services/aiService';
import { EventCreationInput } from '../types/schemas';

describe('AI Client Service & Deterministic Fallback Orchestration', () => {
  const sampleInput: EventCreationInput = {
    title: 'Emerald Gala',
    eventType: 'corporate_gala',
    guestCount: 100,
    totalBudget: 25000,
    currency: 'USD',
    eventDate: '2026-11-15',
    timezone: 'America/New_York',
    location: 'Metropolitan Club',
    venueType: 'ballroom',
    vibeKeywords: ['Polished', 'Emerald'],
    specialNotes: 'VIP speakers attending',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to offline deterministic planner when network fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await generateCelebrAIPlan(sampleInput);

    expect(result.mode).toBe('offline');
    expect(result.plan).toBeDefined();
    expect(result.plan.theme.conceptTitle).toBeDefined();
    expect(result.plan.allocations.length).toBeGreaterThan(0);
    expect(result.sourceMessage).toContain('Local deterministic engine');
  });

  it('handles server offline fallback payload gracefully', async () => {
    const mockServerResponse = {
      ok: true,
      json: async () => ({
        success: true,
        mode: 'offline_fallback',
        data: {
          theme: {
            conceptTitle: 'Emerald Prestige',
            conceptDescription: 'A classic corporate gala with lush emerald tones.',
            colorPalette: [
              { name: 'Emerald', hex: '#059669', role: 'primary' },
              { name: 'Gold', hex: '#d97706', role: 'accent' },
              { name: 'Ivory', hex: '#f8fafc', role: 'neutral' },
            ],
            dressCode: 'Black Tie',
            decorStyle: 'Minimal Luxe',
            ambianceLighting: 'Candlelight',
          },
          allocations: [
            { id: 'a1', category: 'venue', name: 'Venue', percentage: 40, allocatedCents: 1000000, actualSpentCents: 0 },
            { id: 'a2', category: 'catering', name: 'Catering', percentage: 40, allocatedCents: 1000000, actualSpentCents: 0 },
            { id: 'a3', category: 'contingency', name: 'Contingency', percentage: 20, allocatedCents: 500000, actualSpentCents: 0 },
          ],
          milestones: [
            { id: 'm1', time: '17:00', durationMinutes: 60, title: 'Arrival', category: 'setup', assignedTo: 'Host', status: 'pending' },
            { id: 'm2', time: '18:00', durationMinutes: 60, title: 'Dinner', category: 'meal', assignedTo: 'Catering', status: 'pending' },
            { id: 'm3', time: '19:00', durationMinutes: 60, title: 'Wrap up', category: 'teardown', assignedTo: 'Team', status: 'pending' },
          ],
          vendorCategories: [
            { id: 'v1', category: 'venue', name: 'Venue Corp', recommendedBudgetCents: 1000000, checklist: [], inquiryDraft: 'Hello' },
          ],
          creative: {
            invitations: [
              { id: 'i1', style: 'formal', headline: 'You Are Invited', body: 'Join us.', rsvpCallToAction: 'RSVP now', dressCodeNote: 'Black Tie' },
            ],
            speeches: [
              { id: 's1', speakerRole: 'Host', tone: 'heartfelt', estimatedDuration: '5 min', keyHighlights: ['Welcome'], content: 'Welcome all.' },
            ],
            playlistVibes: ['Jazz'],
            partyGames: ['Trivia'],
          },
        },
      }),
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockServerResponse));

    const result = await generateCelebrAIPlan(sampleInput);

    expect(result.mode).toBe('offline');
    expect(result.plan.theme.conceptTitle).toBe('Emerald Prestige');
    expect(result.sourceMessage).toContain('Server deterministic fallback');
  });
});
