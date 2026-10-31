import { z } from 'zod';
import {
  AIEventPlanResponseSchema as ClientPlanSchema,
  type AIEventPlanResponse,
  type EventCreationInput,
} from '../types/schemas.js';
import { generateDeterministicPlan, reconcileBudgetCents } from './offlinePlanner.js';

const PaletteRoles = ClientPlanSchema.shape.theme.shape.colorPalette.element.shape.role.options;
const BudgetCategories = ClientPlanSchema.shape.allocations.element.shape.category.options;
const MilestoneCategories = ClientPlanSchema.shape.milestones.element.shape.category.options;
const MilestoneStatuses = ClientPlanSchema.shape.milestones.element.shape.status.removeDefault().options;
const VendorCategories = ClientPlanSchema.shape.vendorCategories.element.shape.category.options;
const InvitationStyles = ClientPlanSchema.shape.creative.shape.invitations.element.shape.style.options;
const SpeechTones = ClientPlanSchema.shape.creative.shape.speeches.element.shape.tone.options;

// Keep generated themes and logistics strict without restricting saved user drafts.
const AIEventPlanResponseSchema = ClientPlanSchema.extend({
  theme: ClientPlanSchema.shape.theme.extend({
    conceptTitle: z.string().min(1),
    conceptDescription: z.string().min(1),
    dressCode: z.string().min(1),
    decorStyle: z.string().min(1),
    ambianceLighting: z.string().min(1),
  }),
  milestones: z.array(ClientPlanSchema.shape.milestones.element.extend({
    title: z.string().min(1),
    assignedTo: z.string().min(1),
  })),
  vendorCategories: z.array(ClientPlanSchema.shape.vendorCategories.element.extend({
    inquiryDraft: z.string().min(1),
  })),
  creative: ClientPlanSchema.shape.creative.extend({
    partyGames: ClientPlanSchema.shape.creative.shape.partyGames.default([]),
  }),
});

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

const ROLE_MAP: Record<string, typeof PaletteRoles[number]> = {
  primary: 'primary',
  'primary accent': 'accent',
  main: 'primary',
  secondary: 'secondary',
  accent: 'accent',
  neutral: 'neutral',
  base: 'neutral',
  highlight: 'highlight',
};

const ALLOC_CATEGORY_MAP: Record<string, typeof BudgetCategories[number]> = {
  venue: 'venue',
  location: 'venue',
  catering: 'catering',
  food: 'catering',
  beverage: 'catering',
  food_and_beverage: 'catering',
  decor: 'decor',
  decoration: 'decor',
  florals: 'decor',
  entertainment: 'entertainment',
  music: 'entertainment',
  av: 'entertainment',
  photography: 'photography',
  photo: 'photography',
  videography: 'photography',
  attire: 'attire',
  apparel: 'attire',
  favors: 'favors',
  gifts: 'favors',
  contingency: 'contingency',
  emergency: 'contingency',
  reserve: 'contingency',
};

const MILESTONE_CATEGORY_MAP: Record<string, typeof MilestoneCategories[number]> = {
  setup: 'setup',
  load_in: 'setup',
  ceremony: 'ceremony',
  reception: 'reception',
  keynote: 'keynote',
  meal: 'meal',
  dinner: 'meal',
  lunch: 'meal',
  entertainment: 'entertainment',
  party: 'entertainment',
  dance: 'entertainment',
  speech: 'speech',
  toast: 'speech',
  teardown: 'teardown',
  load_out: 'teardown',
};

const VENDOR_CATEGORY_MAP: Record<string, typeof VendorCategories[number]> = {
  venue: 'venue',
  catering: 'catering',
  photography: 'photography',
  photo: 'photography',
  entertainment: 'entertainment',
  florist_decor: 'florist_decor',
  decor: 'florist_decor',
  florist: 'florist_decor',
  flowers: 'florist_decor',
  officiant_host: 'officiant_host',
  officiant: 'officiant_host',
  host: 'officiant_host',
  mc: 'officiant_host',
  rentals: 'rentals',
  rental: 'rentals',
};

const INVITATION_STYLE_MAP: Record<string, typeof InvitationStyles[number]> = {
  formal: 'formal',
  elegant: 'formal',
  classic: 'formal',
  warm: 'warm',
  casual: 'warm',
  friendly: 'warm',
  poetic: 'poetic',
  romantic: 'poetic',
  artistic: 'poetic',
  playful: 'playful',
  fun: 'playful',
  whimsical: 'playful',
  modern: 'formal',
};

