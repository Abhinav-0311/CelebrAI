import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';

/**
 * Currency conversion helper (Integer Minor Currency Units)
 */
const dollarsToCents = (dollars: number): number => Math.round(dollars * 100);

/**
 * Zod Input & Output Schemas for Strict Server-Side Validation
 */
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

export const GeminiAPIRequestSchema = z.object({
  action: z.enum(['generate_full_plan', 'adaptive_ripple_recs', 'generate_speech', 'generate_invitation']),
  eventData: z.record(z.any()),
  options: z.record(z.any()).optional(),
});

export const AIEventPlanResponseSchema = z.object({
  theme: z.object({
    conceptTitle: z.string().min(1),
    conceptDescription: z.string().min(1),
    colorPalette: z
      .array(
        z.object({
          name: z.string(),
          hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Hex code must be #RRGGBB'),
          role: z.enum(['primary', 'secondary', 'accent', 'neutral', 'highlight']),
        })
      )
      .min(3),
    dressCode: z.string().min(1),
    decorStyle: z.string().min(1),
    ambianceLighting: z.string().min(1),
    signatureDrink: z.string().optional(),
    centerpieceConcept: z.string().optional(),
  }),
  allocations: z
    .array(
      z.object({
        id: z.string(),
        category: z.enum([
          'venue',
          'catering',
          'decor',
          'entertainment',
          'photography',
          'attire',
          'favors',
          'contingency',
        ]),
        name: z.string(),
        percentage: z.number().min(0).max(100),
        allocatedCents: z.number().int().min(0),
        actualSpentCents: z.number().int().min(0).default(0),
      })
    )
    .min(3),
  milestones: z
    .array(
      z.object({
        id: z.string(),
        time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
        durationMinutes: z.number().int().min(5),
        title: z.string().min(1),
        category: z.enum(['setup', 'ceremony', 'reception', 'meal', 'entertainment', 'speech', 'teardown']),
        assignedTo: z.string().min(1),
        notes: z.string().optional(),
        status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
      })
    )
    .min(3),
  vendorCategories: z.array(
    z.object({
      id: z.string(),
      category: z.enum([
        'venue',
        'catering',
        'decor',
        'entertainment',
        'photography',
        'attire',
        'favors',
        'contingency',
      ]),
      name: z.string(),
      recommendedBudgetCents: z.number().int().min(0),
      checklist: z.array(
        z.object({
          id: z.string(),
          task: z.string(),
          isCompleted: z.boolean().default(false),
        })
      ),
      inquiryDraft: z.string().min(1),
    })
  ),
  creative: z.object({
    invitations: z.array(
      z.object({
        id: z.string(),
        style: z.enum(['formal', 'warm', 'whimsical', 'modern']),
        headline: z.string(),
        body: z.string(),
        rsvpCallToAction: z.string(),
        dressCodeNote: z.string(),
      })
    ),
    speeches: z.array(
      z.object({
        id: z.string(),
        speakerRole: z.string(),
        tone: z.enum(['heartfelt', 'humorous', 'inspirational', 'formal']),
        estimatedDuration: z.string(),
        keyHighlights: z.array(z.string()),
        content: z.string(),
      })
    ),
    playlistVibes: z.array(z.string()),
    partyGames: z.array(z.string()).optional(),
  }),
});

export type AIEventPlanResponse = z.infer<typeof AIEventPlanResponseSchema>;

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
 * Largest-Remainder Method: Distributes total cents across percentage categories.
 * Mathematically guarantees that sum(allocatedCents) === totalBudgetCents to 0 cents drift.
 */
