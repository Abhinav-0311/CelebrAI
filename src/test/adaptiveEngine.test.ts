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

  it('rejects infeasible budget changes when proposed budget is below committed spending without mutating state', () => {
    const totalSpentCents = sampleEventData.budget.allocations.reduce((s, a) => s + a.actualSpentCents, 0);
    const lowBudgetCents = totalSpentCents - 200000; // $2,000 below committed spending

    const alert = analyzeBudgetChange(sampleEventData, lowBudgetCents);
    expect(alert).not.toBeNull();
    expect(alert?.severity).toBe('high');

    const result = applyRipplePatch(sampleEventData, alert!);
    // State must be completely unmodified
    expect(result.budget.totalBudgetCents).toBe(sampleEventData.budget.totalBudgetCents);
    expect(result.appliedRipplesCount).toBe(sampleEventData.appliedRipplesCount);
    expect(result.budget.allocations).toEqual(sampleEventData.budget.allocations);
  });

  it('distributes discretionary funds proportionally with zero-cent drift when budget is barely above committed expenditures', () => {
    const totalSpentCents = sampleEventData.budget.allocations.reduce((s, a) => s + a.actualSpentCents, 0);
    const targetBudgetCents = totalSpentCents + 13749; // $137.49 discretionary pool

    const alert = analyzeBudgetChange(sampleEventData, targetBudgetCents);
    expect(alert).not.toBeNull();

    const patched = applyRipplePatch(sampleEventData, alert!);
    expect(patched.budget.totalBudgetCents).toBe(targetBudgetCents);

    // Sum of allocations must match targetBudgetCents to the exact single cent
    const sumAllocated = patched.budget.allocations.reduce((s, a) => s + a.allocatedCents, 0);
    expect(sumAllocated).toBe(targetBudgetCents);

    // Invariant: every category >= actualSpentCents
    patched.budget.allocations.forEach((alloc) => {
      expect(alloc.allocatedCents).toBeGreaterThanOrEqual(alloc.actualSpentCents);
    });
  });

  it('reconciles allocations cleanly across categories even when contingency is fully depleted', () => {
    const depletedEvent = JSON.parse(JSON.stringify(sampleEventData));
    const contingency = depletedEvent.budget.allocations.find((a: any) => a.category === 'contingency');
    if (contingency) {
      contingency.actualSpentCents = contingency.allocatedCents; // 0 discretionary contingency
    }

    const totalSpentCents = depletedEvent.budget.allocations.reduce((s: number, a: any) => s + a.actualSpentCents, 0);
    const targetBudgetCents = totalSpentCents + 80000; // $800 discretionary pool (differs from old total of 4,500,000)

    const alert = analyzeBudgetChange(depletedEvent, targetBudgetCents);
    expect(alert).not.toBeNull();

    const patched = applyRipplePatch(depletedEvent, alert!);
    const sumAllocated = patched.budget.allocations.reduce((s: number, a: any) => s + a.allocatedCents, 0);
    expect(sumAllocated).toBe(targetBudgetCents);

    patched.budget.allocations.forEach((alloc: any) => {
      expect(alloc.allocatedCents).toBeGreaterThanOrEqual(alloc.actualSpentCents);
    });
  });

  it('flags dependent vendor drafts and invitations for review when guest count shifts without silent overwrites', () => {
    const alert = analyzeGuestCountChange(sampleEventData, 180);
    expect(alert).not.toBeNull();

    const patched = applyRipplePatch(sampleEventData, alert!);
    
    // Catering category must be flagged for review
    const cateringCat = patched.vendors.categories.find((c) => c.category === 'catering');
    expect(cateringCat?.needsReview).toBe(true);
    expect(cateringCat?.reviewReason).toContain('180');
    // Existing user-drafted inquiry text must NOT be silently overwritten
    expect(cateringCat?.inquiryDraft).toBe(sampleEventData.vendors.categories.find((c) => c.category === 'catering')?.inquiryDraft);

    // Invitations must be flagged for review
    expect(patched.creative.invitations[0].needsReview).toBe(true);
    expect(patched.creative.invitations[0].reviewReason).toContain('180');
  });

  it('flags vendor categories for review when total budget shifts', () => {
    const alert = analyzeBudgetChange(sampleEventData, 5000000); // $50,000
    expect(alert).not.toBeNull();

    const patched = applyRipplePatch(sampleEventData, alert!);
    expect(patched.vendors.categories.every((c) => c.needsReview)).toBe(true);
    expect(patched.vendors.categories[0].reviewReason).toContain('$50,000');
  });
});
