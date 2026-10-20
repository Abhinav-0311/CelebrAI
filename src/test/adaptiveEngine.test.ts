import { describe, it, expect } from 'vitest';
import { analyzeGuestCountChange, analyzeBudgetChange, applyRipplePatch } from '../services/adaptiveEngine';
import { sampleEventData } from '../services/sampleEvent';

describe('Adaptive Event Intelligence Engine', () => {
  it('detects guest count expansion and calculates catering & table deltas', () => {
    // Current sampleEventData has 150 guests, table capacity 10 -> 15 tables
    const alert = analyzeGuestCountChange(sampleEventData, 180);

    expect(alert).not.toBeNull();
    expect(alert?.triggerType).toBe('guest_count_change');
    expect(alert?.previousValue).toBe(150);
    expect(alert?.newValue).toBe(180);
    expect(alert?.calculatedDiffs.seatingDelta).toBe(3); // 18 - 15 = +3 tables
    expect(alert?.calculatedDiffs.cateringDelta).toBeGreaterThan(0);
    expect(alert?.recommendedActions.length).toBeGreaterThan(0);
  });

  it('detects guest count reduction and suggests freeing allocation', () => {
    const alert = analyzeGuestCountChange(sampleEventData, 120);

    expect(alert).not.toBeNull();
    expect(alert?.triggerType).toBe('guest_count_change');
    expect(alert?.calculatedDiffs.seatingDelta).toBe(-3); // 12 - 15 = -3 tables
    expect(alert?.calculatedDiffs.cateringDelta).toBeLessThan(0);
  });

  it('returns null if guest count is identical', () => {
    const alert = analyzeGuestCountChange(sampleEventData, 150);
    expect(alert).toBeNull();
  });

  it('detects critical deficit when budget is reduced below committed actual spending', () => {
    // Total actual spent in sampleEventData is around $40,000+
    const totalSpent = sampleEventData.budget.allocations.reduce((s, a) => s + a.actualSpent, 0);
    const lowBudget = totalSpent - 5000;

    const alert = analyzeBudgetChange(sampleEventData, lowBudget);
    expect(alert).not.toBeNull();
    expect(alert?.severity).toBe('high');
    expect(alert?.impactSummary).toContain('Critical');
  });

  it('correctly applies ripple patch to event state', () => {
    const alert = analyzeGuestCountChange(sampleEventData, 170);
    expect(alert).not.toBeNull();

    if (alert) {
      const updated = applyRipplePatch(sampleEventData, alert);
      expect(updated.guestCount).toBe(170);
      expect(updated.appliedRipplesCount).toBe(sampleEventData.appliedRipplesCount + 1);
      
      const newCatering = updated.budget.allocations.find((a) => a.category === 'catering')?.allocatedAmount;
      const oldCatering = sampleEventData.budget.allocations.find((a) => a.category === 'catering')?.allocatedAmount;
      expect(newCatering).toBeGreaterThan(oldCatering!);
    }
  });
});
