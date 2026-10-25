import { Guest, DietarySummary, BudgetPlan, BudgetAllocation, ExpenseItem } from '../types/event';

/**
 * Computes dietary summaries from individual guest records, distinguishing
 * confirmed attendees, their plus-ones, and pending RSVP estimates,
 * while maintaining consistency with overall celebration guest capacity.
 */
export function computeDietarySummary(list: Guest[], totalEventGuestCount: number = 0): DietarySummary {
  let listHeadcount = 0;
  let confirmedAttending = 0;
  let confirmedVegan = 0;
  let confirmedVegetarian = 0;
  let confirmedGlutenFree = 0;
  let confirmedHalal = 0;
  let confirmedNutAllergy = 0;
  let potentialDietaryCount = 0;
  let otherCount = 0;

  list.forEach((g) => {
    const headCount = 1 + (g.plusOnes || 0);
    listHeadcount += headCount;

    if (g.rsvpStatus === 'attending') {
      confirmedAttending += headCount;
      if (g.dietary.includes('vegan')) confirmedVegan += headCount;
      if (g.dietary.includes('vegetarian')) confirmedVegetarian += headCount;
      if (g.dietary.includes('gluten_free')) confirmedGlutenFree += headCount;
      if (g.dietary.includes('halal')) confirmedHalal += headCount;
      if (g.dietary.includes('nut_allergy')) confirmedNutAllergy += headCount;
      if (g.dietary.some((d) => d === 'other' || d === 'dairy_free' || d === 'kosher')) {
        otherCount += headCount;
      }
    } else if (g.rsvpStatus === 'pending') {
      if (g.dietary.some((d) => d !== 'none')) {
        potentialDietaryCount += headCount;
      }
    }
  });

  const totalInvited = Math.max(totalEventGuestCount, listHeadcount);

  return {
    totalInvited,
    confirmedAttending,
    confirmedVegan,
    confirmedVegetarian,
    confirmedGlutenFree,
    confirmedHalal,
    confirmedNutAllergy,
    potentialDietaryCount,
    otherCount,
  };
}

/**
 * Computes single-source-of-truth financial metrics distinguishing:
 * - Budget Ceiling
 * - Total Allocated
 * - Committed Obligations (sum of all expenses)
 * - Paid Expenditures (settled invoices)
 * - Outstanding Liabilities (pending invoices)
 * - Available Headroom (Budget - Committed)
 */
export function computeFinancialSummary(budget: BudgetPlan) {
  const totalBudgetCents = budget.totalBudgetCents;
  const totalAllocatedCents = budget.allocations.reduce((sum, a) => sum + a.allocatedCents, 0);
  
  // Committed = sum of all logged expenses
  const totalCommittedCents = budget.expenses.reduce((sum, e) => sum + e.actualCents, 0);
  
  // Paid = sum of settled expenses
  const totalPaidCents = budget.expenses
    .filter((e) => e.isPaid)
    .reduce((sum, e) => sum + e.actualCents, 0);
    
  // Outstanding = pending payment
  const totalOutstandingCents = budget.expenses
    .filter((e) => !e.isPaid)
    .reduce((sum, e) => sum + e.actualCents, 0);

  const remainingHeadroomCents = totalBudgetCents - totalCommittedCents;
  const isOverBudget = totalCommittedCents > totalBudgetCents;

  return {
    totalBudgetCents,
    totalAllocatedCents,
    totalCommittedCents,
    totalPaidCents,
    totalOutstandingCents,
    remainingHeadroomCents,
    isOverBudget,
  };
}

/**
 * Recalculates category allocation actualSpentCents directly from the expense ledger,
 * ensuring zero desynchronization between line items and category cards.
 */
export function recalculateAllocations(
  allocations: BudgetAllocation[],
  expenses: ExpenseItem[]
): BudgetAllocation[] {
  return allocations.map((alloc) => {
    const categoryExpenses = expenses.filter(
      (e) => e.allocationId === alloc.id || e.category === alloc.category
    );
    const categoryCommittedCents = categoryExpenses.reduce((sum, e) => sum + e.actualCents, 0);
    return {
      ...alloc,
      actualSpentCents: categoryCommittedCents,
    };
  });
}
