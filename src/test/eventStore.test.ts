import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEventStore } from '../store/eventStore';
import { computeFinancialSummary } from '../services/eventAnalytics';
import { EventCreationInput } from '../types/schemas';

describe('Event Store (Business Logic & State Invariants)', () => {
  beforeEach(() => {
    useEventStore.getState().loadSampleEvent();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
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

  it('adds a guest with plus-ones and updates confirmed vs total invited dietary metrics consistently', () => {
    const store = useEventStore.getState();
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
    // Total invited is maintained consistent with event guestCount (150)
    expect(updated?.guests.dietarySummary.totalInvited).toBe(150);
    expect(updated?.guestCount).toBe(150);
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

  it('updates milestone status and toggles day-of live mode', () => {
    const store = useEventStore.getState();
    const firstMilestone = store.currentEvent?.timeline.milestones[0];
    expect(firstMilestone).toBeDefined();
    const initialStatus = firstMilestone!.status;

    store.toggleMilestoneStatus(firstMilestone!.id);
    const updatedMilestone = useEventStore.getState().currentEvent?.timeline.milestones[0];
    expect(updatedMilestone?.status).not.toBe(initialStatus);

    expect(useEventStore.getState().currentEvent?.timeline.isDayOfLiveActive).toBe(false);
    store.toggleDayOfLive();
    expect(useEventStore.getState().currentEvent?.timeline.isDayOfLiveActive).toBe(true);
    store.toggleDayOfLive();
    expect(useEventStore.getState().currentEvent?.timeline.isDayOfLiveActive).toBe(false);
  });

  it('triggers adaptive analysis and applies ripple patch through the store', () => {
    const store = useEventStore.getState();
    // Trigger guest count adjustment
    store.updateGuestCount(180);

    const alert = useEventStore.getState().activeRippleAlert;
    expect(alert).not.toBeNull();
    expect(alert?.triggerType).toBe('guest_count_change');

    if (alert) {
      const res = store.applyRipple(alert);
      expect(res.success).toBe(true);
      expect(useEventStore.getState().currentEvent?.guestCount).toBe(180);
      expect(useEventStore.getState().activeRippleAlert).toBeNull();
    }
  });

  it('rejects infeasible budget reduction through applyRipple without closing modal or applying change', () => {
    const store = useEventStore.getState();
    const totalSpent = store.currentEvent?.budget.allocations.reduce((s, a) => s + a.actualSpentCents, 0) || 0;
    
    // Attempt reduction below committed spending
    store.updateTotalBudgetCents(totalSpent - 500000);
    const alert = useEventStore.getState().activeRippleAlert;
    expect(alert).not.toBeNull();
    expect(alert?.severity).toBe('high');

    if (alert) {
      const res = store.applyRipple(alert);
      expect(res.success).toBe(false);
      expect(res.reason).toContain('Budget modification rejected');
      // Ensure currentEvent was NOT mutated
      expect(useEventStore.getState().currentEvent?.budget.totalBudgetCents).toBe(4500000);
    }
  });

  it('enforces fresh event creation with zero committed expenditure and empty ledger (Bug 1 fix)', async () => {
    const store = useEventStore.getState();
    const freshInput: EventCreationInput = {
      title: 'Solstice Sunset Wedding',
      eventType: 'wedding',
      guestCount: 140,
      totalBudget: 42000,
      currency: 'USD',
      eventDate: '2026-09-21',
      timezone: 'America/Los_Angeles',
      location: 'Napa Valley Estate',
      venueType: 'garden',
      vibeKeywords: ['Romantic', 'Golden Hour', 'Atelier'],
    };

    await store.createEvent(freshInput);

    const freshEvent = useEventStore.getState().currentEvent;
    expect(freshEvent).not.toBeNull();
    expect(freshEvent?.title).toBe('Solstice Sunset Wedding');
    expect(freshEvent?.guestCount).toBe(140);
    expect(freshEvent?.budget.totalBudgetCents).toBe(4200000); // $42,000.00

    // Critical Bug 1 assertion: expense ledger must be strictly empty
    expect(freshEvent?.budget.expenses).toEqual([]);

    // Critical Bug 1 assertion: every allocation must initialize with actualSpentCents = 0
    freshEvent?.budget.allocations.forEach((alloc) => {
      expect(alloc.actualSpentCents).toBe(0);
    });

    // Financial summary must show strictly $0.00 committed and 100% available headroom
    const summary = computeFinancialSummary(freshEvent!.budget);
    expect(summary.totalCommittedCents).toBe(0);
    expect(summary.totalPaidCents).toBe(0);
    expect(summary.totalOutstandingCents).toBe(0);
    expect(summary.remainingHeadroomCents).toBe(4200000);
    expect(summary.isOverBudget).toBe(false);
  });
  it('rejects malformed pending ripples without replacing the current event', () => {
    const current = useEventStore.getState().currentEvent!;
    const result = useEventStore.getState().importEventJson(JSON.stringify({
      ...current, pendingRipples: [{ id: 'broken', status: 'pending_review' }],
    }));
    expect(result.success).toBe(false);
    expect(result.error).toContain('pendingRipples');
    expect(useEventStore.getState().currentEvent).toBe(current);
  });

  it('tracks an expense through unpaid, paid and deleted states without cent drift', () => {
    const store = useEventStore.getState();
    const before = computeFinancialSummary(store.currentEvent!.budget);
    store.addExpense({ allocationId: 'alloc-1', category: 'venue', name: 'Final cleaning',
      estimatedCents: 1025, actualCents: 1025, isPaid: false });
    const expense = useEventStore.getState().currentEvent!.budget.expenses.find(item => item.name === 'Final cleaning')!;
    expect(computeFinancialSummary(useEventStore.getState().currentEvent!.budget).totalOutstandingCents).toBe(before.totalOutstandingCents + 1025);
    store.toggleExpensePaid(expense.id);
    expect(computeFinancialSummary(useEventStore.getState().currentEvent!.budget).totalPaidCents).toBe(before.totalPaidCents + 1025);
    store.deleteExpense(expense.id);
    expect(computeFinancialSummary(useEventStore.getState().currentEvent!.budget)).toEqual(before);
  });

  it('updates dietary portions after a guest changes RSVP and is removed', () => {
    const store = useEventStore.getState();
    const before = store.currentEvent!.guests.dietarySummary;
    store.addGuest({ name: 'Dietary test guest', rsvpStatus: 'attending', plusOnes: 2, dietary: ['vegan'] });
    const guest = useEventStore.getState().currentEvent!.guests.list.find(item => item.name === 'Dietary test guest')!;
    expect(useEventStore.getState().currentEvent!.guests.dietarySummary.confirmedVegan).toBe(before.confirmedVegan + 3);
    store.updateGuest({ ...guest, rsvpStatus: 'declined' });
    expect(useEventStore.getState().currentEvent!.guests.dietarySummary.confirmedAttending).toBe(before.confirmedAttending);
    store.deleteGuest(guest.id);
    expect(useEventStore.getState().currentEvent!.guests.list.some(item => item.id === guest.id)).toBe(false);
    expect(useEventStore.getState().currentEvent!.guests.dietarySummary.confirmedVegan).toBe(before.confirmedVegan);
  });

  it('adds, edits, progresses and removes an operational milestone', () => {
    const store = useEventStore.getState();
    const originalCount = store.currentEvent!.timeline.milestones.length;
    store.addMilestone({ time: '18:45', durationMinutes: 15, title: 'Briefing', category: 'speech',
      assignedTo: 'Coordinator', status: 'pending' });
    const item = useEventStore.getState().currentEvent!.timeline.milestones.find(item => item.title === 'Briefing')!;
    store.updateMilestone({ ...item, title: 'Team briefing', time: '18:50' });
    for (const status of ['in_progress', 'completed', 'pending']) {
      store.toggleMilestoneStatus(item.id);
      expect(useEventStore.getState().currentEvent!.timeline.milestones.find(value => value.id === item.id)?.status).toBe(status);
    }
    expect(useEventStore.getState().currentEvent!.timeline.milestones.find(value => value.id === item.id)).toMatchObject({ title: 'Team briefing', time: '18:50' });
    store.deleteMilestone(item.id);
    expect(useEventStore.getState().currentEvent!.timeline.milestones).toHaveLength(originalCount);
  });

  it('preserves a pending review through JSON transfer and dismisses it without applying', () => {
    const store = useEventStore.getState();
    store.updateGuestCount(180);
    const alert = useEventStore.getState().activeRippleAlert!;
    expect(alert).not.toBeNull();
    const exported = store.exportEventJson();
    store.resetEvent();
    expect(store.importEventJson(exported).success).toBe(true);
    expect(useEventStore.getState().currentEvent!.pendingRipples[0]).toEqual(alert);
    store.setActiveRippleAlert(alert);
    store.setAdaptiveModalOpen(true);
    store.dismissRipple(alert.id);
    expect(useEventStore.getState().currentEvent!.guestCount).toBe(150);
    expect(useEventStore.getState().currentEvent!.pendingRipples[0].status).toBe('dismissed');
    expect(useEventStore.getState().isAdaptiveModalOpen).toBe(false);
  });

  it('syncs reviewed vendor headcount and invitation status after an applied change', () => {
    const store = useEventStore.getState();
    const firstVendor = store.currentEvent!.vendors.categories[0];
    const firstTask = firstVendor.checklist[0];
    store.toggleVendorChecklist(firstVendor.id, firstTask.id);
    expect(useEventStore.getState().currentEvent!.vendors.categories[0].checklist[0].isCompleted).toBe(!firstTask.isCompleted);
    store.updateGuestCount(180);
    expect(store.applyRipple(useEventStore.getState().activeRippleAlert!).success).toBe(true);
    const event = useEventStore.getState().currentEvent!;
    const vendor = event.vendors.categories.find(item => item.category === 'catering')!;
    expect(vendor.needsReview).toBe(true);
    store.syncVendorDraftHeadcount(vendor.id, 180);
    expect(useEventStore.getState().currentEvent!.vendors.categories.find(item => item.id === vendor.id)?.inquiryDraft).toContain('180 guests');
    store.dismissVendorReview(vendor.id);
    expect(useEventStore.getState().currentEvent!.vendors.categories.find(item => item.id === vendor.id)?.needsReview).toBe(false);
    const invitation = event.creative.invitations[0];
    store.dismissInvitationReview(invitation.id);
    expect(useEventStore.getState().currentEvent!.creative.invitations[0].needsReview).toBe(false);
    expect(store.importEventJson(store.exportEventJson()).success).toBe(true);
  });

  it.each([
    { newValue: 'invalid count' },
    { severity: 'unknown' },
    { calculatedDiffs: { cateringDeltaCents: 'invalid', seatingDeltaTables: 1, budgetVarianceCents: 0 } },
  ])('rejects a corrupted review field while retaining the current event (%j)', patch => {
    const store = useEventStore.getState();
    store.updateGuestCount(180);
    const event = useEventStore.getState().currentEvent!;
    const result = store.importEventJson(JSON.stringify({ ...event, pendingRipples: [{ ...event.pendingRipples[0], ...patch }] }));
    expect(result.success).toBe(false);
    expect(useEventStore.getState().currentEvent).toBe(event);
  });

  it('retains valid legacy date-review metadata during JSON transfer', () => {
    const store = useEventStore.getState();
    store.updateGuestCount(180);
    const event = useEventStore.getState().currentEvent!;
    const review = { ...event.pendingRipples[0], triggerType: 'date_change',
      previousValue: '2026-11-28', newValue: '2026-12-05' };
    expect(store.importEventJson(JSON.stringify({ ...event, pendingRipples: [review] })).success).toBe(true);
    expect(JSON.parse(store.exportEventJson()).pendingRipples[0]).toEqual(review);
  });

});
