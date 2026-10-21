import React, { useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  X, 
  ShieldAlert, 
  Lock, 
  Users, 
  DollarSign, 
  Utensils, 
  FileText, 
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { formatCurrency } from '../../types/event';
import { computeFinancialSummary } from '../../services/eventAnalytics';

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

  const isGuestChange = activeRippleAlert.triggerType === 'guest_count_change';
  const isBudgetChange = activeRippleAlert.triggerType === 'budget_change';

  // Compute single-source-of-truth committed spending
  const finSummary = computeFinancialSummary(currentEvent.budget);
  const totalCommittedCents = Math.max(
    finSummary.totalCommittedCents,
    currentEvent.budget.allocations.reduce((s, a) => s + a.actualSpentCents, 0)
  );

  const isInfeasibleBudget = isBudgetChange && Number(activeRippleAlert.newValue) < totalCommittedCents;

  // Guest calculations
  const prevGuests = isGuestChange ? Number(activeRippleAlert.previousValue) : currentEvent.guestCount;
  const newGuests = isGuestChange ? Number(activeRippleAlert.newValue) : currentEvent.guestCount;
  const guestDelta = newGuests - prevGuests;
  const tableCapacity = currentEvent.guests?.targetTableCapacity || 10;
  const prevTables = Math.ceil(prevGuests / tableCapacity);
  const newTables = Math.ceil(newGuests / tableCapacity);
  const tableDelta = isGuestChange ? activeRippleAlert.calculatedDiffs.seatingDeltaTables : 0;

  // Financial & allocation calculations
  const cateringAlloc = currentEvent.budget.allocations.find((a) => a.category === 'catering');
  const contingencyAlloc = currentEvent.budget.allocations.find((a) => a.category === 'contingency');
  const prevCateringCents = cateringAlloc?.allocatedCents || 0;
  const cateringDeltaCents = isGuestChange ? activeRippleAlert.calculatedDiffs.cateringDeltaCents : 0;
  const proposedCateringCents = Math.max(0, prevCateringCents + cateringDeltaCents);

  const prevContingencyCents = contingencyAlloc?.allocatedCents || 0;
  const contingencyAbsorptionCents = Math.min(prevContingencyCents, Math.max(0, cateringDeltaCents));
  const proposedContingencyCents = Math.max(0, prevContingencyCents - contingencyAbsorptionCents);
  const budgetDeficitCents = Math.max(0, cateringDeltaCents - prevContingencyCents);

  const prevTotalBudgetCents = currentEvent.budget.totalBudgetCents;
  const proposedTotalBudgetCents = isBudgetChange 
    ? Number(activeRippleAlert.newValue) 
    : prevTotalBudgetCents + budgetDeficitCents;

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
      <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto text-stone-900 dark:text-stone-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-stone-800 flex items-start justify-between bg-stone-100/60 dark:bg-stone-950/40">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                Atelier Adaptive Intelligence Alert
              </span>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                  activeRippleAlert.severity === 'high'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-900'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-900'
                }`}
              >
                {activeRippleAlert.severity} severity
              </span>
              <span className="text-[10px] font-mono text-stone-400">
                Zero-Creep Reconciliation
              </span>
            </div>
            <h2 id="adaptive-modal-title" className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
              {activeRippleAlert.title}
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-sans max-w-xl">
              {activeRippleAlert.impactSummary}
            </p>
          </div>
          
          <button
            type="button"
            onClick={handleDismiss}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-2 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-stone-800 dark:text-stone-200">
          
          {/* Rejection Alert Banner */}
          {rejectionMessage && (
            <div
              className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs animate-shake"
              role="alert"
            >
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm">Modification Rejected by Atelier Invariant</p>
                <p>{rejectionMessage}</p>
              </div>
            </div>
          )}

          {/* Infeasible Budget Warning with Actionable Alternative */}
          {isInfeasibleBudget && !rejectionMessage && (
            <div
              className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 text-xs space-y-2"
              role="status"
            >
              <div className="flex items-center gap-2 font-bold text-sm text-amber-900 dark:text-amber-300">
                <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Action Locked: Infeasible Budget Reduction</span>
              </div>
              <p className="leading-relaxed">
                The proposed budget ceiling of <strong className="font-mono">{formatCurrency(Number(activeRippleAlert.newValue), currentEvent.budget.currency)}</strong> is lower than existing committed expenditures (<strong className="font-mono">{formatCurrency(totalCommittedCents, currentEvent.budget.currency)}</strong>) by <strong className="font-mono">{formatCurrency(totalCommittedCents - Number(activeRippleAlert.newValue), currentEvent.budget.currency)}</strong>.
              </p>
              <div className="pt-2 border-t border-amber-200 dark:border-amber-900/60 text-[11px] space-y-1 text-amber-900/90 dark:text-amber-300/90">
                <p className="font-bold uppercase tracking-wider text-[10px]">Required Resolution Paths:</p>
                <p>1. Open the <strong>Budget & Ledger</strong> tab to cancel or renegotiate committed line items before lowering total capital.</p>
                <p>2. Set your proposed budget ceiling to at least <strong className="font-mono">{formatCurrency(totalCommittedCents, currentEvent.budget.currency)}</strong> to honor signed commitments.</p>
              </div>
            </div>
          )}

          {/* Side-by-Side Blueprint Comparison (Current vs Proposed) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Comparative Blueprint Analysis
              </span>
              <span className="text-[11px] font-mono text-stone-400">
                Current Baseline vs. Adaptive Recommendation
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card 1: Current Blueprint */}
              <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/60 space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800/80 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 font-mono">
                    Current Blueprint
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-mono">
                    Baseline
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-stone-400" /> Attendance:
                    </span>
                    <span className="font-mono font-bold">{prevGuests} guests ({prevTables} tables)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5 text-stone-400" /> Catering Allocation:
                    </span>
                    <span className="font-mono font-bold">{formatCurrency(prevCateringCents, currentEvent.budget.currency)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-stone-400" /> Contingency Buffer:
                    </span>
                    <span className="font-mono font-bold">{formatCurrency(prevContingencyCents, currentEvent.budget.currency)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800">
                    <span className="text-stone-700 dark:text-stone-300 font-semibold flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-stone-400" /> Total Capital:
                    </span>
                    <span className="font-mono font-bold text-stone-900 dark:text-stone-100">{formatCurrency(prevTotalBudgetCents, currentEvent.budget.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Proposed Adaptive State */}
              <div className="p-4 rounded-xl border-2 border-stone-900 dark:border-stone-100 bg-stone-100/50 dark:bg-stone-900/90 space-y-3 relative shadow-md">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" /> Proposed Adaptive State
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 font-mono font-bold">
                    Reconciled
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-stone-500" /> Attendance:
                    </span>
                    <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                      {newGuests} guests ({newTables} tables)
                      {guestDelta !== 0 && (
                        <span className={`ml-1 text-[11px] ${guestDelta > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          ({guestDelta > 0 ? `+${guestDelta}` : guestDelta})
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5 text-stone-500" /> Catering Allocation:
                    </span>
                    <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                      {formatCurrency(proposedCateringCents, currentEvent.budget.currency)}
                      {cateringDeltaCents !== 0 && (
                        <span className={`ml-1 text-[11px] ${cateringDeltaCents > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          ({cateringDeltaCents > 0 ? `+` : ''}{formatCurrency(cateringDeltaCents, currentEvent.budget.currency)})
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-stone-500" /> Contingency Buffer:
                    </span>
                    <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                      {formatCurrency(proposedContingencyCents, currentEvent.budget.currency)}
                      {contingencyAbsorptionCents > 0 && (
                        <span className="ml-1 text-[11px] text-stone-500">
                          (-{formatCurrency(contingencyAbsorptionCents, currentEvent.budget.currency)} absorbed)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-stone-200 dark:border-stone-800">
                    <span className="text-stone-900 dark:text-stone-100 font-bold flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" /> Total Capital:
                    </span>
                    <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                      {formatCurrency(proposedTotalBudgetCents, currentEvent.budget.currency)}
                      {budgetDeficitCents === 0 ? (
                        <span className="ml-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-mono">0% drift</span>
                      ) : (
                        <span className="ml-1.5 text-[10px] text-amber-600 dark:text-amber-400 uppercase font-mono">+{formatCurrency(budgetDeficitCents, currentEvent.budget.currency)}</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Quantitative Delta Breakdown (4-Metric Linear Strip) */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Quantitative Variance Matrix
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              
              <div className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/40">
                <span className="text-[10px] uppercase text-stone-500 dark:text-stone-400 block font-sans">
                  Headcount Shift
                </span>
                <p className={`text-base font-bold mt-0.5 ${guestDelta > 0 ? 'text-amber-600 dark:text-amber-400' : guestDelta < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-700 dark:text-stone-300'}`}>
                  {guestDelta > 0 ? `+${guestDelta}` : guestDelta} guests
                </p>
                <span className="text-[10px] text-stone-400 font-sans">
                  Capacity: {newGuests} total
                </span>
              </div>

              <div className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/40">
                <span className="text-[10px] uppercase text-stone-500 dark:text-stone-400 block font-sans">
                  Catering Variance
                </span>
                <p className={`text-base font-bold mt-0.5 ${cateringDeltaCents > 0 ? 'text-amber-600 dark:text-amber-400' : cateringDeltaCents < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-700 dark:text-stone-300'}`}>
                  {cateringDeltaCents > 0 ? '+' : ''}{formatCurrency(cateringDeltaCents, currentEvent.budget.currency)}
                </p>
                <span className="text-[10px] text-stone-400 font-sans">
                  Auto-recalculated
                </span>
              </div>

              <div className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/40">
                <span className="text-[10px] uppercase text-stone-500 dark:text-stone-400 block font-sans">
                  Floor Seating
                </span>
                <p className="text-base font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                  {tableDelta >= 0 ? `+${tableDelta}` : tableDelta} table{Math.abs(tableDelta) === 1 ? '' : 's'}
                </p>
                <span className="text-[10px] text-stone-400 font-sans">
                  Round-{tableCapacity} layout
                </span>
              </div>

              <div className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/40">
                <span className="text-[10px] uppercase text-stone-500 dark:text-stone-400 block font-sans">
                  Contingency Buffer
                </span>
                <p className="text-base font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                  {contingencyAbsorptionCents > 0 ? `-${formatCurrency(contingencyAbsorptionCents, currentEvent.budget.currency)}` : '$0.00'}
                </p>
                <span className="text-[10px] text-stone-400 font-sans">
                  {budgetDeficitCents === 0 ? 'Reserve absorbed' : 'Budget expanded'}
                </span>
              </div>

            </div>
          </div>

          {/* Affected Vendor RFPs & Creative Artifacts ([Needs Review] Callouts) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Dependent Partner Operational Review
              </span>
              <span className="text-[10px] font-mono text-stone-400">
                Contract Integrity Safeguards
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* Catering partner */}
              <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100">
                    <Utensils className="w-4 h-4 text-stone-500" />
                    <span>Catering & Beverage Partner</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-900">
                    [NEEDS REVIEW]
                  </span>
                </div>
                <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                  Headcount changed to {newGuests} guests. Requires kitchen portion confirmation and updated per-cover banquet contract.
                </p>
              </div>

              {/* Venue & Floor Layout */}
              <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100">
                    <Building2 className="w-4 h-4 text-stone-500" />
                    <span>Venue & Staging Director</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-900">
                    [NEEDS REVIEW]
                  </span>
                </div>
                <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                  Floor plan shift: {newTables} total tables needed ({tableDelta >= 0 ? `+${tableDelta}` : tableDelta} tables). Verify banquet hall egress & spacing.
                </p>
              </div>

              {/* Creative Stationery */}
              <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100">
                    <FileText className="w-4 h-4 text-stone-500" />
                    <span>Creative Atelier & Stationery</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-300 dark:border-stone-700">
                    [NEEDS REVIEW]
                  </span>
                </div>
                <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                  Invitation copy and seating card print quantities flagged for headcount threshold sync.
                </p>
              </div>

              {/* Capital Protection Invariant */}
              <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100">
                    <ShieldCheck className="w-4 h-4 text-stone-500" />
                    <span>Financial Invariant Guard</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-900">
                    [ENFORCED]
                  </span>
                </div>
                <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                  Committed liabilities of {formatCurrency(totalCommittedCents, currentEvent.budget.currency)} locked against accidental clawback.
                </p>
              </div>

            </div>
          </div>

          {/* Recommended Deterministic Actions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Deterministic Execution Protocol
              </span>
              <span className="text-[10px] font-mono text-stone-400">
                {activeRippleAlert.recommendedActions.length} planned operations
              </span>
            </div>

            <div className="space-y-2">
              {activeRippleAlert.recommendedActions.map((action, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-white dark:bg-stone-950/50 rounded-xl border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="font-sans leading-relaxed">{action.description}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-950/40 flex items-center justify-between gap-4">
          <div className="text-[11px] font-mono text-stone-500 dark:text-stone-400 hidden sm:block">
            {isInfeasibleBudget ? (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Action blocked: committed expenses exceed target
              </span>
            ) : (
              <span>Calculated with zero floating-point drift</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDismiss}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition"
            >
              Dismiss / Keep Manual
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isInfeasibleBudget}
              title={isInfeasibleBudget ? 'Cannot apply budget reduction below committed expenditure' : 'Apply recommended adjustments'}
              className={`px-5 py-2.5 text-xs font-bold font-mono uppercase tracking-wider rounded-lg transition flex items-center gap-2 ${
                isInfeasibleBudget
                  ? 'bg-stone-300 text-stone-500 dark:bg-stone-800 dark:text-stone-600 cursor-not-allowed border border-stone-300 dark:border-stone-700'
                  : 'bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 shadow-md'
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
    </div>
  );
};
