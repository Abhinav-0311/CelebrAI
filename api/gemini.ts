import { GoogleGenAI, Type } from '@google/genai';
import { generateDeterministicPlan, reconcileBudgetCents } from '../src/services/offlinePlanner';
import {
  GeminiAPIRequestSchema,
  EventCreationSchema,
  AIEventPlanResponseSchema,
  AIEventPlanResponse,
} from '../src/types/schemas';
import { dollarsToCents } from '../src/types/event';

// Strict machine-readable response schema for gemini-3.8-flash structured output
const planResponseSchema = {
  type: Type.OBJECT,
  properties: {
    theme: {
      type: Type.OBJECT,
      properties: {
        conceptTitle: { type: Type.STRING },
        conceptDescription: { type: Type.STRING },
        colorPalette: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              hex: { type: Type.STRING },
              role: { type: Type.STRING },
            },
            required: ['name', 'hex', 'role'],
          },
        },
        dressCode: { type: Type.STRING },
        decorStyle: { type: Type.STRING },
        ambianceLighting: { type: Type.STRING },
        signatureDrink: { type: Type.STRING },
        centerpieceConcept: { type: Type.STRING },
      },
      required: ['conceptTitle', 'conceptDescription', 'colorPalette', 'dressCode', 'decorStyle', 'ambianceLighting'],
    },
    allocations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          category: { type: Type.STRING },
          name: { type: Type.STRING },
          percentage: { type: Type.NUMBER },
          allocatedCents: { type: Type.INTEGER },
          actualSpentCents: { type: Type.INTEGER },
        },
        required: ['id', 'category', 'name', 'percentage', 'allocatedCents'],
      },
    },
    milestones: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          time: { type: Type.STRING },
          durationMinutes: { type: Type.INTEGER },
          title: { type: Type.STRING },
          category: { type: Type.STRING },
          assignedTo: { type: Type.STRING },
          notes: { type: Type.STRING },
          status: { type: Type.STRING },
        },
        required: ['id', 'time', 'durationMinutes', 'title', 'category', 'assignedTo'],
      },
    },
    vendorCategories: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          category: { type: Type.STRING },
          name: { type: Type.STRING },
          recommendedBudgetCents: { type: Type.INTEGER },
          checklist: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                task: { type: Type.STRING },
                isCompleted: { type: Type.BOOLEAN },
              },
              required: ['id', 'task'],
            },
          },
          inquiryDraft: { type: Type.STRING },
        },
        required: ['id', 'category', 'name', 'recommendedBudgetCents', 'checklist', 'inquiryDraft'],
      },
    },
    creative: {
      type: Type.OBJECT,
      properties: {
        invitations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              style: { type: Type.STRING },
              headline: { type: Type.STRING },
              body: { type: Type.STRING },
              rsvpCallToAction: { type: Type.STRING },
              dressCodeNote: { type: Type.STRING },
            },
            required: ['id', 'style', 'headline', 'body', 'rsvpCallToAction', 'dressCodeNote'],
          },
        },
        speeches: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              speakerRole: { type: Type.STRING },
              tone: { type: Type.STRING },
              estimatedDuration: { type: Type.STRING },
              keyHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
              content: { type: Type.STRING },
            },
            required: ['id', 'speakerRole', 'tone', 'estimatedDuration', 'keyHighlights', 'content'],
          },
        },
        playlistVibes: { type: Type.ARRAY, items: { type: Type.STRING } },
        partyGames: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['invitations', 'speeches', 'playlistVibes', 'partyGames'],
    },
  },
  required: ['theme', 'allocations', 'milestones', 'vendorCategories', 'creative'],
};

/**
 * Server-Side Domain Business Rule Validation & Allocation Normalization
 * Reconciles financial totals with zero-cent drift and ensures structural integrity.
 */
