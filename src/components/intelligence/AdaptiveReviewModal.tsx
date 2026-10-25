import React, { useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  X, 
  ShieldAlert, 
  Lock, 
  DollarSign, 
  Utensils, 
  FileText, 
  ShieldCheck,
  Building2,
  ArrowRight
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { formatCurrency } from '../../types/event';
import { computeAdaptivePreview } from '../../services/adaptiveEngine';

export const AdaptiveReviewModal: React.FC = () => {
  const {
    currentEvent,
    isAdaptiveModalOpen,
    activeRippleAlert,
    applyRipple,
    dismissRipple,
  } = useEventStore();

  const [rejectionMessage, setRejectionMessage] = React.useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleDismiss = () => {
    setRejectionMessage(null);
    if (activeRippleAlert) {
      dismissRipple(activeRippleAlert.id);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAdaptiveModalOpen) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (isAdaptiveModalOpen && modalRef.current) {
      modalRef.current.focus();
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdaptiveModalOpen]);

  if (!isAdaptiveModalOpen || !activeRippleAlert || !currentEvent) return null;

  // Single source of truth: shared pure preview calculation guarantees 100% agreement with applyRipplePatch()
  const preview = computeAdaptivePreview(currentEvent, activeRippleAlert);
  const {
    isGuestChange,
    prevGuests,
    newGuests,
    guestDelta,
    prevTables,
    newTables,
    tableDelta,
    proposedCateringCents,
    cateringDeltaCents,
    proposedContingencyCents,
    contingencyAbsorptionCents,
    proposedTotalBudgetCents,
    budgetDeficitCents,
    isFeasible,
    totalCommittedCents,
  } = preview;

  const isInfeasibleBudget = !isFeasible;

  const handleApply = () => {
    if (isInfeasibleBudget) return;
    const result = applyRipple(activeRippleAlert);
    if (result && !result.success) {
      setRejectionMessage(
        result.reason || 'This proposed modification cannot be applied without violating committed contracts.'
      );
    } else {
      setRejectionMessage(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/70 backdrop-blur-md animate-fadeIn overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="adaptive-modal-title"
      ref={modalRef}
      tabIndex={-1}
    >
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto text-stone-900 dark:text-stone-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-start justify-between bg-stone-50 dark:bg-stone-950/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold">
                Adaptive Intelligence Alert
              </span>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                  activeRippleAlert.severity === 'high'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {activeRippleAlert.severity} severity
              </span>
            </div>
            <h2 id="adaptive-modal-title" className="text-lg sm:text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
              Review plan adjustments
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              {activeRippleAlert.impactSummary}
            </p>
          </div>
          
          <button
            type="button"
            onClick={handleDismiss}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-stone-800 dark:text-stone-200">
          
          {/* Rejection Alert Banner */}
          {rejectionMessage && (
            <div
              className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 flex items-start gap-2.5 text-rose-800 dark:text-rose-200 text-xs animate-shake"
              role="alert"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div>
                <p className="font-bold">Modification rejected</p>
                <p className="mt-0.5">{rejectionMessage}</p>
              </div>
            </div>
          )}

          {/* Infeasible Budget Warning */}
          {isInfeasibleBudget && !rejectionMessage && (
            <div
              className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 text-xs space-y-2"
              role="status"
            >
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Action locked: Budget cannot be lower than committed expenses</span>
              </div>
              <p>
                The proposed budget of <strong className="font-mono">{formatCurrency(Number(activeRippleAlert.newValue), currentEvent.budget.currency)}</strong> is lower than already committed contracts (<strong className="font-mono">{formatCurrency(totalCommittedCents, currentEvent.budget.currency)}</strong>) by <strong className="font-mono">{formatCurrency(totalCommittedCents - Number(activeRippleAlert.newValue), currentEvent.budget.currency)}</strong>.
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                To proceed: Cancel or reduce items in the Budget ledger first, or set budget to at least {formatCurrency(totalCommittedCents, currentEvent.budget.currency)}.
              </p>
            </div>
          )}

          {/* 1. DOMINANT COMPARISON: Primary Shift (Guest or Budget) */}
          <div className="bg-stone-50 dark:bg-stone-950/60 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block mb-2 font-bold">
              {isGuestChange ? 'Headcount shift' : 'Budget realignment'}
            </span>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs text-stone-500 font-medium">Current plan</span>
                <p className="text-lg sm:text-2xl font-bold font-mono text-stone-700 dark:text-stone-300">
                  {isGuestChange ? `${prevGuests} guests` : formatCurrency(Number(activeRippleAlert.previousValue), currentEvent.budget.currency)}
                </p>
                <span className="text-[11px] text-stone-400 font-mono">
                  {isGuestChange ? `${prevTables} tables` : 'Baseline budget'}
                </span>
              </div>

              <div className="flex flex-col items-center shrink-0">
                <ArrowRight className="w-5 h-5 text-stone-400" />
                {guestDelta !== 0 && (
                  <span className={`text-[11px] font-mono font-bold ${guestDelta > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {guestDelta > 0 ? `+${guestDelta}` : guestDelta}
                  </span>
                )}
              </div>

              <div className="space-y-0.5 text-right">
                <span className="text-xs text-stone-500 font-medium">Proposed</span>
                <p className="text-lg sm:text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
                  {isGuestChange ? `${newGuests} guests` : formatCurrency(Number(activeRippleAlert.newValue), currentEvent.budget.currency)}
                </p>
                <span className="text-[11px] text-stone-400 font-mono">
                  {isGuestChange ? `${newTables} tables (${tableDelta >= 0 ? `+${tableDelta}` : tableDelta})` : 'Target ceiling'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. CONSEQUENCES BREAKDOWN (Budget & Seating) */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold block">
              Consequences & adjustments
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-sans">
              
              {/* Catering */}
              <div className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/40 space-y-1">
                <span className="text-stone-500 flex items-center gap-1.5 text-[11px]">
                  <Utensils className="w-3.5 h-3.5 text-stone-400" /> Catering
                </span>
                <p className="font-mono font-bold text-sm text-stone-900 dark:text-stone-100">
                  {formatCurrency(proposedCateringCents, currentEvent.budget.currency)}
                </p>
                <span className={`text-[10.5px] font-mono ${cateringDeltaCents > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-500'}`}>
                  {cateringDeltaCents > 0 ? `+${formatCurrency(cateringDeltaCents, currentEvent.budget.currency)}` : '$0'}
                </span>
              </div>

              {/* Contingency Reserve */}
              <div className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/40 space-y-1">
                <span className="text-stone-500 flex items-center gap-1.5 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-stone-400" /> Reserve absorption
                </span>
                <p className="font-mono font-bold text-sm text-stone-900 dark:text-stone-100">
                  {formatCurrency(proposedContingencyCents, currentEvent.budget.currency)}
                </p>
                <span className="text-[10.5px] font-mono text-stone-500">
                  {contingencyAbsorptionCents > 0 ? `-${formatCurrency(contingencyAbsorptionCents, currentEvent.budget.currency)} absorbed` : 'Untouched'}
                </span>
              </div>

              {/* Total Event Capital */}
              <div className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/40 space-y-1">
                <span className="text-stone-500 flex items-center gap-1.5 text-[11px]">
                  <DollarSign className="w-3.5 h-3.5 text-stone-400" /> Total budget
                </span>
                <p className="font-mono font-bold text-sm text-stone-900 dark:text-stone-100">
                  {formatCurrency(proposedTotalBudgetCents, currentEvent.budget.currency)}
                </p>
                <span className="text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  {budgetDeficitCents === 0 ? '0% budget drift' : `+${formatCurrency(budgetDeficitCents, currentEvent.budget.currency)}`}
                </span>
              </div>

            </div>
          </div>

          {/* 3. NEEDS REVIEW: Affected partners & drafts */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold block">
              Needs review
            </span>

            <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/40 space-y-2 text-xs">
              <div className="flex items-start gap-2.5">
                <Utensils className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-stone-900 dark:text-stone-100">Catering director</span>
                  <p className="text-stone-500 dark:text-stone-400 text-[11px]">
                    Requires headcount update to {newGuests} guests and updated per-cover confirmation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 border-t border-stone-200 dark:border-stone-800 pt-2">
                <Building2 className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-stone-900 dark:text-stone-100">Venue coordinator</span>
                  <p className="text-stone-500 dark:text-stone-400 text-[11px]">
                    Floor plan requires {newTables} total tables ({tableDelta >= 0 ? `+${tableDelta}` : tableDelta} tables).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 border-t border-stone-200 dark:border-stone-800 pt-2">
                <FileText className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-stone-900 dark:text-stone-100">Invitation copy</span>
                  <p className="text-stone-500 dark:text-stone-400 text-[11px]">
                    RSVP counts and response threshold flagged for review.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. AUTOMATED UPDATES LIST */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold block">
              Automated updates upon applying
            </span>

            <div className="space-y-1 text-xs text-stone-600 dark:text-stone-300">
              {activeRippleAlert.recommendedActions.map((action, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>{action.description}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer: Sticky & Reachable on Mobile */}
        <div className="p-3.5 sm:p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3.5 py-2 text-xs font-medium rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition"
          >
            Keep current plan
          </button>
          
          <button
            type="button"
            onClick={handleApply}
            disabled={isInfeasibleBudget}
            title={isInfeasibleBudget ? 'Cannot apply budget reduction below committed expenditure' : 'Apply recommended adjustments'}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              isInfeasibleBudget
                ? 'bg-stone-300 text-stone-500 dark:bg-stone-800 dark:text-stone-600 cursor-not-allowed'
                : 'bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200 shadow-sm'
            }`}
          >
            {isInfeasibleBudget ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Infeasible (Locked)</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Apply Recommendations</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
