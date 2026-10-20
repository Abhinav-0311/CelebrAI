import { z } from 'zod';

export const EventCreationSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(80),
  eventType: z.enum([
    'wedding',
    'birthday',
    'anniversary',
    'corporate_gala',
    'baby_shower',
    'graduation',
    'festival',
    'themed_party',
  ]),
  guestCount: z.number().int().min(2, 'Guest count must be at least 2').max(5000),
  totalBudget: z.number().min(100, 'Budget must be at least 100').max(10000000),
  currency: z.string().default('USD'),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  location: z.string().min(2, 'Location is required'),
  venueType: z.enum([
    'indoor',
    'outdoor',
    'ballroom',
    'beach',
    'garden',
    'restaurant',
    'rooftop',
    'private_residence',
  ]),
  vibeKeywords: z.array(z.string()).default([]),
  specialNotes: z.string().optional(),
});

export type EventCreationInput = z.infer<typeof EventCreationSchema>;

export const ColorPaletteItemSchema = z.object({
  name: z.string(),
  hex: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a valid hex color'),
  role: z.enum(['primary', 'secondary', 'accent', 'neutral', 'highlight']),
});

export const AIEventThemeSchema = z.object({
  conceptTitle: z.string(),
  conceptDescription: z.string(),
  colorPalette: z.array(ColorPaletteItemSchema),
  dressCode: z.string(),
  decorStyle: z.string(),
  ambianceLighting: z.string(),
  signatureDrink: z.string().optional(),
  centerpieceConcept: z.string().optional(),
});

export const AIBudgetAllocationSchema = z.object({
  id: z.string(),
  category: z.enum(['venue', 'catering', 'decor', 'entertainment', 'photography', 'attire', 'favors', 'contingency']),
  name: z.string(),
  percentage: z.number().min(0).max(100),
  allocatedAmount: z.number().min(0),
  actualSpent: z.number().default(0),
});

export const AITimelineMilestoneSchema = z.object({
  id: z.string(),
  time: z.string(),
  durationMinutes: z.number(),
  title: z.string(),
  category: z.enum(['setup', 'ceremony', 'reception', 'keynote', 'meal', 'entertainment', 'speech', 'teardown']),
  assignedTo: z.string(),
  notes: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
});

export const AIVendorCategorySchema = z.object({
  id: z.string(),
  category: z.enum(['venue', 'catering', 'photography', 'entertainment', 'florist_decor', 'officiant_host', 'rentals']),
  name: z.string(),
  recommendedBudget: z.number(),
  checklist: z.array(z.object({
    id: z.string(),
    task: z.string(),
    isCompleted: z.boolean().default(false),
  })),
  inquiryDraft: z.string(),
});

export const AICreativeSuiteSchema = z.object({
  invitations: z.array(z.object({
    id: z.string(),
    style: z.enum(['formal', 'warm', 'poetic', 'playful']),
    headline: z.string(),
    body: z.string(),
    rsvpCallToAction: z.string(),
    dressCodeNote: z.string(),
  })),
  speeches: z.array(z.object({
    id: z.string(),
    speakerRole: z.string(),
    tone: z.enum(['heartfelt', 'humorous', 'inspiring', 'nostalgic']),
    estimatedDuration: z.string(),
    keyHighlights: z.array(z.string()),
    content: z.string(),
  })),
  playlistVibes: z.array(z.string()),
  partyGames: z.array(z.string()),
});

// Full AI Event Plan Structured Output Schema
export const AIEventPlanResponseSchema = z.object({
  theme: AIEventThemeSchema,
  allocations: z.array(AIBudgetAllocationSchema),
  milestones: z.array(AITimelineMilestoneSchema),
  vendorCategories: z.array(AIVendorCategorySchema),
  creative: AICreativeSuiteSchema,
});

export type AIEventPlanResponse = z.infer<typeof AIEventPlanResponseSchema>;

// API request schema for /api/gemini
export const GeminiAPIRequestSchema = z.object({
  action: z.enum(['generate_full_plan', 'adaptive_ripple_recs', 'generate_speech', 'generate_invitation']),
  eventData: z.record(z.any()),
  options: z.record(z.any()).optional(),
});

export type GeminiAPIRequest = z.infer<typeof GeminiAPIRequestSchema>;
