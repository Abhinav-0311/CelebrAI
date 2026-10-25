import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Clock, 
  ArrowRight,
  Shirt,
  Sparkles,
  AlertTriangle,
  GlassWater,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { formatCurrency, dollarsToCents, centsToDollars } from '../../types/event';
import { computeFinancialSummary } from '../../services/eventAnalytics';
import { CelebrAILogoIcon } from '../common/CelebrAILogo';

export const OverviewTab: React.FC = () => {
  const { 
    currentEvent, 
    updateGuestCount, 
    updateTotalBudgetCents, 
    setActiveTab,
    systemMode,
    setAdaptiveModalOpen,
    setActiveRippleAlert
  } = useEventStore();

  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const [copyError, setCopyError] = useState('');

  // Local state for Quick-Adjust inputs
  const [tempGuests, setTempGuests] = useState<number>(currentEvent?.guestCount || 100);
  const [tempBudgetDollars, setTempBudgetDollars] = useState<number>(
    currentEvent ? centsToDollars(currentEvent.budget.totalBudgetCents) : 25000
  );

  // Synchronize draft inputs whenever active event changes
  useEffect(() => {
    if (currentEvent) {
      setTempGuests(currentEvent.guestCount);
      setTempBudgetDollars(centsToDollars(currentEvent.budget.totalBudgetCents));
    }
  }, [currentEvent?.id, currentEvent?.guestCount, currentEvent?.budget.totalBudgetCents]);

  if (!currentEvent) {
    return (
      <div className="text-center py-20 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <CelebrAILogoIcon size="lg" className="mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">No Event Loaded</h3>
        <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
          Create a bespoke celebration plan or load the curated sample showcase from the header.
        </p>
      </div>
    );
  }

  const { theme, budget, guests, timeline } = currentEvent;

  const financial = computeFinancialSummary(budget);
  const {
    totalBudgetCents,
    totalCommittedCents,
    remainingHeadroomCents,
  } = financial;

  const attendingCount = guests.dietarySummary.confirmedAttending;
  const completedMilestones = timeline.milestones.filter((m) => m.status === 'completed').length;
  const targetTables = Math.ceil(currentEvent.guestCount / guests.targetTableCapacity);

  const handleCopyHex = async (hex: string) => {
    setCopyError('');
    setCopiedHex(null);
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      setTimeout(() => setCopiedHex(null), 1500);
    } catch {
      setCopyError('Could not copy this color. Select its hex code and copy it manually.');
    }
  };

  const handleApplyGuestChange = () => {
    if (tempGuests !== currentEvent.guestCount && tempGuests > 0) {
      updateGuestCount(tempGuests);
    }
  };

  const handleApplyBudgetChange = () => {
    const targetCents = dollarsToCents(tempBudgetDollars);
    if (targetCents !== currentEvent.budget.totalBudgetCents && targetCents > 0) {
      updateTotalBudgetCents(targetCents);
    }
  };

  const pendingRipple = currentEvent.pendingRipples.find((r) => r.status === 'pending_review');

  const formattedDate = new Date(currentEvent.eventDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="workspace space-y-6 sm:space-y-8 pb-12 font-sans">
      {copyError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{copyError}</p>}
      
      {/* ─────────────────────────────────────────────────────────────
          1. TWO-COLUMN HERO WORKSPACE: EVENT COVER + NEXT DECISIONS
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8 items-stretch">
        
        {/* LEFT COLUMN (7 COLS): EVENT COVER ARTIFACT */}
        <div className="xl:col-span-7 flex">
          {currentEvent.eventType === 'corporate_gala' ? (
            // POSTER A: CORPORATE GALA (Architectural Sovereign Grid)
            <section 
              aria-label="Event Poster"
              className="relative flex-1 overflow-hidden rounded-2xl bg-[#efd6c6] text-[#38241b] p-6 sm:p-8 shadow-md border border-[#dec0ab] flex flex-col justify-between min-h-[360px]"
            >
              <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#a63b20_1px,transparent_1px)] [background-size:20px_20px]" />

              <div className="relative z-10 space-y-4">
                {/* Meta Header */}
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className=" text-xs tracking-widest uppercase font-semibold text-[#a63b20] px-2 py-0.5 rounded bg-[#a63b20]/10 border border-[#a63b20]/30">
                    Corporate Gala
                  </span>
                  <span className="text-stone-600">•</span>
                  <span className="text-stone-500  text-xs uppercase">
                    {systemMode === 'live' ? 'Live AI plan' : systemMode === 'sample' ? 'Sample plan' : 'Offline plan'}
                  </span>
                </div>

                {/* Title & Concept */}
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-4xl font-medium tracking-[-0.035em] text-stone-900 leading-tight">
                    {currentEvent.title}
                  </h1>
                  <p className="text-sm sm:text-base text-stone-700 leading-relaxed max-w-xl">
                    <span className="text-[#a63b20] font-medium">"{theme.conceptTitle}"</span> — {theme.conceptDescription}
                  </p>
                </div>
              </div>

              {/* Bottom Specs & SVG Emblem */}
              <div className="relative z-10 pt-6 mt-4 border-t border-[#d2ae98] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#fcf2e9] border border-[#e3c5b1] text-stone-800">
                    <Calendar className="w-3.5 h-3.5 text-[#a63b20] shrink-0" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#fcf2e9] border border-[#e3c5b1] text-stone-800">
                    <MapPin className="w-3.5 h-3.5 text-[#a63b20] shrink-0" />
                    <span className="break-words">{currentEvent.location}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#fcf2e9] border border-[#e3c5b1] text-stone-800 ">
                    <Users className="w-3.5 h-3.5 text-[#a63b20] shrink-0" />
                    <span>{currentEvent.guestCount} guests ({targetTables} tables)</span>
                  </div>
                </div>

                {/* Subtle Geometric Emblem */}
                <div className="hidden sm:flex items-center gap-2 text-xs  text-stone-500">
                  <svg className="w-6 h-6 text-[#a63b20]/80" viewBox="0 0 40 40" fill="none">
                    <polygon points="20,4 36,12 36,28 20,36 4,28 4,12" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="20" cy="20" r="2" fill="currentColor" />
                  </svg>
                  <span className="sr-only">Event emblem</span>
                </div>
              </div>
            </section>
          ) : currentEvent.eventType === 'wedding' || currentEvent.eventType === 'anniversary' ? (
            // POSTER B: WEDDING & ANNIVERSARY (Warm Ivory Stationery)
            <section 
              aria-label="Event Poster"
              className="relative flex-1 overflow-hidden rounded-2xl bg-[#FAF7F2] text-[#1C1917] p-6 sm:p-8 shadow-md border-2 border-[#E7DFD3] dark:bg-[#181614] dark:text-[#F7F4EB] dark:border-[#2F2B26] flex flex-col justify-between min-h-[360px]"
            >
              <div className="absolute inset-2 sm:inset-3 border border-[#C5A869]/25 dark:border-[#C5A869]/20 rounded-xl pointer-events-none" />

              <div className="relative z-10 space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-serif italic text-sm tracking-wider text-amber-800 dark:text-amber-300 font-semibold">
                    {currentEvent.eventType === 'wedding' ? 'Wedding Celebration' : 'Anniversary Celebration'}
                  </span>
                  <span className="text-stone-300 dark:text-stone-700">•</span>
                  <span className=" text-xs uppercase text-stone-500">
                    {systemMode === 'live' ? 'Live AI plan' : systemMode === 'sample' ? 'Sample plan' : 'Offline plan'}
                  </span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif italic text-stone-900 dark:text-stone-50 leading-tight">
                    {currentEvent.title}
                  </h1>
                  <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 font-serif italic leading-relaxed max-w-xl">
                    "{theme.conceptTitle}" — {theme.conceptDescription}
                  </p>
                </div>
              </div>

              <div className="relative z-10 pt-6 mt-4 border-t border-[#E7DFD3] dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 shadow-sm">
                    <Calendar className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 shadow-sm">
                    <MapPin className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                    <span className="break-words">{currentEvent.location}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 shadow-sm">
                    <Users className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                    <span>{currentEvent.guestCount} guests</span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-amber-800/80 dark:text-amber-400/80 font-serif italic text-sm">
                  <span>Solemnity & Joy</span>
                </div>
              </div>
            </section>
          ) : (
            // POSTER C: BIRTHDAY & CONTEMPORARY (Graphic Poster Art Direction)
            <section 
              aria-label="Event Poster"
              className="relative flex-1 overflow-hidden rounded-2xl bg-[#0D1527] text-white p-6 sm:p-8 shadow-md border border-[#1E293B] flex flex-col justify-between min-h-[360px]"
            >
              <div className="relative z-10 space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="px-2 py-0.5 rounded bg-rose-500 text-white  text-xs font-bold uppercase">
                    Celebration
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400  text-xs uppercase">
                    Milestone Soirée
                  </span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                    {currentEvent.title}
                  </h1>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                    <span className="text-amber-400 font-semibold">{theme.conceptTitle}:</span> {theme.conceptDescription}
                  </p>
                </div>
              </div>

              <div className="relative z-10 pt-6 mt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="break-words">{currentEvent.location}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 ">
                    <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{currentEvent.guestCount} guests</span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1 text-xs  text-slate-400">
                  <span>Partiful Mode</span>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN (5 COLS): NEXT DECISIONS & QUICK ADJUST PANEL */}
        <div className="xl:col-span-5 space-y-4">
          
          {/* ACTIONABLE NEXT DECISIONS (Linear-style) */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="section-title flex items-center gap-2">
                <span>Next steps</span>
                {pendingRipple && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </h3>
              <span className="text-xs  text-stone-500">
                {pendingRipple ? 'Action Needed' : 'In Sync'}
              </span>
            </div>

            {/* Pending Ripple Item or All Good Item */}
            {pendingRipple ? (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      {pendingRipple.title}
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 ">
                      {pendingRipple.impactSummary}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveRippleAlert(pendingRipple);
                    setAdaptiveModalOpen(true);
                  }}
                  className="w-full mt-1 px-3 py-1.5 text-sm font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>Review & Apply Diff</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800 flex items-center gap-2.5 text-sm text-stone-600 dark:text-stone-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>No pending changes. Review your guests, spending and schedule below.</span>
              </div>
            )}

            {/* Operational Decisions Quick List */}
            <div className="divide-y divide-stone-100 dark:divide-stone-800 text-sm">
              <button
                type="button"
                onClick={() => setActiveTab('guests')}
                className="w-full min-h-12 py-3 grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center text-left hover:text-stone-900 dark:hover:text-stone-100 group transition"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-700 dark:group-hover:text-stone-200" />
                  <span className="font-medium text-stone-700 dark:text-stone-300">Guest RSVPs</span>
                </div>
                <span className="text-xs tabular-nums text-right text-stone-600">
                  {attendingCount} / {currentEvent.guestCount} confirmed →
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('budget')}
                className="w-full min-h-12 py-3 grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center text-left hover:text-stone-900 dark:hover:text-stone-100 group transition"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-700 dark:group-hover:text-stone-200" />
                  <span className="font-medium text-stone-700 dark:text-stone-300">Committed spend</span>
                </div>
                <span className="text-xs tabular-nums text-right text-stone-600">
                  {formatCurrency(totalCommittedCents, budget.currency)} ({Math.round((totalCommittedCents / totalBudgetCents) * 100)}%) →
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className="w-full min-h-12 py-3 grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center text-left hover:text-stone-900 dark:hover:text-stone-100 group transition"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-700 dark:group-hover:text-stone-200" />
                  <span className="font-medium text-stone-700 dark:text-stone-300">Timeline</span>
                </div>
                <span className="text-xs tabular-nums text-right text-stone-600">
                  {completedMilestones} / {timeline.milestones.length} cues executed →
                </span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-6 shadow-sm space-y-5">
            <div className="space-y-1">
              <h3 className="section-title">Adjust your plan</h3>
              <p className="text-sm text-stone-500">Preview changes before applying.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="adjust-guests" className="field-label">Guest Count</label>
                <div className="grid grid-cols-[minmax(0,1fr)_104px] gap-3">
                  <input id="adjust-guests" type="number" min="10" max="5000" value={tempGuests}
                    onChange={event => setTempGuests(parseInt(event.target.value) || 0)}
                    className="min-h-11 min-w-0 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 text-sm tabular-nums dark:border-stone-700 dark:bg-stone-900"
                    title="Target guest headcount" />
                  <button type="button" onClick={handleApplyGuestChange} disabled={tempGuests === currentEvent.guestCount}
                    aria-label="Recalculate guest adaptive ripple"
                    className="min-h-11 rounded-lg bg-brand-700 px-3 text-sm font-medium text-white transition-colors hover:bg-brand-800 disabled:bg-stone-100 disabled:text-stone-500 dark:disabled:bg-stone-800">Ripple</button>
                </div>
              </div>
              <div>
                <label htmlFor="adjust-budget" className="field-label">Budget</label>
                <div className="grid grid-cols-[minmax(0,1fr)_104px] gap-3">
                  <div className="flex h-11 min-w-0 items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 dark:border-stone-700 dark:bg-stone-900">
                    <span aria-hidden="true" className="text-sm text-stone-500">$</span>
                    <input id="adjust-budget" type="number" step="1000" value={tempBudgetDollars}
                      onChange={event => setTempBudgetDollars(parseFloat(event.target.value) || 0)}
                      className="h-full min-w-0 w-full bg-transparent text-sm tabular-nums" title="Total budget ceiling in USD" />
                  </div>
                  <button type="button" onClick={handleApplyBudgetChange}
                    disabled={dollarsToCents(tempBudgetDollars) === currentEvent.budget.totalBudgetCents}
                    aria-label="Preview budget adjustment"
                    className="min-h-11 rounded-lg bg-brand-700 px-3 text-sm font-medium text-white transition-colors hover:bg-brand-800 disabled:bg-stone-100 disabled:text-stone-500 dark:disabled:bg-stone-800">Rebalance</button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. COMPACT OPERATIONAL PROGRESS STRIP (Not giant KPI boxes)
         ───────────────────────────────────────────────────────────── */}
      <section 
        aria-label="Event Highlights"
        className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-200 dark:divide-stone-800"
      >
        {/* Strip 1: Budget Utilization */}
        <div className="p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-300">
              <span>Committed:</span>
              <span className=" font-semibold text-stone-900 dark:text-stone-100">
                {totalCommittedCents === 0 ? '$0' : formatCurrency(totalCommittedCents, budget.currency)}
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs  font-semibold ${
              totalCommittedCents === 0 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
            }`}>
              {totalCommittedCents === 0 ? '100% Uncommitted' : `${Math.round((remainingHeadroomCents / totalBudgetCents) * 100)}% Free`}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
            <div 
              className="h-full bg-stone-900 dark:bg-stone-100 "
              style={{ width: `${Math.min(100, Math.round((totalCommittedCents / totalBudgetCents) * 100))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-stone-500 ">
            <span>Budget: {formatCurrency(totalBudgetCents, budget.currency)}</span>
            <span>{formatCurrency(remainingHeadroomCents, budget.currency)} Available</span>
          </div>
        </div>

        {/* Strip 2: Hospitality & Seating */}
        <div className="p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-stone-700 dark:text-stone-300">Seating & Dining</span>
            <span className=" text-stone-500">
              {targetTables} Tables ({guests.targetTableCapacity}/table)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
            <div 
              className="h-full bg-amber-600 "
              style={{ width: `${Math.min(100, Math.round((attendingCount / currentEvent.guestCount) * 100))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-stone-500 ">
            <span>{attendingCount} Confirmed Guests</span>
            <span>{guests.dietarySummary.confirmedVegan + guests.dietarySummary.confirmedVegetarian} Dietary Requirements</span>
          </div>
        </div>

        {/* Strip 3: Run of Show */}
        <div className="p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-stone-700 dark:text-stone-300">Run of Show</span>
            <span className=" text-stone-500">
              {completedMilestones} of {timeline.milestones.length} Completed
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
            <div 
              className="h-full bg-emerald-600 "
              style={{ width: `${Math.min(100, Math.round((completedMilestones / Math.max(1, timeline.milestones.length)) * 100))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-stone-500 ">
            <span>Starts at {timeline.milestones[0]?.time || '16:00'}</span>
            <span>{timeline.milestones.length - completedMilestones} Pending Cues</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. PALETTE & DESIGN DIRECTIVES (Milanote / Partiful inspired)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left: Swatch Palette (5 cols) */}
        <div className="xl:col-span-5 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Event Color Palette</span>
            </h3>
            <span className="text-xs  text-stone-500">Click to copy hex</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {theme.colorPalette.map((color, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleCopyHex(color.hex)}
                className="group flex flex-col items-center gap-1.5 p-1 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition text-left"
                aria-label={`Copy color ${color.name} ${color.hex}`}
              >
                <div
                  className="w-full h-12 rounded-md shadow-sm border border-black/10 group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-xs  text-stone-600 dark:text-stone-500 uppercase">
                  {copiedHex === color.hex ? 'Copied' : color.hex}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Directives (7 cols) */}
        <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Dress Code */}
          <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-stone-500 font-medium">
              <Shirt className="w-3.5 h-3.5 text-stone-500" />
              <span>Dress Code</span>
            </div>
            <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
              {theme.dressCode}
            </p>
          </div>

          {/* Signature Drink */}
          <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-stone-500 font-medium">
              <GlassWater className="w-3.5 h-3.5 text-stone-500" />
              <span>Signature Drink</span>
            </div>
            <p className="text-sm font-medium text-stone-800 dark:text-stone-200 " title={theme.signatureDrink}>
              {theme.signatureDrink || 'Curated seasonal cocktails'}
            </p>
          </div>

          {/* Atmosphere Lighting */}
          <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-stone-500 font-medium">
              <Flame className="w-3.5 h-3.5 text-stone-500" />
              <span>Lighting Vibe</span>
            </div>
            <p className="text-sm font-medium text-stone-800 dark:text-stone-200 " title={theme.ambianceLighting}>
              {theme.ambianceLighting || 'Warm candlelit ambient warmth'}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