function validateAndNormalizeDomainPlan(
  planData: any,
  targetBudgetCents: number
): AIEventPlanResponse | null {
  if (!planData) return null;

  // 1. Structural Zod Validation
  const schemaResult = AIEventPlanResponseSchema.safeParse(planData);
  if (!schemaResult.success) {
    console.warn('AI Output failed Zod schema validation:', schemaResult.error.issues);
    return null;
  }

  const plan = schemaResult.data;

  // 2. Minimum structural elements check
  if (
    !plan.allocations ||
    plan.allocations.length < 3 ||
    !plan.milestones ||
    plan.milestones.length < 3 ||
    !plan.theme?.colorPalette ||
    plan.theme.colorPalette.length < 3
  ) {
    console.warn('AI Output failed minimum structural element counts');
    return null;
  }

  // Deduplicate allocations by category to prevent duplicate collision
  const seenCategories = new Set<string>();
  const uniqueAllocations: typeof plan.allocations = [];
  for (const alloc of plan.allocations) {
    if (!seenCategories.has(alloc.category)) {
      seenCategories.add(alloc.category);
      uniqueAllocations.push(alloc);
    }
  }

  if (uniqueAllocations.length < 3) {
    console.warn('AI Output contained excessive duplicate categories; valid allocations dropped below 3');
    return null;
  }

  // 3. Exact Budget Normalization: Single-Cent Reconciliation
  const totalRawAllocated = uniqueAllocations.reduce(
    (sum, a) => sum + (Number(a.allocatedCents) || 0),
    0
  );

  if (totalRawAllocated <= 0) {
    console.warn('AI Output produced non-positive allocation sum:', totalRawAllocated);
    return null;
  }

  // Use largest-remainder reconciliation to guarantee sum(allocatedCents) === targetBudgetCents
  const categoriesForReconcile = uniqueAllocations.map((a) => ({
    category: a.category,
    name: a.name,
    pct: a.percentage > 0 ? a.percentage : (a.allocatedCents / totalRawAllocated) * 100,
  }));

  const reconciled = reconcileBudgetCents(targetBudgetCents, categoriesForReconcile);
  // Match strictly by array index to guarantee 1:1 pairing and prevent collision
  const reconciledAllocations = uniqueAllocations.map((orig, idx) => {
    const matched = reconciled[idx];
    return {
      ...orig,
      allocatedCents: matched ? matched.allocatedCents : orig.allocatedCents,
      percentage: matched ? matched.percentage : orig.percentage,
    };
  });

  // Strict Invariant Assertion: Sum of reconciled allocations must match targetBudgetCents to 0 cents drift
  const finalReconciledSum = reconciledAllocations.reduce((sum, a) => sum + a.allocatedCents, 0);
  if (finalReconciledSum !== targetBudgetCents) {
    console.warn(
      `Reconciliation invariant assertion failed: sum (${finalReconciledSum}) !== target (${targetBudgetCents})`
    );
    return null;
  }

  return {
    ...plan,
    allocations: reconciledAllocations,
  };
}

/**
 * Best-Effort In-Process Rate Limiter (Secondary Layer)
 * Tracks request timestamps in a local sliding-window per container instance.
 * Note: In serverless environments with multi-instance scaling, global distributed
 * enforcement is handled via Vercel Firewall / WAF rules.
 */
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const ipRequestHistory = new Map<string, number[]>();

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const history = ipRequestHistory.get(ip) || [];

  const activeHistory = history.filter((timestamp) => timestamp > windowStart);

  if (activeHistory.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = activeHistory[0];
    const resetMs = Math.max(0, oldest + RATE_LIMIT_WINDOW_MS - now);
    ipRequestHistory.set(ip, activeHistory);
    return { allowed: false, remaining: 0, resetMs };
  }

  activeHistory.push(now);
  ipRequestHistory.set(ip, activeHistory);

  if (ipRequestHistory.size > 1000) {
    for (const [key, timestamps] of ipRequestHistory.entries()) {
      if (timestamps.every((t) => t <= windowStart)) {
        ipRequestHistory.delete(key);
      }
    }
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - activeHistory.length,
    resetMs: RATE_LIMIT_WINDOW_MS,
  };
}

export function resetRateLimits() {
  ipRequestHistory.clear();
}

