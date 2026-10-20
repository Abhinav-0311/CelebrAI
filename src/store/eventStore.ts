import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CelebrAIEvent, SystemAIMode, Guest, ExpenseItem, TimelineMilestone, AdaptiveRippleAlert } from '../types/event';
import { EventCreationInput } from '../types/schemas';
import { sampleEventData } from '../services/sampleEvent';
import { generateCelebrAIPlan } from '../services/aiService';
import { analyzeGuestCountChange, analyzeBudgetChange, applyRipplePatch } from '../services/adaptiveEngine';

export type NavigationTab =
  | 'overview'
  | 'budget'
  | 'timeline'
  | 'guests'
  | 'creative'
  | 'vendors'
  | 'intelligence';

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
  updateTotalBudget: (newBudget: number) => void;
  applyRipple: (alert: AdaptiveRippleAlert) => void;
  dismissRipple: (alertId: string) => void;

  // Budget Actions
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

  // Persistence & Data Transfer
  exportEventJson: () => string;
  importEventJson: (jsonString: string) => boolean;
  resetEvent: () => void;
}

export const useEventStore = create<EventStoreState>()(
  persist(
    (set, get) => ({
      currentEvent: sampleEventData, // Defaults to preloaded sample event for instant showcase
      systemMode: 'sample',
      systemMessage: 'Sample Showcase Event Loaded',
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

          const newEvent: CelebrAIEvent = {
            id: `evt-${Date.now()}`,
            title: input.title,
            eventType: input.eventType,
            guestCount: input.guestCount,
            eventDate: input.eventDate,
            location: input.location,
            venueType: input.venueType,
            vibeKeywords: input.vibeKeywords,
            status: 'planning',
            theme: result.plan.theme,
            budget: {
              totalBudget: input.totalBudget,
              currency: input.currency || 'USD',
              contingencyRate: 0.05,
              allocations: result.plan.allocations,
              expenses: [],
            },
            guests: {
              list: [],
              dietarySummary: {
                totalGuests: input.guestCount,
                attendingGuests: 0,
                veganCount: 0,
                vegetarianCount: 0,
                glutenFreeCount: 0,
                halalCount: 0,
                nutAllergyCount: 0,
                otherCount: 0,
              },
              targetTableCapacity: 10,
            },
            timeline: {
              date: input.eventDate,
              startTime: '14:00',
              endTime: '22:00',
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

      updateTotalBudget: (newBudget: number) => {
        const { currentEvent } = get();
        if (!currentEvent) return;

        const ripple = analyzeBudgetChange(currentEvent, newBudget);
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
        if (!currentEvent) return;

        const updatedEvent = applyRipplePatch(currentEvent, alert);
        set({
          currentEvent: updatedEvent,
          isAdaptiveModalOpen: false,
          activeRippleAlert: null,
        });
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

        // Update actualSpent in matching allocation
        const updatedAllocations = currentEvent.budget.allocations.map((alloc) => {
          if (alloc.category === expenseData.category) {
            return {
              ...alloc,
              actualSpent: alloc.actualSpent + (expenseData.isPaid ? expenseData.actualCost : 0),
            };
          }
          return alloc;
        });

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

        const expenseToDelete = currentEvent.budget.expenses.find((e) => e.id === id);
        const filtered = currentEvent.budget.expenses.filter((e) => e.id !== id);

        const updatedAllocations = currentEvent.budget.allocations.map((alloc) => {
          if (expenseToDelete && alloc.category === expenseToDelete.category && expenseToDelete.isPaid) {
            return {
              ...alloc,
              actualSpent: Math.max(0, alloc.actualSpent - expenseToDelete.actualCost),
            };
          }
          return alloc;
        });

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

        let diff = 0;
        let category = '';

        const updatedExpenses = currentEvent.budget.expenses.map((e) => {
          if (e.id === id) {
            const nextPaid = !e.isPaid;
            diff = nextPaid ? e.actualCost : -e.actualCost;
            category = e.category;
            return { ...e, isPaid: nextPaid };
          }
          return e;
        });

        const updatedAllocations = currentEvent.budget.allocations.map((alloc) => {
          if (alloc.category === category) {
            return {
              ...alloc,
              actualSpent: Math.max(0, alloc.actualSpent + diff),
            };
          }
          return alloc;
        });

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

        // Recalculate dietary counts
        const attendingGuests = updatedList.filter((g) => g.rsvpStatus === 'attending').length;
        const veganCount = updatedList.filter((g) => g.dietary.includes('vegan')).length;
        const vegetarianCount = updatedList.filter((g) => g.dietary.includes('vegetarian')).length;
        const glutenFreeCount = updatedList.filter((g) => g.dietary.includes('gluten_free')).length;
        const halalCount = updatedList.filter((g) => g.dietary.includes('halal')).length;
        const nutAllergyCount = updatedList.filter((g) => g.dietary.includes('nut_allergy')).length;
        const otherCount = updatedList.filter((g) => g.dietary.includes('other') || g.dietary.includes('dairy_free') || g.dietary.includes('kosher')).length;

        set({
          currentEvent: {
            ...currentEvent,
            guests: {
              ...currentEvent.guests,
              list: updatedList,
              dietarySummary: {
                totalGuests: currentEvent.guestCount,
                attendingGuests,
                veganCount,
                vegetarianCount,
                glutenFreeCount,
                halalCount,
                nutAllergyCount,
                otherCount,
              },
            },
            updatedAt: new Date().toISOString(),
          },
        });
      },

      updateGuest: (guest) => {
        const { currentEvent } = get();
        if (!currentEvent) return;

        const updatedList = currentEvent.guests.list.map((g) => (g.id === guest.id ? guest : g));
        const attendingGuests = updatedList.filter((g) => g.rsvpStatus === 'attending').length;

        set({
          currentEvent: {
            ...currentEvent,
            guests: {
              ...currentEvent.guests,
              list: updatedList,
              dietarySummary: {
                ...currentEvent.guests.dietarySummary,
                attendingGuests,
              },
            },
            updatedAt: new Date().toISOString(),
          },
        });
      },

      deleteGuest: (id: string) => {
        const { currentEvent } = get();
        if (!currentEvent) return;

        const updatedList = currentEvent.guests.list.filter((g) => g.id !== id);
        const attendingGuests = updatedList.filter((g) => g.rsvpStatus === 'attending').length;

        set({
          currentEvent: {
            ...currentEvent,
            guests: {
              ...currentEvent.guests,
              list: updatedList,
              dietarySummary: {
                ...currentEvent.guests.dietarySummary,
                attendingGuests,
              },
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

      exportEventJson: () => {
        const { currentEvent } = get();
        return JSON.stringify(currentEvent, null, 2);
      },

      importEventJson: (jsonString: string) => {
        try {
          const parsed = JSON.parse(jsonString) as CelebrAIEvent;
          if (!parsed.id || !parsed.title || !parsed.budget || !parsed.timeline) {
            throw new Error('Invalid CelebrAI event schema');
          }
          set({
            currentEvent: parsed,
            systemMode: 'sample',
            systemMessage: `Imported event: "${parsed.title}"`,
            activeTab: 'overview',
          });
          return true;
        } catch (e) {
          console.error('Failed to import event JSON:', e);
          return false;
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
      partialize: (state) => ({
        currentEvent: state.currentEvent,
        systemMode: state.systemMode,
        systemMessage: state.systemMessage,
      }),
    }
  )
);
