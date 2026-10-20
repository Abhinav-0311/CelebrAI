import { CelebrAIEvent, AdaptiveRippleAlert } from '../types/event';

/**
 * The Adaptive Event Intelligence Engine
 * Cross-module reactive engine that detects adjustments, computes deterministic
 * ripple impacts across Budget, Catering, Seating, and Logistics, and creates
 * actionable Diff Review recommendations.
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
  const totalCatering = cateringAlloc ? cateringAlloc.allocatedAmount : currentEvent.budget.totalBudget * 0.35;
  const estimatedCostPerGuest = totalCatering / oldCount;
  const cateringDelta = Math.round(deltaGuests * estimatedCostPerGuest);

  // Check budget headroom
  const contingencyAlloc = currentEvent.budget.allocations.find((a) => a.category === 'contingency');
  const availableContingency = contingencyAlloc ? contingencyAlloc.allocatedAmount - contingencyAlloc.actualSpent : 0;
  
  const isBudgetExceeded = deltaGuests > 0 && cateringDelta > availableContingency;
  const severity: 'low' | 'medium' | 'high' = Math.abs(deltaGuests) > 30 || isBudgetExceeded ? 'high' : Math.abs(deltaGuests) > 10 ? 'medium' : 'low';

  const title = deltaGuests > 0
    ? `Guest Count Expansion: +${deltaGuests} Guests (${oldCount} → ${newGuestCount})`
    : `Guest Count Reduction: ${deltaGuests} Guests (${oldCount} → ${newGuestCount})`;

  const impactSummary = deltaGuests > 0
    ? `Increasing guests to ${newGuestCount} requires an estimated +$${cateringDelta.toLocaleString()} for catering and bar, plus ${tableDelta} additional table(s). ${
        isBudgetExceeded ? `Warning: Exceeds remaining contingency reserve by $${(cateringDelta - availableContingency).toLocaleString()}.` : 'Sufficient contingency reserves are available.'
      }`
    : `Decreasing guests to ${newGuestCount} frees up an estimated $${Math.abs(cateringDelta).toLocaleString()} in catering resources and removes ${Math.abs(tableDelta)} table(s).`;

  const recommendedActions: AdaptiveRippleAlert['recommendedActions'] = [];

  if (deltaGuests > 0) {
    recommendedActions.push({
      actionType: 'recalculate_catering',
      description: `Increase catering allocation from $${totalCatering.toLocaleString()} to $${(totalCatering + cateringDelta).toLocaleString()} (+$${cateringDelta.toLocaleString()})`,
    });
    if (tableDelta > 0) {
      recommendedActions.push({
        actionType: 'adjust_tables',
        description: `Add ${tableDelta} table(s) to floor layout (new total: ${newTables} tables for capacity of ${newTables * tableCapacity} seats)`,
      });
    }
    if (isBudgetExceeded) {
      recommendedActions.push({
        actionType: 'update_budget',
        description: `Expand total event budget by $${(cateringDelta - availableContingency).toLocaleString()} or reallocate from decor/entertainment`,
      });
    }
  } else {
    recommendedActions.push({
      actionType: 'recalculate_catering',
      description: `Reclaim $${Math.abs(cateringDelta).toLocaleString()} from catering allocation to surplus or contingency`,
    });
    if (tableDelta < 0) {
      recommendedActions.push({
        actionType: 'adjust_tables',
        description: `Consolidate floor layout: remove ${Math.abs(tableDelta)} table(s) (new total: ${newTables} tables)`,
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
      cateringDelta,
      seatingDelta: tableDelta,
      budgetVariance: isBudgetExceeded ? cateringDelta - availableContingency : 0,
    },
    recommendedActions,
    status: 'pending_review',
    createdAt: new Date().toISOString(),
  };
}

export function analyzeBudgetChange(
  currentEvent: CelebrAIEvent,
  newTotalBudget: number
): AdaptiveRippleAlert | null {
  const oldBudget = currentEvent.budget.totalBudget;
  if (newTotalBudget === oldBudget || newTotalBudget <= 0) {
    return null;
  }

  const deltaBudget = newTotalBudget - oldBudget;
  const totalActualSpent = currentEvent.budget.allocations.reduce((sum, a) => sum + a.actualSpent, 0);
  const isDeficit = newTotalBudget < totalActualSpent;

  const severity: 'low' | 'medium' | 'high' = isDeficit ? 'high' : Math.abs(deltaBudget) / oldBudget > 0.2 ? 'medium' : 'low';
  const title = deltaBudget > 0
    ? `Budget Expansion: +$${deltaBudget.toLocaleString()} ($${oldBudget.toLocaleString()} → $${newTotalBudget.toLocaleString()})`
    : `Budget Reduction: -$${Math.abs(deltaBudget).toLocaleString()} ($${oldBudget.toLocaleString()} → $${newTotalBudget.toLocaleString()})`;

  const impactSummary = isDeficit
    ? `Critical: The proposed budget ($${newTotalBudget.toLocaleString()}) is less than existing committed expenditures ($${totalActualSpent.toLocaleString()}) by $${(totalActualSpent - newTotalBudget).toLocaleString()}.`
    : `Proportionally rebalancing allocations across all categories to reflect the updated $${newTotalBudget.toLocaleString()} budget envelope.`;

  const recommendedActions: AdaptiveRippleAlert['recommendedActions'] = [
    {
      actionType: 'update_budget',
      description: `Proportionally scale category allocations to match $${newTotalBudget.toLocaleString()}`,
    },
  ];

  return {
    id: `ripple-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    triggerType: 'budget_change',
    previousValue: oldBudget,
    newValue: newTotalBudget,
    title,
    severity,
    impactSummary,
    calculatedDiffs: {
      cateringDelta: 0,
      seatingDelta: 0,
      budgetVariance: deltaBudget,
    },
    recommendedActions,
    status: 'pending_review',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Pure function to apply approved ripple modifications to the event state.
 */
export function applyRipplePatch(
  event: CelebrAIEvent,
  alert: AdaptiveRippleAlert
): CelebrAIEvent {
  const updated = JSON.parse(JSON.stringify(event)) as CelebrAIEvent;

  if (alert.triggerType === 'guest_count_change') {
    const newCount = Number(alert.newValue);
    updated.guestCount = newCount;
    
    // Update catering allocation if requested
    const cateringIdx = updated.budget.allocations.findIndex((a) => a.category === 'catering');
    if (cateringIdx !== -1) {
      const currentAlloc = updated.budget.allocations[cateringIdx].allocatedAmount;
      const newAlloc = Math.max(0, currentAlloc + alert.calculatedDiffs.cateringDelta);
      updated.budget.allocations[cateringIdx].allocatedAmount = newAlloc;
      // Adjust total budget accordingly if expanding
      if (alert.calculatedDiffs.budgetVariance > 0) {
        updated.budget.totalBudget += alert.calculatedDiffs.budgetVariance;
      }
    }

    // Update guest dietary summary total
    updated.guests.dietarySummary.totalGuests = newCount;
  } else if (alert.triggerType === 'budget_change') {
    const newTotal = Number(alert.newValue);
    updated.budget.totalBudget = newTotal;
    // Scale allocations proportionally
    const totalPercentage = updated.budget.allocations.reduce((sum, a) => sum + a.percentage, 0) || 100;
    updated.budget.allocations = updated.budget.allocations.map((a) => ({
      ...a,
      allocatedAmount: Math.round((newTotal * a.percentage) / totalPercentage),
    }));
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