// Serverless route handler (Vercel Serverless Function)
export default async function handler(req: any, res: any) {
  // CORS & Security Headers (Standard uncredentialed wildcard CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // Trusted IP Extraction (Prioritize Vercel edge-provided x-real-ip)
  const clientIp = (req.headers && req.headers['x-real-ip'])
    ? String(req.headers['x-real-ip']).trim()
    : (req.headers && req.headers['x-forwarded-for'])
    ? String(req.headers['x-forwarded-for']).split(',')[0].trim()
    : req.socket?.remoteAddress || '127.0.0.1';

  const rateLimit = checkRateLimit(clientIp);
  res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
  res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));

  if (!rateLimit.allowed) {
    const retryAfter = Math.max(1, Math.ceil(rateLimit.resetMs / 1000));
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded (${MAX_REQUESTS_PER_WINDOW} reqs/min). Please retry after ${retryAfter}s.`,
      retryAfterSeconds: retryAfter,
    });
  }

  // Enforce Payload Size Cap (25 KB)
  const bodyString = JSON.stringify(req.body || {});
  if (bodyString.length > 25600) {
    return res.status(413).json({ error: 'Payload Too Large. Max request size is 25 KB.' });
  }

  // Request Validation via Zod
  const requestValidation = GeminiAPIRequestSchema.safeParse(req.body);
  if (!requestValidation.success) {
    return res.status(400).json({
      error: 'Invalid request payload schema.',
      details: requestValidation.error.issues,
    });
  }

  const { action, eventData } = requestValidation.data;

  // Strict check on supported actions
  if (action !== 'generate_full_plan') {
    return res.status(400).json({ error: `Unsupported action: ${action}` });
  }

  // Validate eventData parameters
  const eventValidation = EventCreationSchema.safeParse(eventData);
  if (!eventValidation.success) {
    return res.status(400).json({
      error: 'Invalid eventData parameters.',
      details: eventValidation.error.issues,
    });
  }

  const validatedEvent = eventValidation.data;
  const targetBudgetCents = dollarsToCents(validatedEvent.totalBudget);

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  // Transparent Offline Fallback: If no live key is configured
  if (!apiKey) {
    const fallbackPlan = generateDeterministicPlan(validatedEvent);
    return res.status(200).json({
      success: true,
      mode: 'offline_fallback',
      message: 'Server has no GEMINI_API_KEY configured. Served high-fidelity deterministic plan.',
      data: fallbackPlan,
    });
  }

  // Live Google Gemini 3.8 Flash Call via @google/genai SDK with 18s HTTP timeout
  // Function allows 30s total execution budget; 18s timeout provides ample structured generation
  // time while leaving a 12s safety margin for fallback
  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { timeout: 18000 },
    });

    const prompt = `
You are the world's leading Celebration & Event Architect for CelebrAI.
Generate a comprehensive, cohesive, end-to-end event plan for:
Event Title: "${validatedEvent.title}"
Event Type: "${validatedEvent.eventType}"
Guest Count: ${validatedEvent.guestCount}
Total Budget Cents: ${targetBudgetCents} (${validatedEvent.currency || 'USD'})
Date: ${validatedEvent.eventDate}
Location: "${validatedEvent.location}"
Venue Type: "${validatedEvent.venueType}"
Vibe Keywords: ${JSON.stringify(validatedEvent.vibeKeywords || [])}
Special Notes: "${validatedEvent.specialNotes || 'None'}"

Calculate all financial allocations in integer cents matching the total budget of ${targetBudgetCents} cents.
Output strictly according to the responseSchema provided.
    `.trim();

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: planResponseSchema,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response received from Gemini model.');
    }

    const parsedData = JSON.parse(responseText);

    // Business Rule Validation & Exact Single-Cent Rebalancing
    const normalizedPlan = validateAndNormalizeDomainPlan(parsedData, targetBudgetCents);
    if (!normalizedPlan) {
      console.warn('AI Output failed domain business validation or schema. Falling back to deterministic plan.');
      const fallbackPlan = generateDeterministicPlan(validatedEvent);
      return res.status(200).json({
        success: true,
        mode: 'offline_fallback',
        message: 'AI output failed domain business validation. Safe fallback plan served.',
        data: fallbackPlan,
      });
    }

    return res.status(200).json({
      success: true,
      mode: 'live_ai',
      model: modelName,
      data: normalizedPlan,
    });
  } catch (error: any) {
    console.error('Gemini Server Proxy Error (internal):', error?.message || error);
    // Safe graceful fallback to deterministic generator with sanitized error message
    const fallbackPlan = generateDeterministicPlan(validatedEvent);
    return res.status(200).json({
      success: true,
      mode: 'offline_fallback',
      message: 'Upstream AI engine currently unavailable. High-fidelity deterministic plan served safely.',
      data: fallbackPlan,
    });
  }
}
