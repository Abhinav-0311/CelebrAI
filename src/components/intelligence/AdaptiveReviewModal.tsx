import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { formatCurrency } from '../../types/event';

export const AdaptiveReviewModal: React.FC = () => {
  const {
    currentEvent,
    isAdaptiveModalOpen,
    activeRippleAlert,
    applyRipple,
    dismissRipple,
  } = useEventStore();

  const [rejectionMessage, setRejectionMessage] = React.useState<string | null>(null);

  if (!isAdaptiveModalOpen || !activeRippleAlert || !currentEvent) return null;

  const isGuestChange = activeRippleAlert.triggerType === 'guest_count_change';
  const isBudgetChange = activeRippleAlert.triggerType === 'budget_change';

  const totalSpentCents = currentEvent.budget.allocations.reduce((s, a) => s + a.actualSpentCents, 0);
  const isInfeasibleBudget = isBudgetChange && Number(activeRippleAlert.newValue) < totalSpentCents;

  const handleApply = () => {
    const result = applyRipple(activeRippleAlert);
    if (result && !result.success) {
      setRejectionMessage(
        result.reason || 'This proposed modification cannot be applied without violating committed contracts.'
      );
    } else {
      setRejectionMessage(null);
    }
  };

  const handleDismiss = () => {
    setRejectionMessage(null);
    dismissRipple(activeRippleAlert.id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="adaptive-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                activeRippleAlert.severity === 'high'
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
              }`}
            >
              {activeRippleAlert.severity === 'high' ? (
                <ShieldAlert className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Adaptive Intelligence Alert
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    activeRippleAlert.severity === 'high'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                  }`}
                >
                  {activeRippleAlert.severity} severity
                </span>
              </div>
              <h2 id="adaptive-modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                {activeRippleAlert.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            aria-label="Close modal"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Change Comparison */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/60 flex items-center justify-around text-center">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Previous</p>
            <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
              {isBudgetChange ? formatCurrency(Number(activeRippleAlert.previousValue), currentEvent.budget.currency) : `${activeRippleAlert.previousValue} guests`}
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400" />
          <div>
            <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold">Updated</p>
            <p className="text-lg font-extrabold text-brand-600 dark:text-brand-400">
              {isBudgetChange ? formatCurrency(Number(activeRippleAlert.newValue), currentEvent.budget.currency) : `${activeRippleAlert.newValue} guests`}
            </p>
          </div>
        </div>

        {/* Rejection Alert Banner */}
        {rejectionMessage && (
          <div
            className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs animate-shake"
            role="alert"
          >
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Modification Rejected by Safety Invariant</p>
              <p className="mt-0.5">{rejectionMessage}</p>
            </div>
          </div>
        )}

        {/* Constraint Warning if Infeasible */}
        {isInfeasibleBudget && !rejectionMessage && (
          <div
            className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2 text-amber-800 dark:text-amber-300 text-xs"
            role="status"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <p>
              <strong>Constraint Warning:</strong> The proposed budget ({formatCurrency(Number(activeRippleAlert.newValue), currentEvent.budget.currency)}) is lower than existing committed expenditures ({formatCurrency(totalSpentCents, currentEvent.budget.currency)}).
            </p>
          </div>
        )}

        {/* Impact Summary */}
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Deterministic Ripple Impact
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-300 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
            {activeRippleAlert.impactSummary}
          </p>
        </div>

        {/* Quantitative Diffs */}
        {isGuestChange && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400">Catering Adjustment</span>
              <p className={`text-base font-bold font-mono ${activeRippleAlert.calculatedDiffs.cateringDeltaCents >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {activeRippleAlert.calculatedDiffs.cateringDeltaCents >= 0 ? '+' : ''}{formatCurrency(activeRippleAlert.calculatedDiffs.cateringDeltaCents, currentEvent.budget.currency)}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400">Floor Layout / Tables</span>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                {activeRippleAlert.calculatedDiffs.seatingDeltaTables >= 0 ? '+' : ''}{activeRippleAlert.calculatedDiffs.seatingDeltaTables} table(s)
              </p>
            </div>
          </div>
        )}

        {/* Recommended Actions */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            AI Recommended Plan Modifications
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {activeRippleAlert.recommendedActions.map((action, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200"
              >
                <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <span>{action.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-4 py-2 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Dismiss / Keep Manual
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 text-xs font-bold rounded-lg text-white bg-gradient-to-r from-brand-600 to-fuchsia-600 hover:from-brand-700 hover:to-fuchsia-700 shadow-md shadow-brand-500/20 transition flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply Recommendations</span>
          </button>
        </div>
      </div>
    </div>
  );
};
