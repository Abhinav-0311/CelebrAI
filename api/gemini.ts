import { GoogleGenAI, Type, type Schema } from '@google/genai';
import type { IncomingHttpHeaders } from 'node:http';
import {
  EventCreationSchema,
  GeminiAPIRequestSchema,
  ColorPaletteItemSchema,
  AIBudgetAllocationSchema,
  AITimelineMilestoneSchema,
  AIVendorCategorySchema,
  AICreativeSuiteSchema,
} from '../src/types/schemas.js';
import { dollarsToCents } from '../src/types/event.js';
import { generateDeterministicPlan } from '../src/services/offlinePlanner.js';
import { validateAndNormalizeDomainPlan } from '../src/services/planValidation.js';

export interface GeminiRequest {
  method?: string;
  headers?: IncomingHttpHeaders;
  body?: unknown;
  socket?: { remoteAddress?: string };
}

export interface GeminiResponse {
  setHeader(name: string, value: string): unknown;
  status(code: number): GeminiResponse;
  json(body: unknown): unknown;
  end(): unknown;
}

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
              role: {
                type: Type.STRING,
                enum: ColorPaletteItemSchema.shape.role.options,
              },
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
          category: {
            type: Type.STRING,
            enum: AIBudgetAllocationSchema.shape.category.options,
          },
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
          category: {
            type: Type.STRING,
            enum: AITimelineMilestoneSchema.shape.category.options,
          },
          assignedTo: { type: Type.STRING },
          notes: { type: Type.STRING },
          status: {
            type: Type.STRING,
            enum: AITimelineMilestoneSchema.shape.status.removeDefault().options,
          },
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
          category: {
            type: Type.STRING,
            enum: AIVendorCategorySchema.shape.category.options,
          },
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
              style: {
                type: Type.STRING,
                enum: AICreativeSuiteSchema.shape.invitations.element.shape.style.options,
              },
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
              tone: {
                type: Type.STRING,
                enum: AICreativeSuiteSchema.shape.speeches.element.shape.tone.options,
              },
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
} satisfies Schema;

/**
 * Best-Effort In-Process Rate Limiter (Secondary Layer)
 * Tracks request timestamps in a local sliding-window per container instance.
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

/**
 * Serverless route handler (Vercel Serverless Function)
 */
