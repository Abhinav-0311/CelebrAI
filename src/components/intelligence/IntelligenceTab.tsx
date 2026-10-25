import React from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  HelpCircle 
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';

export const IntelligenceTab: React.FC = () => {
  const { 
    currentEvent, 
    updateGuestCount, 
    updateTotalBudgetCents, 
    setAdaptiveModalOpen, 
    setActiveRippleAlert 
  } = useEventStore();

  if (!currentEvent) return null;

  const pendingRipples = currentEvent.pendingRipples.filter((r) => r.status === 'pending_review');
  const appliedRipples = currentEvent.pendingRipples.filter((r) => r.status === 'applied');

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 sm:p-8 shadow-xl border border-stone-800 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A869]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-stone-800 border border-[#C5A869]/30 flex items-center justify-center text-[#C5A869]">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#C5A869]/20 text-[#E8D49B] border border-[#C5A869]/30">
                Core Differentiator
              </span>
              <span className="text-xs text-stone-400 font-mono">Deterministic Math + AI Advisory</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-stone-50 mt-1">
              Adaptive Event Intelligence Engine
            </h2>
          </div>
        </div>

        <p className="text-sm text-stone-300 max-w-3xl leading-relaxed relative z-10 font-sans">
          Traditional planners remain static once an event is created. CelebrAI continuously models cross-module ripple effects: when guest counts or budgets shift, the engine dynamically recalculates catering portions, seating deficits, contingency stress, and timeline milestones before prompting you with a <strong className="text-stone-100 font-semibold">Diff Review Modal</strong>.
        </p>

        {/* Quick Simulator Sandbox */}
        <div className="pt-2 relative z-10">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#C5A869] mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Evaluator Sandbox: Simulate Ripple Events
          </h4>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => updateGuestCount(currentEvent.guestCount + 30)}
              className="px-3 py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-800 border border-stone-700 hover:border-[#C5A869]/60 text-xs font-semibold text-stone-200 transition flex items-center gap-1.5 shadow-2xs font-mono"
            >
              <span>+30 Guests (Expand)</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A869]" />
            </button>

            <button
              type="button"
              onClick={() => updateGuestCount(Math.max(10, currentEvent.guestCount - 25))}
              className="px-3 py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-800 border border-stone-700 hover:border-[#C5A869]/60 text-xs font-semibold text-stone-200 transition flex items-center gap-1.5 shadow-2xs font-mono"
            >
              <span>-25 Guests (Downscale)</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A869]" />
            </button>

            <button
              type="button"
              onClick={() => updateTotalBudgetCents(currentEvent.budget.totalBudgetCents + 1000000)}
              className="px-3 py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-800 border border-stone-700 hover:border-[#C5A869]/60 text-xs font-semibold text-stone-200 transition flex items-center gap-1.5 shadow-2xs font-mono"
            >
              <span>+$10,000 Budget (Expand)</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A869]" />
            </button>

            <button
              type="button"
              onClick={() => updateTotalBudgetCents(Math.max(500000, currentEvent.budget.totalBudgetCents - 800000))}
              className="px-3 py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-800 border border-stone-700 hover:border-[#C5A869]/60 text-xs font-semibold text-stone-200 transition flex items-center gap-1.5 shadow-2xs font-mono"
            >
              <span>-$8,000 Budget (Stress Test)</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A869]" />
            </button>
          </div>
        </div>
      </div>

      {/* Pending Ripple Alerts */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>Pending Ripple Reviews</span>
              {pendingRipples.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-mono">
                  {pendingRipples.length} Action Needed
                </span>
              )}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Unapplied impacts awaiting user confirmation</p>
          </div>
        </div>

        {pendingRipples.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-xl border-stone-200 dark:border-stone-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-stone-700 dark:text-stone-200">
              All event parameters are synchronized
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Use the sandbox buttons above or adjust guests on the overview tab to trigger new ripple analyses.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRipples.map((ripple) => (
              <div
                key={ripple.id}
                className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100">
                      {ripple.title}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 font-mono">
                      {ripple.severity}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300">
                    {ripple.impactSummary}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveRippleAlert(ripple);
                    setAdaptiveModalOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-lg text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 shadow-sm transition whitespace-nowrap self-start sm:self-auto"
                >
                  Review Diff Modal
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Applied Diffs & Audit Trail */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Applied Changes & Audit Log ({appliedRipples.length})</span>
        </h3>

        {appliedRipples.length === 0 ? (
          <p className="text-xs text-stone-400 italic">No historical diffs applied in this session yet.</p>
        ) : (
          <div className="space-y-2">
            {appliedRipples.map((ripple) => (
              <div
                key={ripple.id}
                className="p-3 rounded-lg bg-stone-50 dark:bg-stone-850/60 border border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">{ripple.title}</span>
                  <span className="text-stone-400 block text-[11px] font-mono">{new Date(ripple.createdAt).toLocaleTimeString()}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold text-[10px] font-mono">
                  Applied
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Architecture Explanation Card */}
      <div className="bg-stone-50 dark:bg-stone-900/60 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 space-y-3">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-[#C5A869]" /> How the Reactive Math Model Works
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-stone-600 dark:text-stone-400">
          <div className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700">
            <strong className="text-stone-900 dark:text-stone-100 block mb-1 font-serif">1. Catering Per-Capita Drift</strong>
            <p>Computes average per-guest cost from current catering contract and scales linearly with strict floor boundaries.</p>
          </div>
          <div className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700">
            <strong className="text-stone-900 dark:text-stone-100 block mb-1 font-serif">2. Geometric Seating Modulo</strong>
            <p>Calculates ceil(guestCount / targetTableCapacity) to detect floor space and table hire variances instantly.</p>
          </div>
          <div className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700">
            <strong className="text-stone-900 dark:text-stone-100 block mb-1 font-serif">3. Non-Destructive Diff Pattern</strong>
            <p>Never silently overwrites user data. Generates structured patch recommendations inspected via the review dialog.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