export function reconcileBudgetCents(
  totalBudgetCents: number,
  percentages: { category: any; name: string; pct: number }[]
): { id: string; category: any; name: string; percentage: number; allocatedCents: number; actualSpentCents: number }[] {
  const totalPct = percentages.reduce((sum, p) => sum + p.pct, 0);

  const allocationsWithRemainder = percentages.map((p, idx) => {
    const rawCents = (totalBudgetCents * p.pct) / totalPct;
    const floorCents = Math.floor(rawCents);
    const fractionalRemainder = rawCents - floorCents;
    return {
      id: `alloc-${idx + 1}`,
      category: p.category,
      name: p.name,
      percentage: p.pct,
      allocatedCents: floorCents,
      actualSpentCents: 0,
      fractionalRemainder,
    };
  });

  const sumFloorCents = allocationsWithRemainder.reduce((sum, a) => sum + a.allocatedCents, 0);
  let remainderCents = totalBudgetCents - sumFloorCents;

  allocationsWithRemainder
    .sort((a, b) => b.fractionalRemainder - a.fractionalRemainder)
    .forEach((item) => {
      if (remainderCents > 0) {
        item.allocatedCents += 1;
        remainderCents -= 1;
      }
    });

  return allocationsWithRemainder
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(({ fractionalRemainder: _, ...alloc }) => alloc);
}

const THEME_PRESETS: Record<string, any> = {
  wedding: {
    conceptTitle: 'Enchanted Botanical Elegance',
    conceptDescription: 'A romantic atmosphere blending soft ivory, sage foliage, warm champagne gold, and delicate ambient candlelight for timeless elegance.',
    colorPalette: [
      { name: 'Sage Green', hex: '#65a30d', role: 'primary' },
      { name: 'Champagne Gold', hex: '#eab308', role: 'accent' },
      { name: 'Warm Ivory', hex: '#fefce8', role: 'secondary' },
      { name: 'Blush Rose', hex: '#f43f5e', role: 'highlight' },
      { name: 'Slate Gray', hex: '#475569', role: 'neutral' },
    ],
    dressCode: 'Black Tie Optional / Formal Garden Attire',
    decorStyle: 'Cascading floral arches, airy chiffon drapery, and vintage brass lanterns',
    ambianceLighting: 'Warm fairy lights, suspended Edison filaments, and flickering pillar candles',
    signatureDrink: 'The Golden Vow: Sparkling prosecco, elderflower cordial, fresh raspberry garnish',
    centerpieceConcept: 'Low brass bowls with garden roses, ranunculus, and trailing seeded eucalyptus',
  },
  birthday: {
    conceptTitle: 'Electric Luminescence Celebration',
    conceptDescription: 'A dynamic, high-energy party featuring bold jewel tones, interactive cocktail lounges, and modern neon accents.',
    colorPalette: [
      { name: 'Vibrant Magenta', hex: '#d946ef', role: 'primary' },
      { name: 'Electric Indigo', hex: '#6366f1', role: 'secondary' },
      { name: 'Warm Amber', hex: '#f59e0b', role: 'accent' },
      { name: 'Midnight Charcoal', hex: '#0f172a', role: 'neutral' },
      { name: 'Golden Glow', hex: '#fbbf24', role: 'highlight' },
    ],
    dressCode: 'Cocktail Chic / Glamorous Casual',
    decorStyle: 'Modern geometric installations, statement photo backdrops, and metallic balloons',
    ambianceLighting: 'Dynamic color-wash LED lighting with warm table pin-spots',
    signatureDrink: 'Midnight Spark: Smoked mezcal, blackberry syrup, lime, ginger beer',
    centerpieceConcept: 'Minimalist smoked glass vases with single-stem monstera leaves and micro-lights',
  },
  corporate_gala: {
    conceptTitle: 'Luminescent Horizons: Vanguard of Innovation',
    conceptDescription: 'A polished, modern gala celebrating corporate milestones, high achievers, and visionary leadership.',
    colorPalette: [
      { name: 'Deep Slate Navy', hex: '#0f172a', role: 'primary' },
      { name: 'Burnished Gold', hex: '#d97706', role: 'accent' },
      { name: 'Pure Platinum', hex: '#e2e8f0', role: 'secondary' },
      { name: 'Electric Cyan', hex: '#06b6d4', role: 'highlight' },
      { name: 'Graphite', hex: '#334155', role: 'neutral' },
    ],
    dressCode: 'Black Tie / Executive Formal',
    decorStyle: 'Architectural staging, brushed aluminum accents, and modern botanical pedestals',
    ambianceLighting: 'Custom architectural projection mapping, sharp stage spots, and cool perimeter uplighting',
    signatureDrink: 'Horizon Highball: Japanese whiskey, yuzu soda, thyme sprig',
    centerpieceConcept: 'Architectural glass cubes with floating white calla lilies and submerged LED discs',
  },
  default: {
    conceptTitle: 'Radiant Celebration of Moments',
    conceptDescription: 'A joyful and cohesive gathering designed to foster deep connections and unforgettable memories.',
    colorPalette: [
      { name: 'Regal Amethyst', hex: '#9333ea', role: 'primary' },
      { name: 'Golden Amber', hex: '#f59e0b', role: 'accent' },
      { name: 'Crisp White', hex: '#f8fafc', role: 'secondary' },
      { name: 'Midnight Charcoal', hex: '#1e293b', role: 'neutral' },
      { name: 'Coral Rose', hex: '#f43f5e', role: 'highlight' },
    ],
    dressCode: 'Festive & Elegant',
    decorStyle: 'Contemporary floral arrangements, stylish table linens, and ambient focal points',
    ambianceLighting: 'Warm incandescent globe lighting and atmospheric pin-spots',
    signatureDrink: 'Celebration Fizz: Prosecco, splash of pomegranate, edible flower garnish',
    centerpieceConcept: 'Ceramic fluted vases with seasonal blooms and tapered beeswax candles',
  },
};

