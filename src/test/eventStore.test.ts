import { describe, it, expect, beforeEach } from 'vitest';
import { useEventStore } from '../store/eventStore';

describe('Event Store (Zustand & Business Logic)', () => {
  beforeEach(() => {
    useEventStore.getState().loadSampleEvent();
  });

  it('loads sample event properly with initial state', () => {
    const state = useEventStore.getState();
    expect(state.currentEvent).not.toBeNull();
    expect(state.currentEvent?.title).toBe('Aurora Horizons — 10th Anniversary & Honors Gala');
    expect(state.systemMode).toBe('sample');
  });

  it('adds an expense and updates actualSpent for the category', () => {
    const store = useEventStore.getState();
    const initialVenueAlloc = store.currentEvent?.budget.allocations.find((a) => a.category === 'venue')?.actualSpent || 0;

    store.addExpense({
      allocationId: 'alloc-1',
      name: 'Extra Cleaning Fee',
      category: 'venue',
      estimatedCost: 300,
      actualCost: 350,
      isPaid: true,
      vendor: 'Skyline Cleaning',
    });

    const updated = useEventStore.getState().currentEvent;
    const newVenueAlloc = updated?.budget.allocations.find((a) => a.category === 'venue')?.actualSpent || 0;
    expect(newVenueAlloc).toBe(initialVenueAlloc + 350);
    expect(updated?.budget.expenses.some((e) => e.name === 'Extra Cleaning Fee')).toBe(true);
  });

  it('adds a guest and updates dietary summary aggregation', () => {
    const store = useEventStore.getState();
    const initialVegan = store.currentEvent?.guests.dietarySummary.veganCount || 0;

    store.addGuest({
      name: 'Eleanor Sterling',
      email: 'eleanor@example.com',
      rsvpStatus: 'attending',
      plusOnes: 0,
      dietary: ['vegan'],
      tableNumber: 4,
    });

    const updated = useEventStore.getState().currentEvent;
    expect(updated?.guests.dietarySummary.veganCount).toBe(initialVegan + 1);
  });

  it('toggles timeline milestone status', () => {
    const store = useEventStore.getState();
    const milestoneId = store.currentEvent?.timeline.milestones[1].id; // m-2 is pending
    expect(milestoneId).toBeDefined();

    store.toggleMilestoneStatus(milestoneId!);
    const step1 = useEventStore.getState().currentEvent?.timeline.milestones.find((m) => m.id === milestoneId);
    expect(step1?.status).toBe('in_progress');

    store.toggleMilestoneStatus(milestoneId!);
    const step2 = useEventStore.getState().currentEvent?.timeline.milestones.find((m) => m.id === milestoneId);
    expect(step2?.status).toBe('completed');
  });

  it('performs clean export and round-trip import of JSON event', () => {
    const store = useEventStore.getState();
    const exportedJson = store.exportEventJson();
    expect(typeof exportedJson).toBe('string');

    // Reset event
    store.resetEvent();
    expect(useEventStore.getState().currentEvent).toBeNull();

    // Restore from JSON
    const success = useEventStore.getState().importEventJson(exportedJson);
    expect(success).toBe(true);
    expect(useEventStore.getState().currentEvent?.title).toBe('Aurora Horizons — 10th Anniversary & Honors Gala');
  });
});