export default async function handler(req: GeminiRequest, res: GeminiResponse) {
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

  if (action !== 'generate_full_plan') {
    return res.status(400).json({ error: `Unsupported action: ${action}` });
  }

  const eventValidation = EventCreationSchema.safeParse(eventData);
  if (!eventValidation.success) {
    return res.status(400).json({
      error: 'Invalid eventData parameters.',
      details: eventValidation.error.issues,
    });
  }

  const validatedEvent = eventValidation.data;
  const apiKey = process.env.GEMINI_API_KEY;
  const targetBudgetCents = dollarsToCents(validatedEvent.totalBudget);

  // Transparent Deterministic Fallback if API key is not configured
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not configured on server. Returning deterministic plan.');
    const fallbackPlan = generateDeterministicPlan(validatedEvent);
    return res.status(200).json({
      success: true,
      mode: 'offline_fallback',
      message: 'Generated using deterministic algorithmic domain engine (No server API key set).',
      data: fallbackPlan,
    });
  }

  // Total Upstream AI Execution Budget (20 seconds total across all attempts)
  // Guarantees at least 10s headroom before Vercel's 30-second serverless timeout
  const TOTAL_UPSTREAM_AI_BUDGET_MS = 20000;
  const MIN_CANDIDATE_ALLOWANCE_MS = 4000;
  const handlerStartTime = Date.now();

  // Try the configured model between the default primary and final fallback.
  const candidateModels = ['gemini-3.5-flash-lite'];
  if (process.env.GEMINI_MODEL && !candidateModels.includes(process.env.GEMINI_MODEL)) {
    candidateModels.push(process.env.GEMINI_MODEL);
  }
  if (!candidateModels.includes('gemini-3.8-flash')) {
    candidateModels.push('gemini-3.8-flash');
  }

  const prompt = `
You are the AI engine of CelebrAI, a world-class celebration planning platform.
Generate a cohesive, complete, and financially reconciled celebration plan based on these parameters:
- Event Title: "${validatedEvent.title}"
- Event Type: ${validatedEvent.eventType}
- Guest Count: ${validatedEvent.guestCount}
- Total Budget: $${validatedEvent.totalBudget} (${targetBudgetCents} integer cents)
- Date: ${validatedEvent.eventDate}
- Timezone: ${validatedEvent.timezone}
- Location: ${validatedEvent.location}
- Venue Type: ${validatedEvent.venueType}
- Vibe / Aesthetic: ${validatedEvent.vibeKeywords.join(', ')}
${validatedEvent.specialNotes ? `- Notes: ${validatedEvent.specialNotes}` : ''}

CRITICAL BUSINESS & SCHEMA CONSTRAINTS (CONCISE & IMPACTFUL FOR FAST INFERENCE):
1. Allocations: Exactly divide total budget (${targetBudgetCents} cents). Provide 4-5 core categories (from: venue, catering, entertainment, photography, contingency). Percentages must sum to ~100.
2. Milestones: Provide 4 key chronological timeline moments (from: setup, ceremony, meal, teardown) with concise notes.
3. Vendor Categories: Provide 2 essential categories (from: venue, catering, photography, entertainment, florist_decor) with 2 checklist tasks and a 1-sentence inquiry draft.
4. Creative: Provide 2 distinct invitations (formal and warm), 1 concise heartfelt toast speech (under 75 words), 2 playlist vibes, and 1 party game.
`;

  let lastError: string | null = null;
  const candidateDiagnostics: Array<{
    model: string;
    durationMs: number;
    error?: string;
  }> = [];

  for (const modelName of candidateModels) {
    const elapsedSinceStart = Date.now() - handlerStartTime;
    const remainingBudgetMs = TOTAL_UPSTREAM_AI_BUDGET_MS - elapsedSinceStart;

    if (remainingBudgetMs < MIN_CANDIDATE_ALLOWANCE_MS) {
      console.warn(
        `[CelebrAI Serverless] Insufficient upstream AI budget remaining (${remainingBudgetMs}ms) for candidate '${modelName}'. Terminating cascade to allow deterministic fallback.`
      );
      break;
    }

    const candidateTimeoutMs = Math.min(remainingBudgetMs, 14000);
    const startTime = Date.now();

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { timeout: candidateTimeoutMs },
      });

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: planResponseSchema,
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      });

      const rawText = response.text;
      if (!rawText) {
        throw new Error(`Model ${modelName} returned empty text response.`);
      }

      const parsedJson: unknown = JSON.parse(rawText);
      const normalizedPlan = validateAndNormalizeDomainPlan(parsedJson, targetBudgetCents, validatedEvent);

      if (!normalizedPlan) {
        const valIssue = `Plan normalization rejected raw AI JSON for ${modelName}`;
        console.warn(valIssue);
        candidateDiagnostics.push({
          model: modelName,
          durationMs: Date.now() - startTime,
          error: valIssue,
        });
        continue;
      }

      // Explicit Contract: mode is "live_ai" on successful model generation
      return res.status(200).json({
        success: true,
        mode: 'live_ai',
        model: modelName,
        data: normalizedPlan,
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      lastError = errMsg;
      console.warn(`Gemini API candidate '${modelName}' failed:`, errMsg);
      candidateDiagnostics.push({
        model: modelName,
        durationMs: Date.now() - startTime,
        error: errMsg,
      });
      // Continue to next candidate model if 503 or transient failure
    }
  }

  // Graceful error masking with deterministic fallback if all candidate models fail
  // Detailed diagnostics are kept strictly in server-side logs; safe public response is returned
  console.error('[CelebrAI Serverless] Upstream Gemini AI cascade exhausted:', lastError);
  if (candidateDiagnostics.length > 0) {
    console.warn('[CelebrAI Serverless] Candidate attempts:', JSON.stringify(candidateDiagnostics));
  }

  const fallbackPlan = generateDeterministicPlan(validatedEvent);
  return res.status(200).json({
    success: true,
    mode: 'offline_fallback',
    message: 'CelebrAI adaptive offline planner generated this reconciled event plan.',
    data: fallbackPlan,
  });
}
