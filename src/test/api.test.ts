import { describe, it, expect, beforeEach } from 'vitest';
import handler, {
  resetRateLimits,
  validateAndNormalizeDomainPlan,
  preprocessAndNormalizeRawGeminiPlan,
} from '../../api/gemini';
import { AIEventPlanResponseSchema as ClientPlanSchema } from '../types/schemas';

function createMockReqRes(method: string, body: any, headers: Record<string, string> = {}) {
  const req: any = {
    method,
    body,
    headers: {
      'x-forwarded-for': '127.0.0.1',
      ...headers,
    },
  };

  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    bodyData: null as any,
    setHeader(key: string, value: string) {
      this.headers[key] = value;
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.bodyData = data;
      return this;
    },
    end() {
      return this;
    },
  };

  return { req, res };
}

describe('Serverless API Proxy Security & Business Validation (/api/gemini)', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('rejects unsupported HTTP methods with 405 Method Not Allowed', async () => {
    const { req, res } = createMockReqRes('GET', {});
    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.bodyData.error).toContain('Method Not Allowed');
  });

  it('rejects oversized request payloads exceeding 25 KB with 413', async () => {
    const largeString = 'A'.repeat(30000);
    const { req, res } = createMockReqRes('POST', { dummy: largeString });
    await handler(req, res);

    expect(res.statusCode).toBe(413);
    expect(res.bodyData.error).toContain('Payload Too Large');
  });

  it('rejects malformed or incomplete request schemas with 400 Bad Request', async () => {
    const { req, res } = createMockReqRes('POST', { action: 'invalid_action', eventData: {} });
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.bodyData.error).toContain('Invalid request payload schema');
  });

  it('rejects unsupported actions with 400 Bad Request', async () => {
    const { req, res } = createMockReqRes('POST', {
      action: 'adaptive_ripple_recs',
      eventData: {
        title: 'Test',
        eventType: 'birthday',
        guestCount: 20,
        totalBudget: 1000,
        currency: 'USD',
        eventDate: '2026-10-25',
        location: 'NYC',
        venueType: 'indoor',
      },
    });
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.bodyData.error).toContain('Unsupported action');
  });

  it('rejects invalid eventData parameters with 400 Bad Request', async () => {
    const { req, res } = createMockReqRes('POST', {
      action: 'generate_full_plan',
      eventData: {
        title: 'T', // Too short (< 2)
        eventType: 'birthday',
        guestCount: 1, // Below minimum 2
        totalBudget: 50, // Below minimum $100
        currency: 'USD',
        eventDate: 'invalid-date',
        location: '',
        venueType: 'indoor',
      },
    });
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.bodyData.error).toContain('Invalid eventData parameters');
  });

  it('delivers high-fidelity offline fallback plan when GEMINI_API_KEY is unset with exact budget reconciliation', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const validPayload = {
      action: 'generate_full_plan',
      eventData: {
        title: 'Sapphire Anniversary Jubilee',
        eventType: 'anniversary',
        guestCount: 80,
        totalBudget: 20000,
        currency: 'USD',
        eventDate: '2026-12-30',
        timezone: 'America/New_York',
        location: 'Manhattan Penthouse, NY',
        venueType: 'rooftop',
        vibeKeywords: ['Glamorous', 'Intimate'],
      },
    };

    const { req, res } = createMockReqRes('POST', validPayload);
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.bodyData.success).toBe(true);
    expect(res.bodyData.mode).toBe('offline_fallback');
    expect(res.bodyData.data.theme.conceptTitle).toBeDefined();
    expect(res.bodyData.data.allocations.length).toBeGreaterThan(0);

    // Single-cent exact reconciliation check: 20000 * 100 = 2,000,000 cents
    const sumCents = res.bodyData.data.allocations.reduce((sum: number, a: any) => sum + a.allocatedCents, 0);
    expect(sumCents).toBe(2000000);

    // Both server and client schema must validate the fallback plan
    const clientValidation = ClientPlanSchema.safeParse(res.bodyData.data);
    expect(clientValidation.success).toBe(true);

    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
  });

  it('guarantees unique categories in output allocations and strict single-cent sum matching', async () => {
    const validPayload = {
      action: 'generate_full_plan',
      eventData: {
        title: 'Emerald Gala',
        eventType: 'corporate_gala',
        guestCount: 120,
        totalBudget: 45000,
        currency: 'USD',
        eventDate: '2026-11-20',
        location: 'Downtown Center',
        venueType: 'ballroom',
      },
    };

    const { req, res } = createMockReqRes('POST', validPayload);
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    const allocations = res.bodyData.data.allocations;
    const categories = allocations.map((a: any) => a.category);
    const uniqueCategories = new Set(categories);
    expect(uniqueCategories.size).toBe(categories.length);

    const total = allocations.reduce((sum: number, a: any) => sum + a.allocatedCents, 0);
    expect(total).toBe(4500000);
  });

  it('enforces server-side sliding-window rate limiting (HTTP 429) when IP exceeds quota', async () => {
    const validPayload = {
      action: 'generate_full_plan',
      eventData: {
        title: 'Quota Test Gala',
        eventType: 'corporate_gala',
        guestCount: 50,
        totalBudget: 15000,
        currency: 'USD',
        eventDate: '2026-11-20',
        location: 'San Jose, CA',
        venueType: 'indoor',
      },
    };

    const clientHeaders = { 'x-forwarded-for': '198.51.100.42' };

    for (let i = 0; i < 20; i++) {
      const { req, res } = createMockReqRes('POST', validPayload, clientHeaders);
      await handler(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.headers['X-RateLimit-Limit']).toBe('20');
    }

    const { req: reqBlocked, res: resBlocked } = createMockReqRes('POST', validPayload, clientHeaders);
    await handler(reqBlocked, resBlocked);

    expect(resBlocked.statusCode).toBe(429);
    expect(resBlocked.headers['X-RateLimit-Remaining']).toBe('0');
    expect(resBlocked.headers['Retry-After']).toBeDefined();
    expect(resBlocked.bodyData.error).toBe('Too Many Requests');
    expect(resBlocked.bodyData.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('normalizes safe enum variants from AI (e.g. "Primary Accent", "Venue", "Inspirational") and satisfies client schema', () => {
    const rawAiOutput = {
      theme: {
        conceptTitle: 'Golden Hour Splendor',
        conceptDescription: 'Warm sunset tones and timeless elegance.',
        colorPalette: [
          { name: 'Sunset Gold', hex: '#d97706', role: 'Primary Accent' },
          { name: 'Warm Cream', hex: '#fef3c7', role: 'Secondary' },
          { name: 'Charcoal', hex: '#1e293b', role: 'Base' },
        ],
        dressCode: 'Cocktail Attire',
        decorStyle: 'Modern Botanical',
        ambianceLighting: 'Fairy lights and candle votives',
      },
      allocations: [
        { id: '1', category: 'Venue', name: 'Ballroom Rental', percentage: 40, allocatedCents: 1600000 },
        { id: '2', category: 'Catering', name: 'Plated Dinner', percentage: 40, allocatedCents: 1600000 },
        { id: '3', category: 'Entertainment', name: 'Live Quartet', percentage: 20, allocatedCents: 800000 },
      ],
      milestones: [
        { id: 'm1', time: '14:00', durationMinutes: 60, title: 'Load-In', category: 'Setup', assignedTo: 'Coordinator' },
        { id: 'm2', time: '18:00', durationMinutes: 90, title: 'Banquet', category: 'Dinner', assignedTo: 'Catering' },
        { id: 'm3', time: '20:00', durationMinutes: 45, title: 'Toasts', category: 'Speech', assignedTo: 'Host' },
      ],
      vendorCategories: [
        {
          id: 'v1',
          category: 'Venue',
          name: 'Venue Host',
          recommendedBudgetCents: 1600000,
          checklist: [{ id: 'c1', task: 'Sign contract', isCompleted: false }],
          inquiryDraft: 'Please confirm availability.',
        },
        {
          id: 'v2',
          category: 'Florist',
          name: 'Floral & Decor Styling',
          recommendedBudgetCents: 800000,
          checklist: [{ id: 'c2', task: 'Review centerpieces', isCompleted: false }],
          inquiryDraft: 'Please provide bouquet pricing.',
        },
        {
          id: 'v3',
          category: 'Catering',
          name: 'Banquet Service',
          recommendedBudgetCents: 1600000,
          checklist: [{ id: 'c3', task: 'Finalize menu', isCompleted: false }],
          inquiryDraft: 'Please confirm per-plate costs.',
        },
      ],
      creative: {
        invitations: [
          {
            id: 'inv1',
            style: 'Whimsical',
            headline: 'Join Us for Magic!',
            body: 'Celebrate under the stars.',
            rsvpCallToAction: 'RSVP soon',
            dressCodeNote: 'Cocktail',
          },
        ],
        speeches: [
          {
            id: 'sp1',
            speakerRole: 'Host',
            tone: 'Inspirational',
            estimatedDuration: '3 minutes',
            keyHighlights: ['Welcome', 'Gratitude'],
            content: 'Welcome to this incredible milestone!',
          },
        ],
        playlistVibes: ['Mellow acoustic jazz', 'Vibrant dance floor hits'],
        partyGames: ['Trivia'],
      },
    };

    // 1. Test deterministic preprocessing
    const preprocessed = preprocessAndNormalizeRawGeminiPlan(rawAiOutput);

    expect(preprocessed.theme.colorPalette[0].role).toBe('accent');
    expect(preprocessed.theme.colorPalette[1].role).toBe('secondary');
    expect(preprocessed.theme.colorPalette[2].role).toBe('neutral');

    expect(preprocessed.allocations[0].category).toBe('venue');
    expect(preprocessed.allocations[1].category).toBe('catering');

    expect(preprocessed.milestones[0].category).toBe('setup');
    expect(preprocessed.milestones[1].category).toBe('meal');
    expect(preprocessed.milestones[2].category).toBe('speech');

    expect(preprocessed.vendorCategories[0].category).toBe('venue');
    expect(preprocessed.vendorCategories[1].category).toBe('florist_decor');

    expect(preprocessed.creative.invitations[0].style).toBe('playful');
    expect(preprocessed.creative.speeches[0].tone).toBe('inspiring');

    // 2. Test full server validation & exact 0-cent reconciliation
    const targetBudgetCents = 4000000;
    const validated = validateAndNormalizeDomainPlan(rawAiOutput, targetBudgetCents);
    expect(validated).not.toBeNull();

    const sumAllocations = validated!.allocations.reduce((sum, a) => sum + a.allocatedCents, 0);
    expect(sumAllocations).toBe(targetBudgetCents);

    // 3. Test that CLIENT schema accepts the normalized plan seamlessly
    const clientValidation = ClientPlanSchema.safeParse(validated);
    expect(clientValidation.success).toBe(true);
  });

  it('rejects corrupt AI outputs with fewer than 3 allocations or categories', () => {
    const corruptPlan = {
      theme: { conceptTitle: 'Incomplete', conceptDescription: '...', colorPalette: [] },
      allocations: [{ id: '1', category: 'venue', allocatedCents: 100 }],
      milestones: [],
      vendorCategories: [],
      creative: { invitations: [], speeches: [], playlistVibes: [] },
    };

    const result = validateAndNormalizeDomainPlan(corruptPlan, 100000);
    expect(result).toBeNull();
  });
});
