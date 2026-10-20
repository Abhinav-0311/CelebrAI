import { AIEventPlanResponse, EventCreationInput } from '../types/schemas';
import { dollarsToCents } from '../types/event';

interface ThemePreset {
  conceptTitle: string;
  conceptDescription: string;
  colorPalette: {
    name: string;
    hex: string;
    role: 'primary' | 'secondary' | 'accent' | 'neutral' | 'highlight';
  }[];
  dressCode: string;
  decorStyle: string;
  ambianceLighting: string;
  signatureDrink: string;
  centerpieceConcept: string;
}

const THEME_PRESETS: Record<string, ThemePreset> = {
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
  anniversary: {
    conceptTitle: 'Golden Heritage & Silver Horizon',
    conceptDescription: 'A classic milestone retrospective reflecting enduring love, cherished memories, and heartfelt toasts.',
    colorPalette: [
      { name: 'Champagne Gold', hex: '#d97706', role: 'primary' },
      { name: 'Silver Mist', hex: '#94a3b8', role: 'secondary' },
      { name: 'Deep Burgundy', hex: '#881337', role: 'accent' },
      { name: 'Soft Cream', hex: '#fffbeb', role: 'neutral' },
      { name: 'Rose Gold', hex: '#fb7185', role: 'highlight' },
    ],
    dressCode: 'Semi-Formal / Cocktail Attire',
    decorStyle: 'Framed photo journey walls, mirrored table runners, and velvet accents',
    ambianceLighting: 'Warm dimmable perimeter chandeliers and intimate table votives',
    signatureDrink: 'Vintage Harmony: Bourbon, sweet vermouth, angostura, brandied cherry',
    centerpieceConcept: 'Mercury glass compotes with burgundy dahlias and dusty miller',
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
  baby_shower: {
    conceptTitle: 'Gentle Meadow & Starlit Dreams',
    conceptDescription: 'A cozy, joyful gathering filled with whimsical pastel elements, comforting treats, and welcoming warmth.',
    colorPalette: [
      { name: 'Buttercup Yellow', hex: '#fef08a', role: 'primary' },
      { name: 'Sky Celeste', hex: '#7dd3fc', role: 'secondary' },
      { name: 'Soft Sage', hex: '#86efac', role: 'accent' },
      { name: 'Warm Linen', hex: '#fef3c7', role: 'neutral' },
      { name: 'Peach Sorbet', hex: '#fed7aa', role: 'highlight' },
    ],
    dressCode: 'Smart Casual / Pastel Palette',
    decorStyle: 'Organic balloon garlands, macrame backdrops, and woodland floral sprigs',
    ambianceLighting: 'Gentle daylight natural lighting and warm hanging paper lanterns',
    signatureDrink: 'The Sweet Arrival Mocktail: Sparkling white tea, peach puree, fresh mint',
    centerpieceConcept: 'Rustic wooden planters with chamomile blooms, baby’s breath, and personalized wooden cutouts',
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
 * Distributes total cents across percentage categories using largest-remainder method.
 * Guarantees that sum(allocatedCents) === totalBudgetCents to the exact single cent.
 */
export function reconcileBudgetCents(
  totalBudgetCents: number,
  percentages: { category: any; name: string; pct: number }[]
): { id: string; category: any; name: string; percentage: number; allocatedCents: number; actualSpentCents: number }[] {
  // Normalize percentages to sum to 100
  const totalPct = percentages.reduce((sum, p) => sum + p.pct, 0);
  
  // Calculate floor cents and remainders
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

  // Sort by highest fractional remainder and distribute 1 cent each
  allocationsWithRemainder
    .sort((a, b) => b.fractionalRemainder - a.fractionalRemainder)
    .forEach((item) => {
      if (remainderCents > 0) {
        item.allocatedCents += 1;
        remainderCents -= 1;
      }
    });

  // Re-sort back by original id order
  return allocationsWithRemainder
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(({ fractionalRemainder: _, ...alloc }) => alloc);
}

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

  // Exact Largest-Remainder Allocation Reconciliation
  const allocations = reconcileBudgetCents(totalBudgetCents, allocPercentages);

  // Timeline Milestones
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
      notes: `Serve ${themePreset.signatureDrink} upon entry`,
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

  // Vendor Categories & Checklist
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

  // Creative Suite
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
