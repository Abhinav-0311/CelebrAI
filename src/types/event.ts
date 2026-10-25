/**
 * CelebrAI Domain Types (Phase 0.2 Specification)
 * Strictly enforces integer minor currency units (cents/paise) to prevent
 * floating-point rounding errors and drift.
 */

export type EventType =
  | 'wedding'
  | 'birthday'
  | 'anniversary'
  | 'corporate_gala'
  | 'baby_shower'
  | 'graduation'
  | 'festival'
  | 'themed_party';

export type EventStatus = 'draft' | 'planning' | 'ready' | 'live' | 'completed';

export type SystemAIMode = 'live' | 'offline' | 'sample';

export interface EventTheme {
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
  signatureDrink?: string;
  centerpieceConcept?: string;
}

export type BudgetCategory = 
  | 'venue' 
  | 'catering' 
  | 'decor' 
  | 'entertainment' 
  | 'photography' 
  | 'attire' 
  | 'favors' 
  | 'contingency';

export interface BudgetAllocation {
  id: string;
  category: BudgetCategory;
  name: string;
  percentage: number;
  allocatedCents: number; // Integer minor currency units (e.g. 1500000 = $15,000.00)
  actualSpentCents: number; // Integer minor currency units
}

export interface ExpenseItem {
  id: string;
  allocationId: string;
  name: string;
  category: BudgetCategory;
  estimatedCents: number; // Integer minor currency units
  actualCents: number; // Integer minor currency units
  vendor?: string;
  isPaid: boolean;
  notes?: string;
  createdAt: string;
}

export interface BudgetPlan {
  totalBudgetCents: number; // Integer minor currency units
  currency: string; // ISO 4217 code, e.g. "USD", "INR", "EUR"
  allocations: BudgetAllocation[];
  expenses: ExpenseItem[];
  contingencyRate: number; // e.g. 0.05
}

export type RSVPStatus = 'attending' | 'declined' | 'pending';
export type DietaryRequirement = 'none' | 'vegan' | 'vegetarian' | 'gluten_free' | 'halal' | 'kosher' | 'nut_allergy' | 'dairy_free' | 'other';

export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  rsvpStatus: RSVPStatus;
  plusOnes: number; // Extra guests accompanying this attendee
  dietary: DietaryRequirement[];
  dietaryNotes?: string;
  tableNumber?: number;
  isVip?: boolean;
}

export interface DietarySummary {
  totalInvited: number; // Including plus-ones
  confirmedAttending: number; // Attending guests + their plus-ones
  confirmedVegan: number;
  confirmedVegetarian: number;
  confirmedGlutenFree: number;
  confirmedHalal: number;
  confirmedNutAllergy: number;
  potentialDietaryCount: number; // From pending RSVPs
  otherCount: number;
}

export type MilestoneCategory = 'setup' | 'ceremony' | 'reception' | 'keynote' | 'meal' | 'entertainment' | 'speech' | 'teardown';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';

export interface TimelineMilestone {
  id: string;
  time: string; // 24-hr format "14:00"
  durationMinutes: number;
  title: string;
  category: MilestoneCategory;
  assignedTo: string;
  notes?: string;
  status: MilestoneStatus;
  completedAt?: string;
}

export interface TimelinePlan {
  date: string;
  startTime: string;
  endTime: string;
  timezone: string; // IANA timezone, e.g. "America/Los_Angeles"
  milestones: TimelineMilestone[];
  isDayOfLiveActive: boolean;
}

export interface VendorChecklistItem {
  id: string;
  task: string;
  isCompleted: boolean;
}

export interface VendorCategory {
  id: string;
  category: 'venue' | 'catering' | 'photography' | 'entertainment' | 'florist_decor' | 'officiant_host' | 'rentals';
  name: string;
  recommendedBudgetCents: number;
  confirmedVendorName?: string;
  contactEmail?: string;
  checklist: VendorChecklistItem[];
  inquiryDraft: string;
  needsReview?: boolean;
  reviewReason?: string;
}

export interface InvitationDraft {
  id: string;
  style: 'formal' | 'warm' | 'poetic' | 'playful';
  headline: string;
  body: string;
  rsvpCallToAction: string;
  dressCodeNote: string;
  needsReview?: boolean;
  reviewReason?: string;
}

export interface SpeechDraft {
  id: string;
  speakerRole: string;
  tone: 'heartfelt' | 'humorous' | 'inspiring' | 'nostalgic';
  estimatedDuration: string;
  keyHighlights: string[];
  content: string;
}

export interface CreativeSuite {
  invitations: InvitationDraft[];
  speeches: SpeechDraft[];
  playlistVibes: string[];
  partyGames: string[];
}

export interface AdaptiveRippleAlert {
  id: string;
  triggerType: 'guest_count_change' | 'budget_change' | 'date_change';
  previousValue: number | string;
  newValue: number | string;
  title: string;
  severity: 'low' | 'medium' | 'high';
  impactSummary: string;
  calculatedDiffs: {
    cateringDeltaCents: number;
    seatingDeltaTables: number;
    budgetVarianceCents: number;
  };
  recommendedActions: {
    actionType: 'update_budget' | 'recalculate_catering' | 'adjust_tables' | 'update_timeline';
    description: string;
    patchData?: Partial<CelebrAIEvent>;
  }[];
  status: 'pending_review' | 'applied' | 'dismissed';
  createdAt: string;
}

export interface CelebrAIEvent {
  schemaVersion: number; // Schema migration version (1)
  id: string;
  title: string;
  eventType: EventType;
  guestCount: number;
  eventDate: string;
  timezone: string;
  location: string;
  venueType: 'indoor' | 'outdoor' | 'ballroom' | 'beach' | 'garden' | 'restaurant' | 'rooftop' | 'private_residence';
  vibeKeywords: string[];
  status: EventStatus;
  theme: EventTheme;
  budget: BudgetPlan;
  guests: {
    list: Guest[];
    dietarySummary: DietarySummary;
    targetTableCapacity: number;
  };
  timeline: TimelinePlan;
  vendors: {
    categories: VendorCategory[];
  };
  creative: CreativeSuite;
  pendingRipples: AdaptiveRippleAlert[];
  appliedRipplesCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Currency Minor Unit Helper Functions
 */
export function formatCurrency(cents: number, currency = 'USD'): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(dollars);
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}