/**
 * Deterministic Fallback Plan Generator
 */
export function generateDeterministicPlan(input: EventCreationInput): AIEventPlanResponse {
  const themePreset = THEME_PRESETS[input.eventType] || THEME_PRESETS.default;
  const totalBudgetCents = dollarsToCents(input.totalBudget);

  let allocPercentages: { category: any; name: string; pct: number }[];
  if (input.eventType === 'wedding') {
    allocPercentages = [
      { category: 'catering', name: 'Catering & Beverages', pct: 38 },
      { category: 'venue', name: 'Venue Rental & Fees', pct: 26 },
      { category: 'photography', name: 'Photo & Videography', pct: 12 },
      { category: 'decor', name: 'Florals & Decor Styling', pct: 10 },
      { category: 'entertainment', name: 'Music, DJ & Audio', pct: 8 },
      { category: 'contingency', name: 'Emergency Contingency', pct: 6 },
    ];
  } else if (input.eventType === 'corporate_gala') {
    allocPercentages = [
      { category: 'catering', name: 'Gala Banquet & Bar', pct: 35 },
      { category: 'venue', name: 'Convention/Ballroom Venue', pct: 30 },
      { category: 'entertainment', name: 'AV Production & Keynotes', pct: 15 },
      { category: 'decor', name: 'Stage & Ambiance Decor', pct: 10 },
      { category: 'photography', name: 'Media & Event Documentation', pct: 5 },
      { category: 'contingency', name: 'Unforeseen Operational Reserve', pct: 5 },
    ];
  } else {
    allocPercentages = [
      { category: 'catering', name: 'Food, Drinks & Cake', pct: 40 },
      { category: 'venue', name: 'Venue & Location', pct: 25 },
      { category: 'entertainment', name: 'Music & Activities', pct: 15 },
      { category: 'decor', name: 'Theme Decor & Lighting', pct: 12 },
      { category: 'photography', name: 'Photography & Memories', pct: 4 },
      { category: 'contingency', name: 'Contingency Fund', pct: 4 },
    ];
  }

  const allocations = reconcileBudgetCents(totalBudgetCents, allocPercentages);

  const milestones = [
    {
      id: 'ms-1',
      time: '14:00',
      durationMinutes: 90,
      title: 'Vendor Access & Production Load-In',
      category: 'setup' as const,
      assignedTo: 'Lead Event Coordinator',
      notes: 'Confirm floor plan layout and soundcheck AV equipment',
      status: 'pending' as const,
    },
    {
      id: 'ms-2',
      time: '15:30',
      durationMinutes: 45,
      title: 'Floral & Decor Final Styling',
      category: 'setup' as const,
      assignedTo: 'Decor Lead',
      notes: 'Inspect centerpieces, light candles, place welcome signage',
      status: 'pending' as const,
    },
    {
      id: 'ms-3',
      time: '16:30',
      durationMinutes: 45,
      title: 'Guest Arrival & Welcome Refreshments',
      category: 'reception' as const,
      assignedTo: 'Hospitality Team',
      notes: `Serve ${themePreset.signatureDrink || 'welcome beverage'} upon entry`,
      status: 'pending' as const,
    },
    {
      id: 'ms-4',
      time: '17:15',
      durationMinutes: 45,
      title: 'Main Ceremony / Welcome Highlight',
      category: 'ceremony' as const,
      assignedTo: 'Host / Officiant',
      notes: 'Commence primary program and spotlight moments',
      status: 'pending' as const,
    },
    {
      id: 'ms-5',
      time: '18:00',
      durationMinutes: 75,
      title: 'Plated Dinner & Culinary Service',
      category: 'meal' as const,
      assignedTo: 'Catering Captain',
      notes: `Service for ${input.guestCount} guests with special dietary flags`,
      status: 'pending' as const,
    },
    {
      id: 'ms-6',
      time: '19:15',
      durationMinutes: 30,
      title: 'Celebration Speeches & Keynote Toasts',
      category: 'speech' as const,
      assignedTo: 'Speakers & MC',
      notes: 'Ensure wireless mic battery is fresh; coordinate with photographer',
      status: 'pending' as const,
    },
    {
      id: 'ms-7',
      time: '19:45',
      durationMinutes: 90,
      title: 'Music, Celebration Dance Floor & Dessert',
      category: 'entertainment' as const,
      assignedTo: 'DJ / Entertainment Lead',
      notes: 'Open dance floor and serve celebratory cake / dessert station',
      status: 'pending' as const,
    },
    {
      id: 'ms-8',
      time: '21:15',
      durationMinutes: 20,
      title: 'Grand Farewell & Send-Off',
      category: 'ceremony' as const,
      assignedTo: 'Host & Greeters',
      notes: 'Distribute party favors and coordinate transportation',
      status: 'pending' as const,
    },
    {
      id: 'ms-9',
      time: '21:45',
      durationMinutes: 60,
      title: 'Teardown, Clean-up & Venue Handover',
      category: 'teardown' as const,
      assignedTo: 'Event Crew',
      notes: 'Pack all personal belongings and return rented assets',
      status: 'pending' as const,
    },
  ];

  const vendorCategories = [
    {
      id: 'vc-venue',
      category: 'venue' as const,
      name: 'Venue Management',
      recommendedBudgetCents: Math.round(totalBudgetCents * 0.28),
      checklist: [
        { id: 'vck-1', task: 'Confirm venue certificate of insurance and licensing', isCompleted: false },
        { id: 'vck-2', task: 'Lock in load-in and load-out access windows', isCompleted: false },
        { id: 'vck-3', task: 'Finalize floor layout, electrical access and fire egress paths', isCompleted: false },
      ],
      inquiryDraft: `Dear Venue Team,\n\nWe are planning "${input.title}" on ${input.eventDate} at ${input.location} for approximately ${input.guestCount} guests. We are interested in confirming availability, rental fees, access hours, and sound curfew policies.\n\nLooking forward to your response,\nCelebrAI Planning Team`,
    },
    {
      id: 'vc-catering',
      category: 'catering' as const,
      name: 'Catering & Beverage Service',
      recommendedBudgetCents: Math.round(totalBudgetCents * 0.36),
      checklist: [
        { id: 'vck-4', task: `Submit dietary breakdown for ${input.guestCount} attendees`, isCompleted: false },
        { id: 'vck-5', task: 'Confirm bar package and signature cocktail ingredients', isCompleted: false },
        { id: 'vck-6', task: 'Review tableware, linen rentals and banquet staffing ratio', isCompleted: false },
      ],
      inquiryDraft: `Dear Catering Team,\n\nWe are organizing "${input.title}" on ${input.eventDate} for ${input.guestCount} guests. We would love to review your menu proposals, per-person rates, beverage packages, and options for dietary accommodations (vegan, gluten-free, halal).\n\nBest regards,\nCelebrAI Planning Team`,
    },
    {
      id: 'vc-entertainment',
      category: 'entertainment' as const,
      name: 'Audio/Visual & Entertainment',
      recommendedBudgetCents: Math.round(totalBudgetCents * 0.12),
      checklist: [
        { id: 'vck-7', task: 'Confirm wireless microphones and speaker setup', isCompleted: false },
        { id: 'vck-8', task: 'Share timeline cue sheet with DJ / musicians', isCompleted: false },
      ],
      inquiryDraft: `Hello Entertainment Team,\n\nWe are seeking professional music and sound production for "${input.title}" on ${input.eventDate}. The event runs from 16:30 to 21:30. Please provide your packages for ambient reception music, sound amplification for toasts, and dance entertainment.\n\nWarmly,\nCelebrAI Planning Team`,
    },
  ];

  const creative = {
    invitations: [
      {
        id: 'inv-formal',
        style: 'formal' as const,
        headline: `You Are Cordially Invited to ${input.title}`,
        body: `Please join us in celebrating ${input.title} on ${input.eventDate} at ${input.location}. We anticipate an extraordinary occasion shared among our cherished community.`,
        rsvpCallToAction: `Kindly confirm your attendance by two weeks prior to the event date.`,
        dressCodeNote: themePreset.dressCode,
      },
      {
        id: 'inv-warm',
        style: 'warm' as const,
        headline: `Celebrate With Us: ${input.title} ✨`,
        body: `We can't imagine celebrating this special milestone without you! Join us for a memorable gathering of great food, wonderful company, and unforgettable moments at ${input.location}.`,
        rsvpCallToAction: `Please RSVP soon so we can reserve your personalized seat!`,
        dressCodeNote: themePreset.dressCode,
      },
    ],
    speeches: [
      {
        id: 'sp-host',
        speakerRole: 'Event Host / Organizer',
        tone: 'heartfelt' as const,
        estimatedDuration: '3 minutes',
        keyHighlights: [
          'Welcoming all guests and expressing appreciation',
          'Reflecting on the purpose of this celebration',
          'Proposing an opening toast to togetherness',
        ],
        content: `Good evening everyone! Thank you so much for traveling from near and far to celebrate "${input.title}" with us tonight. Looking around this room, what strikes me most is the warmth, love, and unwavering support that fills every corner. Tonight is our collective moment to pause, savor how far we've come, and toast to the bright chapters ahead. Please raise your glasses with me to health, happiness, and unforgettable memories! Cheers!`,
      },
    ],
    playlistVibes: [
      'Warm Arrival Acoustic: Soft guitar, neo-soul, contemporary instrumentals',
      'Dinner Atmosphere: Upbeat bossa nova, warm jazz standards, mellow indie-folk',
      'Celebration Peak: Timeless dance anthems, pop classics, soulful funk',
    ],
    partyGames: [
      'Memory Mosaic: Interactive photo guestbook where guests capture polaroids with custom prompts',
      'Milestone Trivia: Fun 5-question trivia about the honorees during dessert',
      'The Golden Toast: Spontaneous micro-toasts where guests share their favorite one-sentence memory',
    ],
  };

  return {
    theme: {
      conceptTitle: themePreset.conceptTitle,
      conceptDescription: themePreset.conceptDescription,
      colorPalette: themePreset.colorPalette,
      dressCode: themePreset.dressCode,
      decorStyle: themePreset.decorStyle,
      ambianceLighting: themePreset.ambianceLighting,
      signatureDrink: themePreset.signatureDrink,
      centerpieceConcept: themePreset.centerpieceConcept,
    },
    allocations,
    milestones,
    vendorCategories,
    creative,
  };
}

