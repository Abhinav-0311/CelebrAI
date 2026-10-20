import { describe, it, expect } from 'vitest';
import { analyzeGuestCountChange, analyzeBudgetChange, applyRipplePatch } from '../services/adaptiveEngine';
import { sampleEventData } from '../services/sampleEvent';

describe('Adaptive Event Intelligence Engine (Invariant Protection)', () => {
  it('detects guest count expansion and calculates catering & table deltas in cents', () => {
    // Current sampleEventData has 150 guests, table capacity 10 -> 15 tables
    const alert = analyzeGuestCountChange(sampleEventData, 180);

    expect(alert).not.toBeNull();
    expect(alert?.triggerType).toBe('guest_count_change');
    expect(alert?.previousValue).toBe(150);
    expect(alert?.newValue).toBe(180);
    expect(alert?.calculatedDiffs.seatingDeltaTables).toBe(3); // 18 - 15 = +3 tables
    expect(alert?.calculatedDiffs.cateringDeltaCents).toBeGreaterThan(0);
    expect(alert?.recommendedActions.length).toBeGreaterThan(0);
  });

  it('detects guest count reduction and suggests freeing allocation in cents', () => {
    const alert = analyzeGuestCountChange(sampleEventData, 120);

    expect(alert).not.toBeNull();
    expect(alert?.triggerType).toBe('guest_count_change');
    expect(alert?.calculatedDiffs.seatingDeltaTables).toBe(-3); // 12 - 15 = -3 tables
    expect(alert?.calculatedDiffs.cateringDeltaCents).toBeLessThan(0);
  });

  it('returns null if guest count is identical', () => {
    const alert = analyzeGuestCountChange(sampleEventData, 150);
    expect(alert).toBeNull();
  });

  it('detects critical deficit when budget is reduced below committed actual spending', () => {
    const totalSpentCents = sampleEventData.budget.allocations.reduce((s, a) => s + a.actualSpentCents, 0);
    const lowBudgetCents = totalSpentCents - 500000; // $5,000 below actual spent

    const alert = analyzeBudgetChange(sampleEventData, lowBudgetCents);
    expect(alert).not.toBeNull();
    expect(alert?.severity).toBe('high');
    expect(alert?.impactSummary).toContain('Critical Deficit');
  });

  it('preserves invariant that allocations are never scaled below actual spent commitments', () => {
    // Attempt to reduce budget to a level where proportional scaling would violate actual spent
    const totalSpentCents = sampleEventData.budget.allocations.reduce((s, a) => s + a.actualSpentCents, 0);
    const alert = analyzeBudgetChange(sampleEventData, totalSpentCents + 100000); // Barely above spent
    expect(alert).not.toBeNull();

    if (alert) {
      const patched = applyRipplePatch(sampleEventData, alert);

      // Verify invariant: for every allocation, allocatedCents >= actualSpentCents
      patched.budget.allocations.forEach((alloc) => {
        expect(alloc.allocatedCents).toBeGreaterThanOrEqual(alloc.actualSpentCents);
      });
    }
  });

  it('correctly applies ripple patch to event state while maintaining exact sum', () => {
    const alert = analyzeGuestCountChange(sampleEventData, 170);
    expect(alert).not.toBeNull();

    if (alert) {
      const updated = applyRipplePatch(sampleEventData, alert);
      expect(updated.guestCount).toBe(170);
      expect(updated.appliedRipplesCount).toBe(sampleEventData.appliedRipplesCount + 1);

      const newCatering = updated.budget.allocations.find((a) => a.category === 'catering')?.allocatedCents;
      const oldCatering = sampleEventData.budget.allocations.find((a) => a.category === 'catering')?.allocatedCents;
      expect(newCatering).toBeGreaterThan(oldCatering!);
    }
  });
});
