import { CelebrAIEvent, AdaptiveRippleAlert, formatCurrency } from '../types/event';

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
    recommendedActions.push({
      actionType: 'update_timeline',
      description: `Flag dependent vendor RFP inquiries and digital invitations for review (${oldCount} → ${newGuestCount} guests)`,
    });
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
    recommendedActions.push({
      actionType: 'update_timeline',
      description: `Flag dependent vendor RFP inquiries and digital invitations for review (${oldCount} → ${newGuestCount} guests)`,
    });
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
  const title = isDeficit
    ? `Infeasible Budget: Below Committed Spending (${formatCurrency(newTotalBudgetCents, currentEvent.budget.currency)})`
    : deltaBudgetCents > 0
    ? `Budget Expansion: +${formatCurrency(deltaBudgetCents, currentEvent.budget.currency)}`
    : `Budget Reduction: -${formatCurrency(Math.abs(deltaBudgetCents), currentEvent.budget.currency)}`;

  const impactSummary = isDeficit
    ? `Critical Deficit: Proposed budget (${formatCurrency(newTotalBudgetCents, currentEvent.budget.currency)}) is less than already committed expenditures (${formatCurrency(totalActualSpentCents, currentEvent.budget.currency)}) by ${formatCurrency(totalActualSpentCents - newTotalBudgetCents, currentEvent.budget.currency)}. This budget change cannot be applied without reducing or canceling committed expenses.`
    : `Proportionally rebalancing discretionary category allocations to match the updated ${formatCurrency(newTotalBudgetCents, currentEvent.budget.currency)} budget envelope while protecting all committed expense floors to the exact cent.`;

  const recommendedActions: AdaptiveRippleAlert['recommendedActions'] = isDeficit
    ? [
        {
          actionType: 'update_budget',
          description: `Increase proposed budget to at least ${formatCurrency(totalActualSpentCents, currentEvent.budget.currency)} or reduce committed expenses before applying`,
        },
      ]
    : [
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
        } else {
          updated.budget.totalBudgetCents -= safeReclaim;
        }
      }

      // Re-calculate percentages across all allocations
      const currentTotal = updated.budget.totalBudgetCents;
      updated.budget.allocations.forEach((a) => {
        a.percentage = Math.round((a.allocatedCents / currentTotal) * 1000) / 10;
      });
    }

    // Update guest dietary summary total
    updated.guests.dietarySummary.totalInvited = newCount;

    // Flag dependent vendor inquiries for review without silently overwriting user text
    if (updated.vendors && Array.isArray(updated.vendors.categories)) {
      updated.vendors.categories.forEach((cat) => {
        if (cat.category === 'catering' || cat.category === 'venue') {
          cat.needsReview = true;
          cat.reviewReason = `Guest target updated to ${newCount} (was ${alert.previousValue}). Review headcount and dietary specifics.`;
        }
      });
    }

    // Flag invitations for review
    if (updated.creative && Array.isArray(updated.creative.invitations)) {
      updated.creative.invitations.forEach((inv) => {
        inv.needsReview = true;
        inv.reviewReason = `Guest count shifted to ${newCount} (was ${alert.previousValue}). Review invitation copy.`;
      });
    }
  } else if (alert.triggerType === 'budget_change') {
    const newTotalCents = Number(alert.newValue);
    const totalActualSpentCents = updated.budget.allocations.reduce((sum, a) => sum + a.actualSpentCents, 0);

    // Invariant Enforcement: Reject infeasible budget reduction
    // If proposed budget cannot cover already committed expenditures, do not mutate state.
    if (newTotalCents < totalActualSpentCents || newTotalCents <= 0) {
      console.warn(
        `[CelebrAI Adaptive Engine] Rejected budget change: proposed budget (${newTotalCents} cents) is less than committed expenses (${totalActualSpentCents} cents).`
      );
      return event;
    }

    updated.budget.totalBudgetCents = newTotalCents;
    const currentAllocations = updated.budget.allocations;

    // Discretionary pool available above committed expense floors
    const discretionaryPoolCents = newTotalCents - totalActualSpentCents;

    // Calculate distribution weights based on target category percentages
    const totalWeight = currentAllocations.reduce(
      (sum, a) => sum + (a.percentage > 0 ? a.percentage : 1),
      0
    );

    // Largest-remainder distribution for exact single-cent reconciliation
    let distributedDiscretionaryCents = 0;
    const allocationsWithDiscretionary = currentAllocations.map((a) => {
      const weight = a.percentage > 0 ? a.percentage : 1;
      const rawShare = discretionaryPoolCents > 0 ? (weight / totalWeight) * discretionaryPoolCents : 0;
      const integerPart = Math.floor(rawShare);
      const remainder = rawShare - integerPart;
      distributedDiscretionaryCents += integerPart;
      return {
        id: a.id,
        category: a.category,
        actualSpentCents: a.actualSpentCents,
        discretionaryCents: integerPart,
        remainder,
      };
    });

    // Distribute remainder cents to items with highest remainder
    const leftoverCents = discretionaryPoolCents - distributedDiscretionaryCents;
    allocationsWithDiscretionary.sort((a, b) => b.remainder - a.remainder);
    for (let i = 0; i < leftoverCents && i < allocationsWithDiscretionary.length; i++) {
      allocationsWithDiscretionary[i].discretionaryCents += 1;
    }

    // Assign final reconciled allocations: allocatedCents = actualSpentCents + discretionaryCents
    updated.budget.allocations = currentAllocations.map((orig) => {
      const item = allocationsWithDiscretionary.find((a) => a.id === orig.id);
      const discretionary = item ? item.discretionaryCents : 0;
      const allocatedCents = orig.actualSpentCents + discretionary;
      const percentage = Math.round((allocatedCents / newTotalCents) * 1000) / 10;
      return {
        ...orig,
        allocatedCents,
        percentage,
      };
    });

    // Flag vendor categories for review
    if (updated.vendors && Array.isArray(updated.vendors.categories)) {
      updated.vendors.categories.forEach((cat) => {
        cat.needsReview = true;
        cat.reviewReason = `Budget adjusted to ${formatCurrency(newTotalCents, updated.budget.currency)}. Category allocations have rebalanced.`;
      });
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

/**
 * Pure Single-Source-of-Truth Preview Calculator (Phase 2.7)
 * Guarantees 100% mathematical fidelity between the Adaptive Review Modal preview
 * and the actual state mutated by applyRipplePatch().
 */
export interface AdaptivePreviewResult {
  isGuestChange: boolean;
  isBudgetChange: boolean;
  prevGuests: number;
  newGuests: number;
  guestDelta: number;
  prevTables: number;
  newTables: number;
  tableDelta: number;
  prevCateringCents: number;
  proposedCateringCents: number;
  cateringDeltaCents: number;
  prevContingencyCents: number;
  proposedContingencyCents: number;
  contingencyAbsorptionCents: number;
  availableContingencyCents: number;
  prevTotalBudgetCents: number;
  proposedTotalBudgetCents: number;
  budgetDeficitCents: number;
  isFeasible: boolean;
  infeasibilityDeficitCents: number;
  totalCommittedCents: number;
  patchedEvent: CelebrAIEvent;
}

export function computeAdaptivePreview(
  event: CelebrAIEvent,
  alert: AdaptiveRippleAlert
): AdaptivePreviewResult {
  const isGuestChange = alert.triggerType === 'guest_count_change';
  const isBudgetChange = alert.triggerType === 'budget_change';

  // Committed spending floor
  const committedFromExpenses = event.budget.expenses 
    ? event.budget.expenses.reduce((s, e) => s + e.actualCents, 0) 
    : 0;
  const committedFromAllocations = event.budget.allocations.reduce((s, a) => s + a.actualSpentCents, 0);
  const totalCommittedCents = Math.max(committedFromExpenses, committedFromAllocations);

  const isInfeasibleBudget = isBudgetChange && Number(alert.newValue) < totalCommittedCents;
  const isFeasible = !isInfeasibleBudget;
  const infeasibilityDeficitCents = isInfeasibleBudget ? totalCommittedCents - Number(alert.newValue) : 0;

  // Compute patched event using the true invariant-enforced patcher
  const patchedEvent = applyRipplePatch(event, alert);

  const prevGuests = event.guestCount;
  const newGuests = patchedEvent.guestCount;
  const guestDelta = newGuests - prevGuests;

  const tableCapacity = event.guests?.targetTableCapacity || 10;
  const prevTables = Math.ceil(prevGuests / tableCapacity);
  const newTables = Math.ceil(newGuests / tableCapacity);
  const tableDelta = isGuestChange ? alert.calculatedDiffs.seatingDeltaTables : 0;

  const cateringAlloc = event.budget.allocations.find((a) => a.category === 'catering');
  const patchedCateringAlloc = patchedEvent.budget.allocations.find((a) => a.category === 'catering');
  const prevCateringCents = cateringAlloc?.allocatedCents || 0;
  const proposedCateringCents = patchedCateringAlloc?.allocatedCents || prevCateringCents;
  const cateringDeltaCents = proposedCateringCents - prevCateringCents;

  const contingencyAlloc = event.budget.allocations.find((a) => a.category === 'contingency');
  const patchedContingencyAlloc = patchedEvent.budget.allocations.find((a) => a.category === 'contingency');
  const prevContingencyCents = contingencyAlloc?.allocatedCents || 0;
  const proposedContingencyCents = patchedContingencyAlloc?.allocatedCents || prevContingencyCents;
  const contingencyActualSpent = contingencyAlloc?.actualSpentCents || 0;
  const availableContingencyCents = Math.max(0, prevContingencyCents - contingencyActualSpent);
  const contingencyAbsorptionCents = Math.max(0, prevContingencyCents - proposedContingencyCents);

  const prevTotalBudgetCents = event.budget.totalBudgetCents;
  const proposedTotalBudgetCents = isBudgetChange 
    ? Number(alert.newValue) 
    : patchedEvent.budget.totalBudgetCents;
  const budgetDeficitCents = Math.max(0, proposedTotalBudgetCents - prevTotalBudgetCents);

  return {
    isGuestChange,
    isBudgetChange,
    prevGuests,
    newGuests,
    guestDelta,
    prevTables,
    newTables,
    tableDelta,
    prevCateringCents,
    proposedCateringCents,
    cateringDeltaCents,
    prevContingencyCents,
    proposedContingencyCents,
    contingencyAbsorptionCents,
    availableContingencyCents,
    prevTotalBudgetCents,
    proposedTotalBudgetCents,
    budgetDeficitCents,
    isFeasible,
    infeasibilityDeficitCents,
    totalCommittedCents,
    patchedEvent,
  };
}
