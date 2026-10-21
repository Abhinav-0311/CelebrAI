import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  CelebrAIEvent, 
  SystemAIMode, 
  Guest, 
  ExpenseItem, 
  TimelineMilestone, 
  AdaptiveRippleAlert,
  dollarsToCents
} from '../types/event';
import { EventCreationInput, CelebrAIEventSchema } from '../types/schemas';
import { sampleEventData } from '../services/sampleEvent';
import { generateCelebrAIPlan } from '../services/aiService';
import { analyzeGuestCountChange, analyzeBudgetChange, applyRipplePatch } from '../services/adaptiveEngine';
import { computeDietarySummary, recalculateAllocations } from '../services/eventAnalytics';

export type NavigationTab =
  | 'overview'
  | 'budget'
  | 'timeline'
  | 'guests'
  | 'creative'
  | 'vendors'
  | 'intelligence';

interface ImportResult {
  success: boolean;
  error?: string;
}

interface EventStoreState {
  currentEvent: CelebrAIEvent | null;
  systemMode: SystemAIMode;
  systemMessage: string;
  activeTab: NavigationTab;
  isCreateModalOpen: boolean;
  isAdaptiveModalOpen: boolean;
  activeRippleAlert: AdaptiveRippleAlert | null;
  isGenerating: boolean;

  // Actions
  setActiveTab: (tab: NavigationTab) => void;
  setCreateModalOpen: (open: boolean) => void;
  setAdaptiveModalOpen: (open: boolean) => void;
  setActiveRippleAlert: (alert: AdaptiveRippleAlert | null) => void;
  
  loadSampleEvent: () => void;
  createEvent: (input: EventCreationInput) => Promise<void>;
  updateGuestCount: (newCount: number) => void;
  updateTotalBudgetCents: (newBudgetCents: number) => void;
  applyRipple: (alert: AdaptiveRippleAlert) => { success: boolean; reason?: string };
  dismissRipple: (alertId: string) => void;