/**
 * Server-Side Domain Business Rule Validation & Allocation Normalization
 * Reconciles financial totals with zero-cent drift and ensures structural integrity.
 */
function validateAndNormalizeDomainPlan(
  planData: any,
  targetBudgetCents: number
): AIEventPlanResponse | null {
  if (!planData) return null;

  const schemaResult = AIEventPlanResponseSchema.safeParse(planData);
  if (!schemaResult.success) {
    console.warn('AI Output failed Zod schema validation:', schemaResult.error.issues);
    return null;
  }

  const plan = schemaResult.data;

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

  const totalRawAllocated = uniqueAllocations.reduce(
    (sum, a) => sum + (Number(a.allocatedCents) || 0),
    0
  );

  if (totalRawAllocated <= 0) {
    console.warn('AI Output produced non-positive allocation sum:', totalRawAllocated);
    return null;
  }

  const categoriesForReconcile = uniqueAllocations.map((a) => ({
    category: a.category,
    name: a.name,
    pct: a.percentage > 0 ? a.percentage : (a.allocatedCents / totalRawAllocated) * 100,
  }));

  const reconciled = reconcileBudgetCents(targetBudgetCents, categoriesForReconcile);
  const reconciledAllocations = uniqueAllocations.map((orig, idx) => {
    const matched = reconciled[idx];
    return {
      ...orig,
      allocatedCents: matched ? matched.allocatedCents : orig.allocatedCents,
      percentage: matched ? matched.percentage : orig.percentage,
    };
  });

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

  // Live Google Gemini 3.8 Flash Call via @google/genai SDK with 18s HTTP timeout
  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { timeout: 18000 },
    });

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

