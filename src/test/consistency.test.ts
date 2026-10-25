import { describe, it, expect } from 'vitest';
import { sampleEventData } from '../services/sampleEvent';
import { computeDietarySummary, computeFinancialSummary, recalculateAllocations } from '../services/eventAnalytics';

describe('Data Consistency & Single Source of Truth Invariants', () => {
  describe('Guest & Dietary Summary Consistency', () => {
    it('verifies that sampleEvent dietarySummary matches computeDietarySummary exactly', () => {
      const derivedSummary = computeDietarySummary(
        sampleEventData.guests.list,
        sampleEventData.guestCount
      );

      expect(sampleEventData.guests.dietarySummary).toEqual(derivedSummary);
    });

    it('verifies confirmedAttending matches the exact sum of attending guests plus their plus-ones', () => {
      const attendingGuests = sampleEventData.guests.list.filter((g) => g.rsvpStatus === 'attending');
      const expectedAttendingHeadcount = attendingGuests.reduce(
        (sum, g) => sum + 1 + (g.plusOnes || 0),
        0
      );

      expect(sampleEventData.guests.dietarySummary.confirmedAttending).toBe(12);
      expect(expectedAttendingHeadcount).toBe(12);
      expect(sampleEventData.guests.dietarySummary.confirmedAttending).toBe(expectedAttendingHeadcount);
    });

    it('verifies dietary portion calculations agree with attending guest party records', () => {
      const attending = sampleEventData.guests.list.filter((g) => g.rsvpStatus === 'attending');

      let veg = 0;
      let gf = 0;
      let halal = 0;
      let vegan = 0;
      let nut = 0;
      let other = 0;

      attending.forEach((g) => {
        const count = 1 + (g.plusOnes || 0);
        if (g.dietary.includes('vegetarian')) veg += count;
        if (g.dietary.includes('gluten_free')) gf += count;
        if (g.dietary.includes('halal')) halal += count;
        if (g.dietary.includes('vegan')) vegan += count;
        if (g.dietary.includes('nut_allergy')) nut += count;
        if (g.dietary.some((d) => d === 'other' || d === 'dairy_free' || d === 'kosher')) other += count;
      });

      const summary = sampleEventData.guests.dietarySummary;
      expect(summary.confirmedVegetarian).toBe(veg); // 4
      expect(summary.confirmedGlutenFree).toBe(gf); // 4
      expect(summary.confirmedHalal).toBe(halal); // 3
      expect(summary.confirmedVegan).toBe(vegan); // 1
      expect(summary.confirmedNutAllergy).toBe(nut); // 1
      expect(summary.otherCount).toBe(other); // 1
    });

    it('verifies target guest capacity is preserved alongside registered guests', () => {
      expect(sampleEventData.guestCount).toBe(150);
      expect(sampleEventData.guests.dietarySummary.totalInvited).toBe(150);

      const allRegisteredHeadcount = sampleEventData.guests.list.reduce(
        (sum, g) => sum + 1 + (g.plusOnes || 0),
        0
      );
      expect(allRegisteredHeadcount).toBe(15); // 12 attending + 2 pending + 1 declined
    });
  });

  describe('Financial Ledger & Allocation Accounting Consistency', () => {
    it('verifies that allocations sum to 100% and match totalBudgetCents exactly', () => {
      const totalAllocated = sampleEventData.budget.allocations.reduce(
        (sum, a) => sum + a.allocatedCents,
        0
      );
      const totalPct = sampleEventData.budget.allocations.reduce(
        (sum, a) => sum + a.percentage,
        0
      );

      expect(totalAllocated).toBe(sampleEventData.budget.totalBudgetCents);
      expect(totalAllocated).toBe(4500000); // $45,000.00
      expect(totalPct).toBe(100);
    });

    it('verifies each allocation actualSpentCents equals the sum of its category expenses', () => {
      const recalculated = recalculateAllocations(
        sampleEventData.budget.allocations,
        sampleEventData.budget.expenses
      );

      sampleEventData.budget.allocations.forEach((alloc, idx) => {
        expect(alloc.actualSpentCents).toBe(recalculated[idx].actualSpentCents);
      });
    });

    it('verifies computeFinancialSummary accurately breaks down committed, paid, and outstanding funds', () => {
      const fin = computeFinancialSummary(sampleEventData.budget);

      expect(fin.totalBudgetCents).toBe(4500000); // $45,000.00
      expect(fin.totalAllocatedCents).toBe(4500000); // $45,000.00
      expect(fin.totalCommittedCents).toBe(4265000); // $42,650.00
      expect(fin.totalPaidCents).toBe(3720000); // $37,200.00
      expect(fin.totalOutstandingCents).toBe(545000); // $5,450.00
      expect(fin.remainingHeadroomCents).toBe(235000); // $2,350.00
      expect(fin.isOverBudget).toBe(false);

      // Invariant: Committed = Paid + Outstanding
      expect(fin.totalCommittedCents).toBe(fin.totalPaidCents + fin.totalOutstandingCents);
      // Invariant: Headroom = Budget - Committed
      expect(fin.remainingHeadroomCents).toBe(fin.totalBudgetCents - fin.totalCommittedCents);
    });

    it('identifies decor category overspending accurately as a warning without breaking global budget', () => {
      const decorAlloc = sampleEventData.budget.allocations.find((a) => a.category === 'decor');
      expect(decorAlloc).toBeDefined();
      if (!decorAlloc) return;

      expect(decorAlloc.allocatedCents).toBe(630000); // $6,300
      expect(decorAlloc.actualSpentCents).toBe(645000); // $6,450 committed
      expect(decorAlloc.actualSpentCents).toBeGreaterThan(decorAlloc.allocatedCents); // 102% utilization warning

      // Even with decor overspending by $150, overall budget has $2,350 remaining headroom
      const fin = computeFinancialSummary(sampleEventData.budget);
      expect(fin.remainingHeadroomCents).toBe(235000);
      expect(fin.isOverBudget).toBe(false);
    });
  });
});
