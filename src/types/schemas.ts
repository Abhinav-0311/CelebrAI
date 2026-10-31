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
  totalBudget: z.number().min(100, 'Budget must be at least $100').max(10000000),
  currency: z.string().default('USD'),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  timezone: z.string().default('America/Los_Angeles'),
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
  colorPalette: z.array(ColorPaletteItemSchema).min(3),
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
  allocatedCents: z.number().int().min(0),
  actualSpentCents: z.number().int().default(0),
});

export const AITimelineMilestoneSchema = z.object({
  id: z.string(),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM format'),
  durationMinutes: z.number().int().positive(),
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
  recommendedBudgetCents: z.number().int().min(0),
  checklist: z.array(z.object({
    id: z.string(),
    task: z.string(),
    isCompleted: z.boolean().default(false),
  })),
  inquiryDraft: z.string(),
  needsReview: z.boolean().optional(),
  reviewReason: z.string().optional(),
});

export const AICreativeSuiteSchema = z.object({
  invitations: z.array(z.object({
    id: z.string(),
    style: z.enum(['formal', 'warm', 'poetic', 'playful']),
    headline: z.string(),
    body: z.string(),
    rsvpCallToAction: z.string(),
    dressCodeNote: z.string(),
    needsReview: z.boolean().optional(),
    reviewReason: z.string().optional(),
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

export const GeminiPlanResponseSchema = z.discriminatedUnion('mode', [
  z.object({
    success: z.literal(true), mode: z.literal('live_ai'), model: z.string().min(1),
    data: AIEventPlanResponseSchema,
  }),
  z.object({
    success: z.literal(true), mode: z.literal('offline_fallback'), message: z.string().optional(),
    data: AIEventPlanResponseSchema,
  }),
]);

export const AdaptiveRippleSchema = z.object({
  id: z.string(),
  triggerType: z.enum(['guest_count_change', 'budget_change', 'date_change']),
  previousValue: z.union([z.number().finite(), z.string()]),
  newValue: z.union([z.number().finite(), z.string()]),
  title: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  impactSummary: z.string(),
  calculatedDiffs: z.object({
    cateringDeltaCents: z.number().int(),
    seatingDeltaTables: z.number().int(),
    budgetVarianceCents: z.number().int(),
  }),
  recommendedActions: z.array(z.object({
    actionType: z.enum(['update_budget', 'recalculate_catering', 'adjust_tables', 'update_timeline']),
    description: z.string(),
    // Legacy metadata is preserved; the adaptive engine recomputes changes instead of applying it.
    patchData: z.record(z.unknown()).optional(),
  })),
  status: z.enum(['pending_review', 'applied', 'dismissed']),
  createdAt: z.string(),
}).superRefine((ripple, context) => {
  for (const key of ['previousValue', 'newValue'] as const) {
    const value = ripple[key];
    const valid = ripple.triggerType === 'date_change'
      ? typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      : typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
    if (!valid) context.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: 'Invalid value for ripple trigger' });
  }
});

// Complete CelebrAI Event Schema for JSON import/export validation
export const CelebrAIEventSchema = z.object({
  schemaVersion: z.number().int().default(1),
  id: z.string(),
  title: z.string(),
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
  guestCount: z.number().int().positive(),
  eventDate: z.string(),
  timezone: z.string().default('America/Los_Angeles'),
  location: z.string(),
  venueType: z.string(),
  vibeKeywords: z.array(z.string()),
  status: z.enum(['draft', 'planning', 'ready', 'live', 'completed']),
  theme: AIEventThemeSchema,
  budget: z.object({
    totalBudgetCents: z.number().int().positive(),
    currency: z.string(),
    allocations: z.array(AIBudgetAllocationSchema),
    expenses: z.array(z.object({
      id: z.string(),
      allocationId: z.string(),
      name: z.string(),
      category: z.enum(['venue', 'catering', 'decor', 'entertainment', 'photography', 'attire', 'favors', 'contingency']),
      estimatedCents: z.number().int().min(0),
      actualCents: z.number().int().min(0),
      vendor: z.string().optional(),
      isPaid: z.boolean(),
      notes: z.string().optional(),
      createdAt: z.string(),
    })),
    contingencyRate: z.number(),
  }),
  guests: z.object({
    list: z.array(z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().optional(),
      phone: z.string().optional(),
      rsvpStatus: z.enum(['attending', 'declined', 'pending']),
      plusOnes: z.number().int().min(0).default(0),
      dietary: z.array(z.string()),
      dietaryNotes: z.string().optional(),
      tableNumber: z.number().optional(),
      isVip: z.boolean().optional(),
    })),
    dietarySummary: z.object({
      totalInvited: z.number().int().min(0),
      confirmedAttending: z.number().int().min(0),
      confirmedVegan: z.number().int().min(0),
      confirmedVegetarian: z.number().int().min(0),
      confirmedGlutenFree: z.number().int().min(0),
      confirmedHalal: z.number().int().min(0),
      confirmedNutAllergy: z.number().int().min(0),
      potentialDietaryCount: z.number().int().min(0),
      otherCount: z.number().int().min(0),
    }),
    targetTableCapacity: z.number().int().positive().default(10),
  }),
  timeline: z.object({
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    timezone: z.string(),
    milestones: z.array(AITimelineMilestoneSchema),
    isDayOfLiveActive: z.boolean(),
  }),
  vendors: z.object({
    categories: z.array(AIVendorCategorySchema),
  }),
  creative: AICreativeSuiteSchema,
  pendingRipples: z.array(AdaptiveRippleSchema),
  appliedRipplesCount: z.number().int().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// API request schema for /api/gemini
export const GeminiAPIRequestSchema = z.object({
  action: z.enum(['generate_full_plan', 'adaptive_ripple_recs', 'generate_speech', 'generate_invitation']),
  eventData: z.record(z.unknown()),
  options: z.record(z.unknown()).optional(),
});

export type GeminiAPIRequest = z.infer<typeof GeminiAPIRequestSchema>;
