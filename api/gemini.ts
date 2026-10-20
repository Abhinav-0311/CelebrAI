import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateDeterministicPlan } from '../src/services/offlinePlanner';

/**
 * Server-Side Domain Business Validation
 * Validates logical invariants beyond raw JSON syntax.
 */
function validateDomainBusinessRules(plan: any, totalBudget: number): boolean {
  if (!plan || !plan.allocations || !plan.milestones || !plan.theme) {
    return false;
  }

  // 1. Total allocated must not exceed budget by more than 2%
  const totalAllocated = plan.allocations.reduce((sum: number, a: any) => sum + (Number(a.allocatedAmount) || 0), 0);
  if (totalAllocated > totalBudget * 1.05) {
    return false;
  }

  // 2. Must contain at least 3 milestones and 3 allocations
  if (plan.milestones.length < 3 || plan.allocations.length < 3) {
    return false;
  }

  // 3. Color palette must have at least 3 entries
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

  try {
    const { action, eventData } = req.body || {};

    if (!action || !eventData) {
      return res.status(400).json({ error: 'Missing required fields: action and eventData.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    // Transparent Fallback: If no live key is present on the server, safely return deterministic output
    if (!apiKey) {
      if (action === 'generate_full_plan') {
        const fallbackPlan = generateDeterministicPlan(eventData);
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

    // Call live Google Gemini API with 15s timeout
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    if (action === 'generate_full_plan') {
      const prompt = `
You are the world's leading Celebration & Event Architect for CelebrAI.
Generate a comprehensive, cohesive, end-to-end event plan for:
Event Title: "${eventData.title}"
Event Type: "${eventData.eventType}"
Guest Count: ${eventData.guestCount}
Total Budget: $${eventData.totalBudget} (${eventData.currency || 'USD'})
Date: ${eventData.eventDate}
Location: "${eventData.location}"
Venue Type: "${eventData.venueType}"
Vibe Keywords: ${JSON.stringify(eventData.vibeKeywords || [])}
Special Notes: "${eventData.specialNotes || 'None'}"

You MUST output ONLY a valid JSON object matching this exact schema:
{
  "theme": {
    "conceptTitle": "string",
    "conceptDescription": "string",
    "colorPalette": [
      { "name": "string", "hex": "#HEX", "role": "primary" | "secondary" | "accent" | "neutral" | "highlight" }
    ],
    "dressCode": "string",
    "decorStyle": "string",
    "ambianceLighting": "string",
    "signatureDrink": "string",
    "centerpieceConcept": "string"
  },
  "allocations": [
    { "id": "alloc-1", "category": "venue" | "catering" | "decor" | "entertainment" | "photography" | "attire" | "favors" | "contingency", "name": "string", "percentage": number, "allocatedAmount": number, "actualSpent": 0 }
  ],
  "milestones": [
    { "id": "ms-1", "time": "14:00", "durationMinutes": 60, "title": "string", "category": "setup" | "ceremony" | "reception" | "keynote" | "meal" | "entertainment" | "speech" | "teardown", "assignedTo": "string", "notes": "string", "status": "pending" }
  ],
  "vendorCategories": [
    { "id": "vc-1", "category": "venue" | "catering" | "photography" | "entertainment" | "florist_decor" | "officiant_host" | "rentals", "name": "string", "recommendedBudget": number, "checklist": [{ "id": "vck-1", "task": "string", "isCompleted": false }], "inquiryDraft": "string" }
  ],
  "creative": {
    "invitations": [
      { "id": "inv-1", "style": "formal" | "warm" | "poetic" | "playful", "headline": "string", "body": "string", "rsvpCallToAction": "string", "dressCodeNote": "string" }
    ],
    "speeches": [
      { "id": "sp-1", "speakerRole": "string", "tone": "heartfelt" | "humorous" | "inspiring" | "nostalgic", "estimatedDuration": "3 minutes", "keyHighlights": ["string"], "content": "string" }
    ],
    "playlistVibes": ["string"],
    "partyGames": ["string"]
  }
}
      `.trim();

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsedData = JSON.parse(text);

      // Validate Domain Business Rules
      const isValidDomain = validateDomainBusinessRules(parsedData, eventData.totalBudget);
      if (!isValidDomain) {
        console.warn('AI Output failed domain business validation. Falling back to deterministic plan.');
        const fallbackPlan = generateDeterministicPlan(eventData);
        return res.status(200).json({
          success: true,
          mode: 'offline_fallback',
          message: 'AI output failed domain business rules; high-fidelity fallback delivered.',
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
    // Safe degradation to fallback on quota / error
    if (req.body?.eventData) {
      const fallbackPlan = generateDeterministicPlan(req.body.eventData);
      return res.status(200).json({
        success: true,
        mode: 'offline_fallback',
        message: 'Upstream AI unavailable. Served high-fidelity deterministic plan.',
        data: fallbackPlan,
      });
    }

    return res.status(500).json({
      error: 'Failed to process AI request through secure proxy.',
      message: 'Internal server error',
    });
  }
}