CRITICAL BUSINESS CONSTRAINTS:
1. Allocations: Exactly divide the total budget (${targetBudgetCents} cents). Ensure categories like venue, catering, decor, entertainment, photography, and contingency sum to ${targetBudgetCents} cents.
2. Milestones: Chronological run-of-show with realistic times and durations covering load-in to teardown.
3. Vendor Categories: Pragmatic checklists and polite, comprehensive RFP inquiries reflecting the guest count and venue.
4. Creative: Tailored invitations (formal & warm), an authentic speech, evocative music vibes, and interactive party games.
`;

    const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: planResponseSchema,
        temperature: 0.7,
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error('Gemini API returned empty text response.');
    }

    const parsedJson = JSON.parse(rawText);
    const normalizedPlan = validateAndNormalizeDomainPlan(parsedJson, targetBudgetCents);

    if (!normalizedPlan) {
      console.warn('Live Gemini plan failed validation or normalization; using deterministic fallback');
      const fallbackPlan = generateDeterministicPlan(validatedEvent);
      return res.status(200).json({
        success: true,
        mode: 'offline_fallback',
        message: 'Live AI output failed domain validation; reconciled via deterministic engine.',
        data: fallbackPlan,
      });
    }

    return res.status(200).json({
      success: true,
      mode: 'live',
      model: modelName,
      data: normalizedPlan,
    });
  } catch (err: any) {
    console.error('Gemini API execution error:', err.message || err);
    // Graceful error masking with deterministic fallback
    const fallbackPlan = generateDeterministicPlan(validatedEvent);
    return res.status(200).json({
      success: true,
      mode: 'offline_fallback',
      message: 'Gemini request timed out or encountered an upstream error; fallback plan generated.',
      data: fallbackPlan,
    });
  }
}