  // Budget Actions (Minor Units: Cents)
  addExpense: (expense: Omit<ExpenseItem, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;
  toggleExpensePaid: (id: string) => void;

  // Guest Actions
  addGuest: (guest: Omit<Guest, 'id'>) => void;
  updateGuest: (guest: Guest) => void;
  deleteGuest: (id: string) => void;

  // Timeline Actions
  toggleMilestoneStatus: (id: string) => void;
  addMilestone: (milestone: Omit<TimelineMilestone, 'id'>) => void;
  updateMilestone: (milestone: TimelineMilestone) => void;
  deleteMilestone: (id: string) => void;
  toggleDayOfLive: () => void;

  // Vendor Actions
  toggleVendorChecklist: (categoryId: string, checklistId: string) => void;
  dismissVendorReview: (categoryId: string) => void;
  syncVendorDraftHeadcount: (categoryId: string, newCount: number) => void;
  dismissInvitationReview: (invitationId: string) => void;

  // Persistence & Data Transfer
  exportEventJson: () => string;
  importEventJson: (jsonString: string) => ImportResult;
  resetEvent: () => void;
}


export const useEventStore = create<EventStoreState>()(
  persist(
    (set, get) => ({
      currentEvent: sampleEventData,
      systemMode: 'sample',
      systemMessage: 'Sample Showcase Event: Aurora Horizons Gala',
      activeTab: 'overview',
      isCreateModalOpen: false,
      isAdaptiveModalOpen: false,
      activeRippleAlert: null,
      isGenerating: false,

      setActiveTab: (activeTab) => set({ activeTab }),
      setCreateModalOpen: (isCreateModalOpen) => set({ isCreateModalOpen }),
      setAdaptiveModalOpen: (isAdaptiveModalOpen) => set({ isAdaptiveModalOpen }),
      setActiveRippleAlert: (activeRippleAlert) => set({ activeRippleAlert }),

      loadSampleEvent: () => {
        set({
          currentEvent: JSON.parse(JSON.stringify(sampleEventData)),
          systemMode: 'sample',
          systemMessage: 'Sample Showcase Event: Aurora Horizons Gala',
          activeTab: 'overview',
        });
      },

      createEvent: async (input: EventCreationInput) => {
        set({ isGenerating: true });
        try {
          const result = await generateCelebrAIPlan(input);
          const totalCents = dollarsToCents(input.totalBudget);

          const newEvent: CelebrAIEvent = {
            schemaVersion: 1,
            id: `evt-${Date.now()}`,
            title: input.title,
            eventType: input.eventType,
            guestCount: input.guestCount,
            eventDate: input.eventDate,
            timezone: input.timezone || 'America/Los_Angeles',
            location: input.location,
            venueType: input.venueType,
            vibeKeywords: input.vibeKeywords,
            status: 'planning',
            theme: result.plan.theme,
            budget: {
              totalBudgetCents: totalCents,
              currency: input.currency || 'USD',
              contingencyRate: 0.05,
              allocations: result.plan.allocations,
              expenses: [],
            },
            guests: {
              list: [],
              dietarySummary: {
                totalInvited: input.guestCount,
                confirmedAttending: 0,
                confirmedVegan: 0,
                confirmedVegetarian: 0,
                confirmedGlutenFree: 0,
                confirmedHalal: 0,
                confirmedNutAllergy: 0,
                potentialDietaryCount: 0,
                otherCount: 0,
              },
              targetTableCapacity: 10,
            },
            timeline: {
              date: input.eventDate,
              startTime: '14:00',
              endTime: '22:00',
              timezone: input.timezone || 'America/Los_Angeles',
              isDayOfLiveActive: false,
              milestones: result.plan.milestones,
            },
            vendors: {
              categories: result.plan.vendorCategories,
            },
            creative: result.plan.creative,
            pendingRipples: [],
            appliedRipplesCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set({
            currentEvent: newEvent,
            systemMode: result.mode,
            systemMessage: result.sourceMessage,
            isGenerating: false,
            isCreateModalOpen: false,
            activeTab: 'overview',
          });
        } catch (error) {
          console.error('Failed to create event:', error);
          set({ isGenerating: false });
        }
      },

      updateGuestCount: (newCount: number) => {
        const { currentEvent } = get();
        if (!currentEvent) return;

        const ripple = analyzeGuestCountChange(currentEvent, newCount);
        if (ripple) {
          const updatedRipples = [ripple, ...currentEvent.pendingRipples];
          set({
            currentEvent: {
              ...currentEvent,
              pendingRipples: updatedRipples,
            },
            activeRippleAlert: ripple,
            isAdaptiveModalOpen: true,
          });
        }
      },

      updateTotalBudgetCents: (newBudgetCents: number) => {
        const { currentEvent } = get();
        if (!currentEvent) return;

        const ripple = analyzeBudgetChange(currentEvent, newBudgetCents);
        if (ripple) {
          const updatedRipples = [ripple, ...currentEvent.pendingRipples];
          set({
            currentEvent: {
              ...currentEvent,
              pendingRipples: updatedRipples,
            },
            activeRippleAlert: ripple,
            isAdaptiveModalOpen: true,
          });
        }
      },

      applyRipple: (alert: AdaptiveRippleAlert) => {
        const { currentEvent } = get();
        if (!currentEvent) return { success: false, reason: 'No active event' };

        const updatedEvent = applyRipplePatch(currentEvent, alert);

        // If the adaptive engine rejected the modification (e.g. Budget below committed expenses)
        if (
          updatedEvent === currentEvent ||
          updatedEvent.appliedRipplesCount === currentEvent.appliedRipplesCount
        ) {
          return {
            success: false,
            reason: 'Budget modification rejected: Proposed budget is less than already committed expenditures.',
          };
        }

        set({
          currentEvent: updatedEvent,
          isAdaptiveModalOpen: false,
          activeRippleAlert: null,
        });

        return { success: true };
      },

      dismissRipple: (alertId: string) => {
        const { currentEvent } = get();
        if (!currentEvent) return;

        const updatedRipples = currentEvent.pendingRipples.map((r) =>
          r.id === alertId ? { ...r, status: 'dismissed' as const } : r
        );
        set({
          currentEvent: {
            ...currentEvent,
            pendingRipples: updatedRipples,
          },
          isAdaptiveModalOpen: false,
          activeRippleAlert: null,
        });
      },

      addExpense: (expenseData) => {
        const { currentEvent } = get();
        if (!currentEvent) return;

        const newExpense: ExpenseItem = {
          ...expenseData,
          id: `exp-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };

        const updatedExpenses = [newExpense, ...currentEvent.budget.expenses];
        const updatedAllocations = recalculateAllocations(currentEvent.budget.allocations, updatedExpenses);

        set({
          currentEvent: {
            ...currentEvent,
            budget: {
              ...currentEvent.budget,
              expenses: updatedExpenses,
              allocations: updatedAllocations,
            },
            updatedAt: new Date().toISOString(),
          },
        });
      },

      deleteExpense: (id: string) => {
        const { currentEvent } = get();
        if (!currentEvent) return;

        const filtered = currentEvent.budget.expenses.filter((e) => e.id !== id);
        const updatedAllocations = recalculateAllocations(currentEvent.budget.allocations, filtered);

        set({
          currentEvent: {
            ...currentEvent,
            budget: {
              ...currentEvent.budget,
              expenses: filtered,
              allocations: updatedAllocations,
            },
            updatedAt: new Date().toISOString(),
          },
        });
      },

      toggleExpensePaid: (id: string) => {
        const { currentEvent } = get();
        if (!currentEvent) return;

        const updatedExpenses = currentEvent.budget.expenses.map((e) => {
          if (e.id === id) {
            return { ...e, isPaid: !e.isPaid };
          }
          return e;
        });

        const updatedAllocations = recalculateAllocations(currentEvent.budget.allocations, updatedExpenses);

        set({
          currentEvent: {
            ...currentEvent,
            budget: {
              ...currentEvent.budget,
              expenses: updatedExpenses,
              allocations: updatedAllocations,
            },
            updatedAt: new Date().toISOString(),
          },
        });
      },

      addGuest: (guestData) => {
        const { currentEvent } = get();
        if (!currentEvent) return;

        const newGuest: Guest = {
          ...guestData,
          id: `g-${Date.now()}`,
        };

        const updatedList = [...currentEvent.guests.list, newGuest];
        const updatedSummary = computeDietarySummary(updatedList, currentEvent.guestCount);
        const updatedGuestCount = Math.max(currentEvent.guestCount, updatedSummary.totalInvited);

        set({
          currentEvent: {
            ...currentEvent,
            guestCount: updatedGuestCount,
            guests: {
              ...currentEvent.guests,
              list: updatedList,
              dietarySummary: updatedSummary,
            },
            updatedAt: new Date().toISOString(),
          },
        });
      },

      updateGuest: (guest) => {
        const { currentEvent } = get();
        if (!currentEvent) return;

        const updatedList = currentEvent.guests.list.map((g) => (g.id === guest.id ? guest : g));
        const updatedSummary = computeDietarySummary(updatedList, currentEvent.guestCount);
        const updatedGuestCount = Math.max(currentEvent.guestCount, updatedSummary.totalInvited);

        set({
          currentEvent: {
            ...currentEvent,
            guestCount: updatedGuestCount,
            guests: {
              ...currentEvent.guests,
              list: updatedList,
              dietarySummary: updatedSummary,
            },
            updatedAt: new Date().toISOString(),
          },
        });
      },

      deleteGuest: (id: string) => {
        const { currentEvent } = get();
        if (!currentEvent) return;

        const updatedList = currentEvent.guests.list.filter((g) => g.id !== id);
        const updatedSummary = computeDietarySummary(updatedList, currentEvent.guestCount);

        set({
          currentEvent: {
            ...currentEvent,
            guests: {
              ...currentEvent.guests,
              list: updatedList,
              dietarySummary: updatedSummary,
            },
            updatedAt: new Date().toISOString(),
          },
        });
      },

      toggleMilestoneStatus: (id: string) => {
        const { currentEvent } = get();
        if (!currentEvent) return;

        const updatedMilestones = currentEvent.timeline.milestones.map((m) => {
          if (m.id === id) {
            const nextStatus: TimelineMilestone['status'] =
              m.status === 'pending' ? 'in_progress' : m.status === 'in_progress' ? 'completed' : 'pending';
            return {
              ...m,
              status: nextStatus,
              completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
            };
          }
          return m;
        });

        set({
          currentEvent: {
            ...currentEvent,
            timeline: {
              ...currentEvent.timeline,
              milestones: updatedMilestones,
            },
            updatedAt: new Date().toISOString(),
          },
        });
      },

      addMilestone: (milestoneData) => {
        const { currentEvent } = get();
        if (!currentEvent) return;

        const newMilestone: TimelineMilestone = {
          ...milestoneData,
          id: `ms-${Date.now()}`,
        };

        set({
          currentEvent: {
            ...currentEvent,
            timeline: {
              ...currentEvent.timeline,
              milestones: [...currentEvent.timeline.milestones, newMilestone].sort((a, b) => a.time.localeCompare(b.time)),
            },
            updatedAt: new Date().toISOString(),
          },
        });
      },

      updateMilestone: (milestone) => {
        const { currentEvent } = get();
        if (!currentEvent) return;

        const updated = currentEvent.timeline.milestones.map((m) => (m.id === milestone.id ? milestone : m));
        set({
          currentEvent: {
            ...currentEvent,
            timeline: {
              ...currentEvent.timeline,
              milestones: updated.sort((a, b) => a.time.localeCompare(b.time)),
            },
            updatedAt: new Date().toISOString(),
          },
        });
      },

      deleteMilestone: (id: string) => {
        const { currentEvent } = get();
        if (!currentEvent) return;

        set({
          currentEvent: {
            ...currentEvent,
            timeline: {
              ...currentEvent.timeline,
              milestones: currentEvent.timeline.milestones.filter((m) => m.id !== id),
            },
            updatedAt: new Date().toISOString(),
          },
        });
      },

      toggleDayOfLive: () => {
        const { currentEvent } = get();
        if (!currentEvent) return;

        set({
          currentEvent: {
            ...currentEvent,
            timeline: {
              ...currentEvent.timeline,
              isDayOfLiveActive: !currentEvent.timeline.isDayOfLiveActive,
            },
          },
        });
      },

      toggleVendorChecklist: (categoryId: string, checklistId: string) => {
        const { currentEvent } = get();
        if (!currentEvent) return;

        const updatedCategories = currentEvent.vendors.categories.map((cat) => {
          if (cat.id === categoryId) {
            return {
              ...cat,
              checklist: cat.checklist.map((item) =>
                item.id === checklistId ? { ...item, isCompleted: !item.isCompleted } : item
              ),
            };
          }
          return cat;
        });

        set({
          currentEvent: {
            ...currentEvent,
            vendors: {
              ...currentEvent.vendors,
              categories: updatedCategories,
            },
            updatedAt: new Date().toISOString(),
          },
        });
      },

      dismissVendorReview: (categoryId: string) => {
        const { currentEvent } = get();
        if (!currentEvent) return;
        set({
          currentEvent: {
            ...currentEvent,
            vendors: {
              ...currentEvent.vendors,
              categories: currentEvent.vendors.categories.map((cat) =>
                cat.id === categoryId ? { ...cat, needsReview: false, reviewReason: undefined } : cat
              ),
            },
            updatedAt: new Date().toISOString(),
          },
        });
      },

      syncVendorDraftHeadcount: (categoryId: string, newCount: number) => {
        const { currentEvent } = get();
        if (!currentEvent) return;
        set({
          currentEvent: {
            ...currentEvent,
            vendors: {
              ...currentEvent.vendors,
              categories: currentEvent.vendors.categories.map((cat) => {
                if (cat.id === categoryId) {
                  const updatedDraft = cat.inquiryDraft.replace(/\b\d+\s+guests?\b/gi, `${newCount} guests`);
                  return {
                    ...cat,
                    inquiryDraft: updatedDraft,
                    needsReview: false,
                    reviewReason: undefined,
                  };
                }
                return cat;
              }),
            },
            updatedAt: new Date().toISOString(),
          },
        });
      },

      dismissInvitationReview: (invitationId: string) => {
        const { currentEvent } = get();
        if (!currentEvent) return;
        set({
          currentEvent: {
            ...currentEvent,
            creative: {
              ...currentEvent.creative,
              invitations: currentEvent.creative.invitations.map((inv) =>
                inv.id === invitationId ? { ...inv, needsReview: false, reviewReason: undefined } : inv
              ),
            },
            updatedAt: new Date().toISOString(),
          },
        });
      },

      exportEventJson: () => {
        const { currentEvent } = get();
        return JSON.stringify(currentEvent, null, 2);
      },

      importEventJson: (jsonString: string): ImportResult => {
        try {
          const raw = JSON.parse(jsonString);
          // Complete Zod schema validation
          const validation = CelebrAIEventSchema.safeParse(raw);
          if (!validation.success) {
            const firstError = validation.error.issues[0];
            return {
              success: false,
              error: `Invalid event JSON: ${firstError.path.join('.')} - ${firstError.message}`,
            };
          }

          set({
            currentEvent: validation.data as CelebrAIEvent,
            systemMode: 'sample',
            systemMessage: `Imported event: "${validation.data.title}"`,
            activeTab: 'overview',
          });
          return { success: true };
        } catch (e: any) {
          return {
            success: false,
            error: `JSON parse error: ${e?.message || 'Malformed JSON string'}`,
          };
        }
      },

      resetEvent: () => {
        set({
          currentEvent: null,
          systemMode: 'offline',
          systemMessage: 'No event loaded',
        });
      },
    }),
    {
      name: 'celebr-ai-storage-v1',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0 || !persistedState) {
          return {
            currentEvent: sampleEventData,
            systemMode: 'sample',
            systemMessage: 'Migrated to v1 storage schema',
          };
        }
        return persistedState;
      },
      partialize: (state) => ({
        currentEvent: state.currentEvent,
        systemMode: state.systemMode,
        systemMessage: state.systemMessage,
      }),
    }
  )
);
