import { describe, it, expect } from 'vitest';
import handler from '../../api/gemini';

function createMockReqRes(method: string, body: any) {
  const req: any = {
    method,
    body,
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
  it('rejects unsupported HTTP methods with 405 Method Not Allowed', async () => {
    const { req, res } = createMockReqRes('GET', {});
    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.bodyData.error).toContain('Method Not Allowed');
  });

  it('rejects oversized request payloads exceeding 25 KB with 413', async () => {
    // Construct 30 KB payload
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
    // Ensure no key is set for this test
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

    // Restore key
    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
  });
});
