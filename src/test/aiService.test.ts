import { describe, it, expect, vi } from 'vitest';
import { generateCelebrAIPlan } from '../services/aiService';
import { generateDeterministicPlan } from '../services/offlinePlanner';
import { EventCreationSchema } from '../types/schemas';

const input = EventCreationSchema.parse({
  title: 'Client generation contract', eventType: 'corporate_gala', guestCount: 100,
  totalBudget: 25000, eventDate: '2026-12-18', location: 'City Hall', venueType: 'ballroom',
  specialNotes: 'Email host@example.com or call 415-555-2671.',
});
const serverPlan = generateDeterministicPlan(input);
serverPlan.theme.conceptTitle = 'A plan returned by the server';

function respond(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('AI response validation and deterministic fallback', () => {
  it('accepts a validated live response and reports the actual model', async () => {
    respond({ success: true, mode: 'live_ai', model: 'verified-model', data: serverPlan });
    const result = await generateCelebrAIPlan(input);
    expect(result.mode).toBe('live');
    expect(result.sourceMessage).toContain('verified-model');
    expect(result.plan.theme.conceptTitle).toBe('A plan returned by the server');
  });

  it('accepts a validated server fallback without labelling it live', async () => {
    respond({ success: true, mode: 'offline_fallback', data: serverPlan });
    const result = await generateCelebrAIPlan(input);
    expect(result.mode).toBe('offline');
    expect(result.sourceMessage).toContain('Server deterministic fallback');
    expect(result.plan.theme.conceptTitle).toBe('A plan returned by the server');
  });

  it.each([429, 503])('provides a usable local plan after HTTP %i', async status => {
    respond({ error: 'Unavailable' }, status);
    const result = await generateCelebrAIPlan(input);
    expect(result.mode).toBe('offline');
    expect(result.plan.allocations.reduce((sum, item) => sum + item.allocatedCents, 0)).toBe(2500000);
    expect(result.sourceMessage).toContain('Deterministic calculation engine');
  });

  it.each([
    { name: 'unknown mode', body: { success: true, mode: 'unexpected-mode', data: serverPlan } },
    { name: 'missing live model', body: { success: true, mode: 'live_ai', data: serverPlan } },
    { name: 'invalid plan', body: { success: true, mode: 'live_ai', model: 'verified-model', data: {} } },
    { name: 'unsuccessful envelope', body: { success: false, mode: 'offline_fallback', data: serverPlan } },
    { name: 'null response', body: null },
  ])('rejects $name instead of using its data', async ({ body }) => {
    respond(body);
    const result = await generateCelebrAIPlan(input);
    expect(result.mode).toBe('offline');
    expect(result.plan.theme.conceptTitle).not.toBe('A plan returned by the server');
    expect(result.plan.allocations.reduce((sum, item) => sum + item.allocatedCents, 0)).toBe(2500000);
  });

  it('falls back when the response is not valid JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not JSON')));
    const result = await generateCelebrAIPlan(input);
    expect(result.mode).toBe('offline');
    expect(result.sourceMessage).toContain('Local deterministic engine');
  });

  it('falls back after an explicit network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network unavailable')));
    const result = await generateCelebrAIPlan(input);
    expect(result.mode).toBe('offline');
    expect(result.sourceMessage).toContain('Local deterministic engine');
  });

  it('aborts a stalled request and returns a reconciled offline plan', async () => {
    const nativeTimeout = AbortSignal.timeout.bind(AbortSignal);
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockImplementationOnce(delay => {
      expect(delay).toBe(25000);
      return nativeTimeout(5);
    });
    vi.stubGlobal('fetch', vi.fn((_url, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(options.signal?.reason), { once: true });
    })));
    const result = await generateCelebrAIPlan(input);
    expect(timeout).toHaveBeenCalledOnce();
    expect(result.mode).toBe('offline');
    expect(result.plan.allocations.reduce((sum, item) => sum + item.allocatedCents, 0)).toBe(2500000);
  });

  it('sends only the sanitized event brief', async () => {
    const fetchMock = respond({ success: true, mode: 'offline_fallback', data: serverPlan });
    await generateCelebrAIPlan({ ...input, guestRoster: ['Private guest'] } as typeof input);
    const request = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(request.action).toBe('generate_full_plan');
    expect(request.eventData.specialNotes).toContain('[REDACTED_EMAIL]');
    expect(request.eventData.specialNotes).toContain('[REDACTED_PHONE]');
    expect(request.eventData).not.toHaveProperty('guestRoster');
    expect(JSON.stringify(request)).not.toContain('host@example.com');
    expect(JSON.stringify(request)).not.toContain('Private guest');
  });
});
