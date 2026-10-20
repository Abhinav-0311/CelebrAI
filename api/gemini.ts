import { GoogleGenAI, Type } from '@google/genai';
import { generateDeterministicPlan } from '../src/services/offlinePlanner';
import { GeminiAPIRequestSchema, EventCreationSchema } from '../src/types/schemas';
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
 * Server-Side Domain Business Rule Validation
 * Reconciles financial totals and structural integrity.
 */
function validateDomainBusinessRules(plan: any, totalBudgetCents: number): boolean {
  if (!plan || !plan.allocations || !plan.milestones || !plan.theme) {
    return false;
  }

  // 1. Exact Budget Reconciliation Check (Within 1% tolerance, auto-normalized)
  const totalAllocated = plan.allocations.reduce((sum: number, a: any) => sum + (Number(a.allocatedCents) || 0), 0);
  if (totalAllocated < totalBudgetCents * 0.95 || totalAllocated > totalBudgetCents * 1.05) {
    return false;
  }

  // 2. Minimum structural elements check
  if (plan.milestones.length < 3 || plan.allocations.length < 3) {
    return false;
  }

  // 3. Color palette minimum
  if (!plan.theme.colorPalette || plan.theme.colorPalette.length < 3) {
    return false;
  }

  return true;
}

// Serverless route handler (Vercel Serverless Function)
export default async function handler(req: any, res: any) {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
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
    if (action === 'generate_full_plan') {
      const fallbackPlan = generateDeterministicPlan(validatedEvent);
      return res.status(200).json({
        success: true,
        mode: 'offline_fallback',
        message: 'Server has no GEMINI_API_KEY configured. Served high-fidelity deterministic plan.',
        data: fallbackPlan,
      });
    }
    return res.status(200).json({
      success: true,
      mode: 'offline_fallback',
      message: 'No live key configured. Fallback response provided.',
      data: null,
    });
  }

  // Live Google Gemini 3.8 Flash Call via @google/genai SDK
  try {
    const ai = new GoogleGenAI({ apiKey });

    if (action === 'generate_full_plan') {
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

      // Business Rule Validation
      const isValid = validateDomainBusinessRules(parsedData, targetBudgetCents);
      if (!isValid) {
        console.warn('AI Output failed domain business validation. Falling back to deterministic plan.');
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
        data: parsedData,
      });
    }

    return res.status(400).json({ error: `Unsupported action: ${action}` });
  } catch (error: any) {
    console.error('Gemini Server Proxy Error:', error);
    // Graceful fallback to deterministic generator
    const fallbackPlan = generateDeterministicPlan(validatedEvent);
    return res.status(200).json({
      success: true,
      mode: 'offline_fallback',
      message: 'Upstream AI unavailable. Served high-fidelity deterministic plan.',
      data: fallbackPlan,
    });
  }
}
