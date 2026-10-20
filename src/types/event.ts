/**
 * CelebrAI Domain Types
 * Single source of truth for the event planning platform.
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

export interface BudgetAllocation {
  id: string;
  category: 'venue' | 'catering' | 'decor' | 'entertainment' | 'photography' | 'attire' | 'favors' | 'contingency';
  name: string;
  percentage: number;
  allocatedAmount: number;
  actualSpent: number;
}

export interface ExpenseItem {
  id: string;
  allocationId: string;
  name: string;
  category: BudgetAllocation['category'];
  estimatedCost: number;
  actualCost: number;
  vendor?: string;
  isPaid: boolean;
  notes?: string;
  createdAt: string;
}

export interface BudgetPlan {
  totalBudget: number;
  currency: string;
  allocations: BudgetAllocation[];
  expenses: ExpenseItem[];
  contingencyRate: number; // e.g. 5%
}

export type RSVPStatus = 'attending' | 'declined' | 'pending';
export type DietaryRequirement = 'none' | 'vegan' | 'vegetarian' | 'gluten_free' | 'halal' | 'kosher' | 'nut_allergy' | 'dairy_free' | 'other';

export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  rsvpStatus: RSVPStatus;
  plusOnes: number;
  dietary: DietaryRequirement[];
  dietaryNotes?: string;
  tableNumber?: number;
  isVip?: boolean;
}

export interface DietarySummary {
  totalGuests: number;
  attendingGuests: number;
  veganCount: number;
  vegetarianCount: number;
  glutenFreeCount: number;
  halalCount: number;
  nutAllergyCount: number;
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
  recommendedBudget: number;
  confirmedVendorName?: string;
  contactEmail?: string;
  checklist: VendorChecklistItem[];
  inquiryDraft: string;
}

export interface InvitationDraft {
  id: string;
  style: 'formal' | 'warm' | 'poetic' | 'playful';
  headline: string;
  body: string;
  rsvpCallToAction: string;
  dressCodeNote: string;
}

export interface SpeechDraft {
  id: string;
  speakerRole: string; // e.g. "Maid of Honor", "Host", "Colleague"
  tone: 'heartfelt' | 'humorous' | 'inspiring' | 'nostalgic';
  estimatedDuration: string; // e.g. "3-4 minutes"
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
    cateringDelta: number;
    seatingDelta: number;
    budgetVariance: number;
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
  id: string;
  title: string;
  eventType: EventType;
  guestCount: number;
  eventDate: string;
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
