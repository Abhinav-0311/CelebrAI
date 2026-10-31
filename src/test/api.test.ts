import { z } from 'zod';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler, {
  resetRateLimits, checkRateLimit, type GeminiRequest, type GeminiResponse,
} from '../../api/gemini';
import { validateAndNormalizeDomainPlan, preprocessAndNormalizeRawGeminiPlan } from '../services/planValidation';
import { AIEventPlanResponseSchema as ClientPlanSchema, EventCreationSchema, type EventCreationInput, GeminiPlanResponseSchema } from '../types/schemas';
import { generateDeterministicPlan } from '../services/offlinePlanner';

const { generateContentMock } = vi.hoisted(() => ({ generateContentMock: vi.fn() }));

vi.mock('@google/genai', async importOriginal => {
  const actual = await importOriginal<typeof import('@google/genai')>();
  return {
    ...actual,
    GoogleGenAI: class {
      models = { generateContent: generateContentMock };
    },
  };
});

interface CapturedResponse extends GeminiResponse {
  statusCode: number;
  headers: Record<string, string>;
  bodyData: unknown;
}

function createMockReqRes(method: string, body: unknown, headers: Record<string, string> = {}) {
  const req: GeminiRequest = {
    method,
    body,
    headers: {
      'x-forwarded-for': '127.0.0.1',
      ...headers,
    },
  };

  const res: CapturedResponse = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    bodyData: null,
    setHeader(key: string, value: string) {
      this.headers[key] = value;
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.bodyData = data;
      return this;
    },
    end() {
      return this;
    },
  };

  return { req, res };
}

const ErrorBodySchema = z.object({ error: z.string(), retryAfterSeconds: z.number().optional() });
const errorBody = (res: CapturedResponse) => ErrorBodySchema.parse(res.bodyData);
const successBody = (res: CapturedResponse) => GeminiPlanResponseSchema.parse(res.bodyData);
function liveBody(res: CapturedResponse) {
  const body = successBody(res);
  if (body.mode !== 'live_ai') throw new Error('Expected live model response');
  return body;
}

