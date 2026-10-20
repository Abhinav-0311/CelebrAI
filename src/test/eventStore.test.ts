import { describe, it, expect, beforeEach } from 'vitest';
import { useEventStore } from '../store/eventStore';

describe('Event Store (Business Logic & State Invariants)', () => {
  beforeEach(() => {
    useEventStore.getState().loadSampleEvent();
  });

  it('loads sample event properly with initial minor-unit budget and version 1 schema', () => {
    const state = useEventStore.getState();
    expect(state.currentEvent).not.toBeNull();
    expect(state.currentEvent?.schemaVersion).toBe(1);
    expect(state.currentEvent?.budget.totalBudgetCents).toBe(4500000); // $45,000.00
    expect(state.systemMode).toBe('sample');
  });

  it('adds an expense in integer cents and updates allocation actualSpentCents accurately', () => {
    const store = useEventStore.getState();
    const initialVenueSpent = store.currentEvent?.budget.allocations.find((a) => a.category === 'venue')?.actualSpentCents || 0;

    store.addExpense({
      allocationId: 'alloc-1',
      name: 'Extra Cleaning Deposit',
      category: 'venue',
      estimatedCents: 30000, // $300.00
      actualCents: 35000,    // $350.00
      isPaid: true,
      vendor: 'Skyline Cleaning',
    });

    const updated = useEventStore.getState().currentEvent;
    const newVenueSpent = updated?.budget.allocations.find((a) => a.category === 'venue')?.actualSpentCents || 0;
    expect(newVenueSpent).toBe(initialVenueSpent + 35000);
    expect(updated?.budget.expenses.some((e) => e.name === 'Extra Cleaning Deposit')).toBe(true);
  });

  it('adds a guest with plus-ones and updates confirmed vs total invited dietary metrics', () => {
    const store = useEventStore.getState();
    const initialInvited = store.currentEvent?.guests.dietarySummary.totalInvited || 0;
    const initialVegan = store.currentEvent?.guests.dietarySummary.confirmedVegan || 0;

    store.addGuest({
      name: 'Eleanor Sterling',
      email: 'eleanor@example.com',
      rsvpStatus: 'attending',
      plusOnes: 2, // 1 + 2 = 3 attendees
      dietary: ['vegan'],
      tableNumber: 4,
    });

    const updated = useEventStore.getState().currentEvent;
    // Total invited should increase by 1 + 2 = 3
    expect(updated?.guests.dietarySummary.totalInvited).toBe(initialInvited + 3);
    // Vegan count should increase by 3
    expect(updated?.guests.dietarySummary.confirmedVegan).toBe(initialVegan + 3);
  });

  it('rejects malformed or corrupted JSON on import with descriptive error', () => {
    const store = useEventStore.getState();

    // 1. Completely invalid JSON string
    const res1 = store.importEventJson('{ invalid: json }');
    expect(res1.success).toBe(false);
    expect(res1.error).toContain('JSON parse error');

    // 2. Syntactically valid JSON missing required domain schema fields
    const res2 = store.importEventJson(JSON.stringify({ id: 'bad-1', title: 'Missing properties' }));
    expect(res2.success).toBe(false);
    expect(res2.error).toContain('Invalid event JSON');

    // Ensure state was not corrupted
    expect(useEventStore.getState().currentEvent?.id).toBe('evt-sample-aurora-gala');
  });

  it('performs clean lossless export and round-trip import of valid JSON event', () => {
    const store = useEventStore.getState();
    const exportedJson = store.exportEventJson();
    expect(typeof exportedJson).toBe('string');

    // Reset event
    store.resetEvent();
    expect(useEventStore.getState().currentEvent).toBeNull();

    // Restore from JSON
    const result = useEventStore.getState().importEventJson(exportedJson);
    expect(result.success).toBe(true);
    expect(useEventStore.getState().currentEvent?.title).toBe('Aurora Horizons — 10th Anniversary & Honors Gala');
    expect(useEventStore.getState().currentEvent?.budget.totalBudgetCents).toBe(4500000);
  });
});