const SPEECH_TONE_MAP: Record<string, typeof SpeechTones[number]> = {
  heartfelt: 'heartfelt',
  emotional: 'heartfelt',
  sincere: 'heartfelt',
  humorous: 'humorous',
  funny: 'humorous',
  witty: 'humorous',
  inspiring: 'inspiring',
  inspirational: 'inspiring',
  motivational: 'inspiring',
  nostalgic: 'nostalgic',
  reflective: 'nostalgic',
  formal: 'inspiring',
};

/**
 * Preprocesses raw AI JSON and deterministically harmonizes safe enum variants
 */
export function preprocessAndNormalizeRawGeminiPlan(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;

  const plan = asRecord(JSON.parse(JSON.stringify(raw)));

  // 1. Normalize Theme & Palette
  const theme = asRecord(plan.theme);
  if (Array.isArray(theme.colorPalette)) {
    theme.colorPalette = theme.colorPalette.map((value: unknown) => {
      const cp = asRecord(value);
      const rawRole = String(cp.role || '').toLowerCase().trim();
      const role = ROLE_MAP[rawRole] || (PaletteRoles.find(value => value === rawRole) || 'accent');

      let hex = String(cp.hex || '').trim();
      if (!hex.startsWith('#')) hex = `#${hex}`;
      if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) {
        hex = '#6366f1';
      }

      return {
        ...cp,
        role,
        hex,
      };
    });
  }

  // 2. Normalize Allocations
  if (Array.isArray(plan.allocations)) {
    plan.allocations = plan.allocations.map((value: unknown, idx: number) => {
      const alloc = asRecord(value);
      const rawCat = String(alloc.category || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
      const category = ALLOC_CATEGORY_MAP[rawCat] || (BudgetCategories.find(value => value === rawCat) || 'contingency');

      return {
        ...alloc,
        id: alloc.id || `alloc-${idx + 1}`,
        category,
        allocatedCents: Math.round(Number(alloc.allocatedCents) || 0),
        actualSpentCents: 0,
      };
    });
  }

  // 3. Normalize Milestones
  if (Array.isArray(plan.milestones)) {
    plan.milestones = plan.milestones.map((value: unknown, idx: number) => {
      const ms = asRecord(value);
      const rawCat = String(ms.category || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
      const category = MILESTONE_CATEGORY_MAP[rawCat] || (MilestoneCategories.find(value => value === rawCat) || 'entertainment');

      const rawStatus = String(ms.status || 'pending').toLowerCase().trim();
      const status = MilestoneStatuses.find(status => status === rawStatus) || 'pending';

      let time = String(ms.time || '18:00').trim();
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        const match = time.match(/(\d{1,2}):(\d{2})/);
        if (match) {
          const h = match[1].padStart(2, '0');
          const m = match[2];
          time = `${h}:${m}`;
        } else {
          time = '18:00';
        }
      }

      return {
        ...ms,
        id: ms.id || `ms-${idx + 1}`,
        time,
        category,
        status,
        durationMinutes: Math.max(5, Math.round(Number(ms.durationMinutes) || 30)),
      };
    });
  }

  // 4. Normalize Vendor Categories
  if (Array.isArray(plan.vendorCategories)) {
    plan.vendorCategories = plan.vendorCategories.map((value: unknown, idx: number) => {
      const vc = asRecord(value);
      const rawCat = String(vc.category || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
      const category = VENDOR_CATEGORY_MAP[rawCat] || (VendorCategories.find(value => value === rawCat) || 'venue');

      return {
        ...vc,
        id: vc.id || `vc-${idx + 1}`,
        category,
        recommendedBudgetCents: Math.max(0, Math.round(Number(vc.recommendedBudgetCents) || 0)),
        checklist: Array.isArray(vc.checklist) ? vc.checklist : [],
        inquiryDraft: String(vc.inquiryDraft || 'Please provide information and availability.'),
      };
    });
  }

  // 5. Normalize Creative
  const creative = asRecord(plan.creative);
  if (plan.creative && typeof plan.creative === 'object') {
    if (Array.isArray(creative.invitations)) {
      creative.invitations = creative.invitations.map((value: unknown, idx: number) => {
        const inv = asRecord(value);
        const rawStyle = String(inv.style || '').toLowerCase().trim();
        const style = INVITATION_STYLE_MAP[rawStyle] || (InvitationStyles.find(value => value === rawStyle) || 'formal');
        return {
          ...inv,
          id: inv.id || `inv-${idx + 1}`,
          style,
        };
      });
    }

    if (Array.isArray(creative.speeches)) {
      creative.speeches = creative.speeches.map((value: unknown, idx: number) => {
        const sp = asRecord(value);
        const rawTone = String(sp.tone || '').toLowerCase().trim();
        const tone = SPEECH_TONE_MAP[rawTone] || (SpeechTones.find(value => value === rawTone) || 'heartfelt');
        return {
          ...sp,
          id: sp.id || `sp-${idx + 1}`,
          tone,
          keyHighlights: Array.isArray(sp.keyHighlights) ? sp.keyHighlights : [],
        };
      });
    }

    if (!Array.isArray(creative.playlistVibes)) {
      creative.playlistVibes = ['Celebration ambiance and memorable tunes'];
    }
    if (!Array.isArray(creative.partyGames)) {
      creative.partyGames = [];
    }
  }

  return plan;
}

/**
 * Server-Side Domain Business Rule Validation & Allocation Normalization
 * Reconciles financial totals with zero-cent drift and ensures structural integrity.
 */
export function validateAndNormalizeDomainPlan(
  planData: unknown,
  targetBudgetCents: number,
  eventContext?: EventCreationInput
): AIEventPlanResponse | null {
  if (!planData) return null;

  // Preprocess & deterministically harmonize safe enum variants
  const preprocessed = preprocessAndNormalizeRawGeminiPlan(planData);

  const schemaResult = AIEventPlanResponseSchema.safeParse(preprocessed);
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
      actualSpentCents: 0,
    };
  });

  const finalReconciledSum = reconciledAllocations.reduce((sum, a) => sum + a.allocatedCents, 0);
  if (finalReconciledSum !== targetBudgetCents) {
    console.warn(
      `Reconciliation invariant assertion failed: sum (${finalReconciledSum}) !== target (${targetBudgetCents})`
    );
    return null;
  }

  const finalMilestones = [...plan.milestones];
  const finalVendorCategories = [...plan.vendorCategories];
  const finalCreative = { ...plan.creative };

  // Fill sparse model responses with non-conflicting local planning details.
  if (eventContext) {
    const baseDeterministic = generateDeterministicPlan(eventContext);

    // 1. Supplement Milestones up to 7 items if sparse
    if (finalMilestones.length < 7) {
      const existingCategories = new Set(finalMilestones.map((m) => m.category));
      const existingTimes = new Set(finalMilestones.map((m) => m.time));

      for (const detMs of baseDeterministic.milestones) {
        if (!existingCategories.has(detMs.category) && !existingTimes.has(detMs.time)) {
          finalMilestones.push({
            ...detMs,
            id: `ms-supp-${finalMilestones.length + 1}`,
          });
          existingCategories.add(detMs.category);
          existingTimes.add(detMs.time);
          if (finalMilestones.length >= 7) break;
        }
      }
      // Sort chronologically by time
      finalMilestones.sort((a, b) => a.time.localeCompare(b.time));
    }

    // 2. Supplement Vendor Categories up to 5 items if sparse
    if (finalVendorCategories.length < 5) {
      const existingCats = new Set(finalVendorCategories.map((vc) => vc.category));

      for (const detVc of baseDeterministic.vendorCategories) {
        if (!existingCats.has(detVc.category)) {
          finalVendorCategories.push({
            ...detVc,
            id: `vc-supp-${finalVendorCategories.length + 1}`,
          });
          existingCats.add(detVc.category);
          if (finalVendorCategories.length >= 5) break;
        }
      }
    }

    // 3. Supplement Creative Games if fewer than 2
    if (!finalCreative.partyGames || finalCreative.partyGames.length < 2) {
      const games = finalCreative.partyGames ? [...finalCreative.partyGames] : [];
      for (const game of baseDeterministic.creative.partyGames) {
        if (!games.includes(game)) {
          games.push(game);
        }
      }
      finalCreative.partyGames = games;
    }

    // 4. Supplement Creative Playlist Vibes if fewer than 3
    if (!finalCreative.playlistVibes || finalCreative.playlistVibes.length < 3) {
      const vibes = finalCreative.playlistVibes ? [...finalCreative.playlistVibes] : [];
      for (const vibe of baseDeterministic.creative.playlistVibes) {
        if (!vibes.includes(vibe)) {
          vibes.push(vibe);
        }
      }
      finalCreative.playlistVibes = vibes;
    }
  }

  return {
    ...plan,
    allocations: reconciledAllocations,
    milestones: finalMilestones,
    vendorCategories: finalVendorCategories,
    creative: finalCreative,
  };
}
