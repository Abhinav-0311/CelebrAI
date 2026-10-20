import { CelebrAIEvent, AdaptiveRippleAlert, formatCurrency } from '../types/event';
import { reconcileBudgetCents } from './offlinePlanner';

/**
 * The Adaptive Event Intelligence Engine (Phase 0.2 Specification)
 * Pure functional reactive engine that computes deterministic ripple impacts
 * across Budget (Cents), Catering, Seating, and Logistics, while preserving
 * financial reconciliation invariants and existing expense commitments.
 */

export function analyzeGuestCountChange(
  currentEvent: CelebrAIEvent,
  newGuestCount: number
): AdaptiveRippleAlert | null {
  const oldCount = currentEvent.guestCount;
  if (newGuestCount === oldCount || newGuestCount <= 0) {
    return null;
  }

  const deltaGuests = newGuestCount - oldCount;
  const tableCapacity = currentEvent.guests.targetTableCapacity || 10;
  const oldTables = Math.ceil(oldCount / tableCapacity);
  const newTables = Math.ceil(newGuestCount / tableCapacity);
  const tableDelta = newTables - oldTables;

  // Find catering allocation
  const cateringAlloc = currentEvent.budget.allocations.find((a) => a.category === 'catering');
  const totalCateringCents = cateringAlloc ? cateringAlloc.allocatedCents : Math.round(currentEvent.budget.totalBudgetCents * 0.35);
  const estimatedCostPerGuestCents = Math.round(totalCateringCents / oldCount);
  const cateringDeltaCents = deltaGuests * estimatedCostPerGuestCents;

  // Check budget headroom in contingency
  const contingencyAlloc = currentEvent.budget.allocations.find((a) => a.category === 'contingency');
  const availableContingencyCents = contingencyAlloc ? Math.max(0, contingencyAlloc.allocatedCents - contingencyAlloc.actualSpentCents) : 0;
  
  const isBudgetExceeded = deltaGuests > 0 && cateringDeltaCents > availableContingencyCents;
  const severity: 'low' | 'medium' | 'high' = Math.abs(deltaGuests) > 30 || isBudgetExceeded ? 'high' : Math.abs(deltaGuests) > 10 ? 'medium' : 'low';

  const title = deltaGuests > 0
    ? `Guest Expansion: +${deltaGuests} Guests (${oldCount} → ${newGuestCount})`
    : `Guest Reduction: ${deltaGuests} Guests (${oldCount} → ${newGuestCount})`;

  const impactSummary = deltaGuests > 0
    ? `Increasing guests to ${newGuestCount} requires an estimated +${formatCurrency(cateringDeltaCents, currentEvent.budget.currency)} for catering/bar, plus ${tableDelta} additional table(s). ${
        isBudgetExceeded
          ? `Warning: Exceeds uncommitted contingency reserve by ${formatCurrency(cateringDeltaCents - availableContingencyCents, currentEvent.budget.currency)}.`
          : `Contingency reserve (${formatCurrency(availableContingencyCents, currentEvent.budget.currency)}) can absorb this adjustment.`
      }`
    : `Decreasing guests to ${newGuestCount} frees up an estimated ${formatCurrency(Math.abs(cateringDeltaCents), currentEvent.budget.currency)} in catering resources and removes ${Math.abs(tableDelta)} table(s).`;

  const recommendedActions: AdaptiveRippleAlert['recommendedActions'] = [];

  if (deltaGuests > 0) {
    recommendedActions.push({
      actionType: 'recalculate_catering',
      description: `Reallocate ${formatCurrency(cateringDeltaCents, currentEvent.budget.currency)} to Catering (New allocation: ${formatCurrency(totalCateringCents + cateringDeltaCents, currentEvent.budget.currency)})`,
    });
    if (tableDelta > 0) {
      recommendedActions.push({
        actionType: 'adjust_tables',
        description: `Add ${tableDelta} table(s) to floor layout (New total: ${newTables} tables for capacity of ${newTables * tableCapacity} seats)`,
      });
    }
    if (isBudgetExceeded) {
      recommendedActions.push({
        actionType: 'update_budget',
        description: `Expand total budget by ${formatCurrency(cateringDeltaCents - availableContingencyCents, currentEvent.budget.currency)} or rebalance secondary categories`,
      });
    }
  } else {
    recommendedActions.push({
      actionType: 'recalculate_catering',
      description: `Reclaim ${formatCurrency(Math.abs(cateringDeltaCents), currentEvent.budget.currency)} from catering allocation to contingency reserve`,
    });
    if (tableDelta < 0) {
      recommendedActions.push({
        actionType: 'adjust_tables',
        description: `Consolidate floor layout: remove ${Math.abs(tableDelta)} table(s) (New total: ${newTables} tables)`,
      });
    }
  }

  return {
    id: `ripple-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    triggerType: 'guest_count_change',
    previousValue: oldCount,
    newValue: newGuestCount,
    title,
    severity,
    impactSummary,
    calculatedDiffs: {
      cateringDeltaCents,
      seatingDeltaTables: tableDelta,
      budgetVarianceCents: isBudgetExceeded ? cateringDeltaCents - availableContingencyCents : 0,
    },
    recommendedActions,
    status: 'pending_review',
    createdAt: new Date().toISOString(),
  };
}

export function analyzeBudgetChange(
  currentEvent: CelebrAIEvent,
  newTotalBudgetCents: number
): AdaptiveRippleAlert | null {
  const oldBudgetCents = currentEvent.budget.totalBudgetCents;
  if (newTotalBudgetCents === oldBudgetCents || newTotalBudgetCents <= 0) {
    return null;
  }

  const deltaBudgetCents = newTotalBudgetCents - oldBudgetCents;
  const totalActualSpentCents = currentEvent.budget.allocations.reduce((sum, a) => sum + a.actualSpentCents, 0);
  const isDeficit = newTotalBudgetCents < totalActualSpentCents;

  const severity: 'low' | 'medium' | 'high' = isDeficit ? 'high' : Math.abs(deltaBudgetCents) / oldBudgetCents > 0.2 ? 'medium' : 'low';
  const title = deltaBudgetCents > 0
    ? `Budget Expansion: +${formatCurrency(deltaBudgetCents, currentEvent.budget.currency)}`
    : `Budget Reduction: -${formatCurrency(Math.abs(deltaBudgetCents), currentEvent.budget.currency)}`;

  const impactSummary = isDeficit
    ? `Critical Deficit: Proposed budget (${formatCurrency(newTotalBudgetCents, currentEvent.budget.currency)}) is less than already committed expenditures (${formatCurrency(totalActualSpentCents, currentEvent.budget.currency)}) by ${formatCurrency(totalActualSpentCents - newTotalBudgetCents, currentEvent.budget.currency)}.`
    : `Proportionally scaling category allocations to match the updated ${formatCurrency(newTotalBudgetCents, currentEvent.budget.currency)} budget envelope while protecting all committed expenses.`;

  const recommendedActions: AdaptiveRippleAlert['recommendedActions'] = [
    {
      actionType: 'update_budget',
      description: `Rebalance category allocations to total exactly ${formatCurrency(newTotalBudgetCents, currentEvent.budget.currency)} without violating committed expense minimums`,
    },
  ];

  return {
    id: `ripple-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    triggerType: 'budget_change',
    previousValue: oldBudgetCents,
    newValue: newTotalBudgetCents,
    title,
    severity,
    impactSummary,
    calculatedDiffs: {
      cateringDeltaCents: 0,
      seatingDeltaTables: 0,
      budgetVarianceCents: deltaBudgetCents,
    },
    recommendedActions,
    status: 'pending_review',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Pure function to apply approved ripple modifications to the event state.
 * Preserves strict financial invariants:
 * 1. sum(allocations.allocatedCents) === totalBudgetCents exactly.
 * 2. allocations.allocatedCents >= allocations.actualSpentCents for all categories.
 */
export function applyRipplePatch(
  event: CelebrAIEvent,
  alert: AdaptiveRippleAlert
): CelebrAIEvent {
  const updated = JSON.parse(JSON.stringify(event)) as CelebrAIEvent;

  if (alert.triggerType === 'guest_count_change') {
    const newCount = Number(alert.newValue);
    updated.guestCount = newCount;
    const deltaCents = alert.calculatedDiffs.cateringDeltaCents;

    const cateringIdx = updated.budget.allocations.findIndex((a) => a.category === 'catering');
    const contingencyIdx = updated.budget.allocations.findIndex((a) => a.category === 'contingency');

    if (cateringIdx !== -1 && deltaCents !== 0) {
      if (deltaCents > 0) {
        // Expand catering
        const contingency = contingencyIdx !== -1 ? updated.budget.allocations[contingencyIdx] : null;
        const availableContingency = contingency ? Math.max(0, contingency.allocatedCents - contingency.actualSpentCents) : 0;

        if (availableContingency >= deltaCents && contingency) {
          // Absorb via contingency: zero budget inflation
          updated.budget.allocations[cateringIdx].allocatedCents += deltaCents;
          contingency.allocatedCents -= deltaCents;
        } else {
          // Deficit exceeds contingency: expand total budget by difference to reconcile
          const deficit = deltaCents - availableContingency;
          if (contingency) {
            contingency.allocatedCents -= availableContingency;
          }
          updated.budget.allocations[cateringIdx].allocatedCents += deltaCents;
          updated.budget.totalBudgetCents += deficit;
        }
      } else {
        // Reduced guests: return funds to contingency
        const reclaimed = Math.abs(deltaCents);
        const currentCatering = updated.budget.allocations[cateringIdx].allocatedCents;
        const cateringActual = updated.budget.allocations[cateringIdx].actualSpentCents;
        const safeReclaim = Math.min(reclaimed, currentCatering - cateringActual);

        updated.budget.allocations[cateringIdx].allocatedCents -= safeReclaim;
        if (contingencyIdx !== -1) {
          updated.budget.allocations[contingencyIdx].allocatedCents += safeReclaim;
        }
      }
    }

    // Update guest dietary summary total
    updated.guests.dietarySummary.totalInvited = newCount;
  } else if (alert.triggerType === 'budget_change') {
    const newTotalCents = Number(alert.newValue);
    updated.budget.totalBudgetCents = newTotalCents;

    // Reconcile allocations while protecting actual spent commitments
    const currentAllocations = updated.budget.allocations;
    const percentages = currentAllocations.map((a) => ({
      category: a.category,
      name: a.name,
      pct: a.percentage,
    }));

    const reconciled = reconcileBudgetCents(newTotalCents, percentages);

    // Ensure no category drops below its actual committed expenditure
    updated.budget.allocations = currentAllocations.map((orig) => {
      const match = reconciled.find((r) => r.category === orig.category);
      const targetCents = match ? match.allocatedCents : orig.allocatedCents;
      return {
        ...orig,
        allocatedCents: Math.max(orig.actualSpentCents, targetCents),
      };
    });

    // Final sum adjustment: if floors created a discrepancy, balance in contingency
    const sumCents = updated.budget.allocations.reduce((sum, a) => sum + a.allocatedCents, 0);
    const diff = newTotalCents - sumCents;
    const contingency = updated.budget.allocations.find((a) => a.category === 'contingency');
    if (contingency && diff !== 0) {
      contingency.allocatedCents = Math.max(contingency.actualSpentCents, contingency.allocatedCents + diff);
    }
  }

  // Mark alert as applied
  const alertIndex = updated.pendingRipples.findIndex((r) => r.id === alert.id);
  if (alertIndex !== -1) {
    updated.pendingRipples[alertIndex].status = 'applied';
  }
  updated.appliedRipplesCount += 1;
  updated.updatedAt = new Date().toISOString();

  return updated;
}