describe('Serverless API Proxy Security & Business Validation (/api/gemini)', () => {
  beforeEach(() => {
    resetRateLimits();
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('GEMINI_MODEL', '');
    generateContentMock.mockReset();
  });

  afterEach(() => vi.unstubAllEnvs());

  it('rejects unsupported HTTP methods with 405 Method Not Allowed', async () => {
    const { req, res } = createMockReqRes('GET', {});
    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(errorBody(res).error).toContain('Method Not Allowed');
  });

  it('rejects oversized request payloads exceeding 25 KB with 413', async () => {
    const largeString = 'A'.repeat(30000);
    const { req, res } = createMockReqRes('POST', { dummy: largeString });
    await handler(req, res);

    expect(res.statusCode).toBe(413);
    expect(errorBody(res).error).toContain('Payload Too Large');
  });

  it('enforces the 25 KB limit in UTF-8 bytes for multibyte payloads', async () => {
    const body = { notes: '界'.repeat(9000) };
    expect(JSON.stringify(body).length).toBeLessThan(25600);
    expect(Buffer.byteLength(JSON.stringify(body), 'utf8')).toBeGreaterThan(25600);
    const { req, res } = createMockReqRes('POST', body);
    await handler(req, res);
    expect(res.statusCode).toBe(413);
  });

  it('rejects malformed or incomplete request schemas with 400 Bad Request', async () => {
    const { req, res } = createMockReqRes('POST', { action: 'invalid_action', eventData: {} });
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(errorBody(res).error).toContain('Invalid request payload schema');
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
    expect(errorBody(res).error).toContain('Unsupported action');
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
    expect(errorBody(res).error).toContain('Invalid eventData parameters');
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
    expect(successBody(res).success).toBe(true);
    expect(successBody(res).mode).toBe('offline_fallback');
    expect(successBody(res).data.theme.conceptTitle).toBeDefined();
    expect(successBody(res).data.allocations.length).toBeGreaterThan(0);

    // Single-cent exact reconciliation check: 20000 * 100 = 2,000,000 cents
    const sumCents = successBody(res).data.allocations.reduce((sum, a) => sum + a.allocatedCents, 0);
    expect(sumCents).toBe(2000000);

    // Both server and client schema must validate the fallback plan
    const clientValidation = ClientPlanSchema.safeParse(successBody(res).data);
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
    const allocations = successBody(res).data.allocations;
    const categories = allocations.map((a) => a.category);
    const uniqueCategories = new Set(categories);
    expect(uniqueCategories.size).toBe(categories.length);

    const total = allocations.reduce((sum, a) => sum + a.allocatedCents, 0);
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
    expect(errorBody(resBlocked).error).toBe('Too Many Requests');
    expect(errorBody(resBlocked).retryAfterSeconds).toBeGreaterThan(0);
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
    const preprocessed = ClientPlanSchema.parse(preprocessAndNormalizeRawGeminiPlan(rawAiOutput));

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

  it.each(EventCreationSchema.shape.eventType.options)('matches browser fallback for %s with fractional currency', async eventType => {
    const input: EventCreationInput = {
      title: 'Shared planning contract', eventType, guestCount: 123, totalBudget: 33333.33,
      currency: 'USD', eventDate: '2026-12-18', timezone: 'America/Los_Angeles',
      location: 'City Gardens', venueType: 'garden', vibeKeywords: [],
    };
    const { req, res } = createMockReqRes('POST', { action: 'generate_full_plan', eventData: input });
    await handler(req, res);
    const plan = ClientPlanSchema.parse(successBody(res).data);
    expect(res.statusCode).toBe(200);
    expect(successBody(res).mode).toBe('offline_fallback');
    expect(plan).toEqual(generateDeterministicPlan(input));
    expect(plan.allocations.reduce((sum, allocation) => sum + allocation.allocatedCents, 0)).toBe(3333333);
    expect(plan.allocations.every(allocation => allocation.actualSpentCents === 0)).toBe(true);
    expect(validateAndNormalizeDomainPlan(plan, 3333333)).not.toBeNull();
  });

  it('keeps generated text strict without rejecting intentionally empty saved drafts', () => {
    const input = EventCreationSchema.parse({
      title: 'Validation contract', eventType: 'birthday', guestCount: 50, totalBudget: 5000,
      eventDate: '2026-12-18', location: 'City Gardens', venueType: 'garden',
    });
    const plan = generateDeterministicPlan(input);
    plan.theme.conceptTitle = '';
    expect(ClientPlanSchema.safeParse(plan).success).toBe(true);
    expect(validateAndNormalizeDomainPlan(plan, 500000)).toBeNull();
    plan.theme.conceptTitle = 'A valid concept';
    plan.creative.invitations[0].headline = '';
    plan.creative.invitations[0].body = '';
    expect(ClientPlanSchema.safeParse(plan).success).toBe(true);
    expect(validateAndNormalizeDomainPlan(plan, 500000)).not.toBeNull();
  });

  it.each([null, 42, [], { theme: null, allocations: [null], milestones: [false], vendorCategories: ['invalid'] }])(
    'rejects malformed model output without throwing (%j)', raw => {
      expect(validateAndNormalizeDomainPlan(raw, 500000)).toBeNull();
    }
  );


  it('returns validated live output with the shared schema and exact budget', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-server-only-key');
    const input = EventCreationSchema.parse({
      title: 'Live model contract', eventType: 'corporate_gala', guestCount: 123,
      totalBudget: 33333.33, eventDate: '2026-12-18', location: 'City Hall', venueType: 'ballroom',
    });
    generateContentMock.mockResolvedValue({ text: JSON.stringify(generateDeterministicPlan(input)) });
    const { req, res } = createMockReqRes('POST', { action: 'generate_full_plan', eventData: input });
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(successBody(res).mode).toBe('live_ai');
    expect(liveBody(res).model).toBe('gemini-3.5-flash-lite');
    expect(ClientPlanSchema.safeParse(successBody(res).data).success).toBe(true);
    expect(successBody(res).data.allocations.reduce((sum: number, allocation: { allocatedCents: number }) => sum + allocation.allocatedCents, 0)).toBe(3333333);
    expect(generateContentMock).toHaveBeenCalledOnce();
  });

  it('tries the next model when the primary response is invalid', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-server-only-key');
    const input = EventCreationSchema.parse({
      title: 'Model failover contract', eventType: 'wedding', guestCount: 100, totalBudget: 25000,
      eventDate: '2026-12-18', location: 'City Gardens', venueType: 'garden',
    });
    generateContentMock.mockResolvedValueOnce({ text: '{invalid JSON' })
      .mockResolvedValueOnce({ text: JSON.stringify(generateDeterministicPlan(input)) });
    const { req, res } = createMockReqRes('POST', { action: 'generate_full_plan', eventData: input });
    await handler(req, res);
    expect(successBody(res).mode).toBe('live_ai');
    expect(liveBody(res).model).toBe('gemini-3.8-flash');
    expect(generateContentMock).toHaveBeenCalledTimes(2);
  });

  it('falls back safely without exposing upstream diagnostics when all models fail', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-server-only-key');
    generateContentMock.mockRejectedValue(new Error('Upstream rejected test-server-only-key'));
    const input = EventCreationSchema.parse({
      title: 'Safe fallback contract', eventType: 'baby_shower', guestCount: 50, totalBudget: 5000,
      eventDate: '2026-12-18', location: 'City Gardens', venueType: 'garden',
    });
    const { req, res } = createMockReqRes('POST', { action: 'generate_full_plan', eventData: input });
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(successBody(res).mode).toBe('offline_fallback');
    expect(successBody(res).data).toEqual(generateDeterministicPlan(input));
    expect(res.bodyData).not.toHaveProperty('diagnostics');
    expect(JSON.stringify(res.bodyData)).not.toContain('test-server-only-key');
    expect(JSON.stringify(res.bodyData)).not.toContain('Upstream rejected');
    expect(generateContentMock).toHaveBeenCalledTimes(2);
  });

  it('expires a rate-limit window and isolates clients', () => {
    let now = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    for (let request = 0; request < 20; request++) expect(checkRateLimit('client-a').allowed).toBe(true);
    expect(checkRateLimit('client-a').allowed).toBe(false);
    expect(checkRateLimit('client-b').allowed).toBe(true);
    now += 60001;
    expect(checkRateLimit('client-a')).toMatchObject({ allowed: true, remaining: 19 });
  });

  it('stops model attempts when the total inference budget is exhausted', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-server-only-key');
    let now = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    generateContentMock.mockImplementation(async () => {
      now += 17000;
      throw new Error('Upstream timeout');
    });
    const input = EventCreationSchema.parse({
      title: 'Inference budget contract', eventType: 'birthday', guestCount: 50, totalBudget: 5000,
      eventDate: '2026-12-18', location: 'City Gardens', venueType: 'garden',
    });
    const { req, res } = createMockReqRes('POST', { action: 'generate_full_plan', eventData: input });
    await handler(req, res);
    expect(generateContentMock).toHaveBeenCalledOnce();
    expect(successBody(res).mode).toBe('offline_fallback');
    expect(successBody(res).data.allocations.reduce((sum, item) => sum + item.allocatedCents, 0)).toBe(500000);
  });

  it('fills sparse valid plans without replacing existing milestones', () => {
    const input = EventCreationSchema.parse({
      title: 'Sparse generation contract', eventType: 'wedding', guestCount: 80, totalBudget: 10000,
      eventDate: '2026-12-18', location: 'City Gardens', venueType: 'garden',
    });
    const plan = generateDeterministicPlan(input);
    const original = plan.milestones.slice(0, 3);
    const result = validateAndNormalizeDomainPlan({ ...plan, milestones: original, vendorCategories: [],
      creative: { ...plan.creative, playlistVibes: [], partyGames: [] } }, 1000000, input)!;
    expect(result).not.toBeNull();
    expect(result.milestones).toEqual(expect.arrayContaining(original));
    expect(result.milestones.length).toBeGreaterThan(original.length);
    expect(result.vendorCategories.length).toBeGreaterThan(0);
    expect(result.creative.partyGames.length).toBeGreaterThan(1);
    expect(result.creative.playlistVibes.length).toBeGreaterThan(2);
  });

  it('rejects zero-value or duplicate-category allocation plans', () => {
    const input = EventCreationSchema.parse({
      title: 'Allocation integrity', eventType: 'birthday', guestCount: 50, totalBudget: 5000,
      eventDate: '2026-12-18', location: 'City Gardens', venueType: 'garden',
    });
    const plan = generateDeterministicPlan(input);
    expect(validateAndNormalizeDomainPlan({ ...plan, allocations: plan.allocations.map(item => ({
      ...item, allocatedCents: 0, percentage: 0,
    })) }, 500000)).toBeNull();
    expect(validateAndNormalizeDomainPlan({ ...plan, allocations: plan.allocations.map(item => ({
      ...item, category: 'venue',
    })) }, 500000)).toBeNull();
  });

});
