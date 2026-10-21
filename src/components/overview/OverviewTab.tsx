import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Clock, 
  Copy, 
  Check, 
  ArrowRight,
  Shirt,
  Sparkles,
  Layers
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

  // Local state for Quick-Adjust inputs
  const [tempGuests, setTempGuests] = useState<number>(currentEvent?.guestCount || 100);
  const [tempBudgetDollars, setTempBudgetDollars] = useState<number>(
    currentEvent ? centsToDollars(currentEvent.budget.totalBudgetCents) : 25000
  );

  // PRIORITY 0 (BUG 2 FIX): Synchronize draft inputs whenever active event changes
  useEffect(() => {
    if (currentEvent) {
      setTempGuests(currentEvent.guestCount);
      setTempBudgetDollars(centsToDollars(currentEvent.budget.totalBudgetCents));
    }
  }, [currentEvent?.id, currentEvent?.guestCount, currentEvent?.budget.totalBudgetCents]);

  if (!currentEvent) {
    return (
      <div className="text-center py-20 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <CelebrAILogoIcon size="lg" className="mx-auto mb-4" />
        <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">No Event Loaded</h3>
        <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
          Create a bespoke celebration plan or load the curated sample showcase from the header.
        </p>
      </div>
    );
  }

  const { theme, budget, guests, timeline } = currentEvent;

  // PRIORITY 0 (BUG 1 FIX): Derive committed spending strictly from the expense ledger!
  // A fresh event with expenses: [] strictly shows $0 committed and 100% available headroom.
  const financial = computeFinancialSummary(budget);
  const {
    totalBudgetCents,
    totalCommittedCents,
    remainingHeadroomCents,
  } = financial;

  const attendingCount = guests.dietarySummary.confirmedAttending;
  const completedMilestones = timeline.milestones.filter((m) => m.status === 'completed').length;
  const targetTables = Math.ceil(currentEvent.guestCount / guests.targetTableCapacity);

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
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
    <div className="space-y-6 animate-fadeIn pb-16 font-sans">
      
      {/* ─────────────────────────────────────────────────────────────
          1. DISTINCT EVENT POSTER SYSTEMS
          Three truly different art directions:
          - Corporate Gala: Sovereign charcoal canvas, gold rules, architectural geometry
          - Wedding & Anniversary: Warm ivory stationery, double hairline border, botanical motif
          - Birthday & Festival: Modern graphic poster, bold display type, curated color blocks
         ───────────────────────────────────────────────────────────── */}
      {currentEvent.eventType === 'corporate_gala' ? (
        // ─── POSTER A: CORPORATE GALA (Architectural Sovereign Grid) ───
        <section 
          aria-label="Event Poster"
          className="relative overflow-hidden rounded-2xl bg-[#0B0F15] text-[#F3F4F6] p-4 sm:p-7 shadow-xl border border-[#1E2633]"
        >
          {/* Subtle architectural grid lines */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#C6A869_1px,transparent_1px)] [background-size:20px_20px]" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-3 flex-1 min-w-0">
              
              {/* Top Meta Line */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono text-[10px] tracking-widest uppercase font-bold text-[#C6A869] px-2 py-0.5 rounded bg-[#C6A869]/10 border border-[#C6A869]/30">
                  Corporate Gala
                </span>
                <span className="text-stone-500 font-mono text-[10px]">•</span>
                <span className="text-stone-400 font-mono text-[10px] tracking-wider uppercase">
                  {systemMode === 'live' ? 'Live AI' : 'Deterministic Plan'}
                </span>
                <span className="text-stone-500 font-mono text-[10px] hidden sm:inline">•</span>
                <span className="text-stone-400 font-mono text-[10px] hidden sm:inline">
                  Ref: {currentEvent.id.slice(0, 14)}
                </span>
              </div>

              {/* Title & Concept */}
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tight text-[#FDFBF7] leading-tight text-balance">
                  {currentEvent.title}
                </h1>
                <p className="text-xs sm:text-sm text-stone-300 font-serif italic max-w-2xl line-clamp-2">
                  "{theme.conceptTitle}" — {theme.conceptDescription}
                </p>
              </div>

              {/* High-Contrast Coordinates Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-900 border border-stone-800 text-stone-200">
                  <Calendar className="w-3.5 h-3.5 text-[#C6A869] shrink-0" />
                  <span className="font-medium">{formattedDate}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-900 border border-stone-800 text-stone-200">
                  <MapPin className="w-3.5 h-3.5 text-[#C6A869] shrink-0" />
                  <span className="truncate max-w-[200px]">{currentEvent.location}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-900 border border-stone-800 text-stone-200">
                  <Users className="w-3.5 h-3.5 text-[#C6A869] shrink-0" />
                  <span>{currentEvent.guestCount} guests ({targetTables} tables)</span>
                </div>
              </div>
            </div>

            {/* Original Architectural Geometric SVG Emblem */}
            <div className="hidden lg:flex flex-col items-center justify-center p-3 rounded-xl bg-stone-900/60 border border-stone-800/80 shrink-0">
              <svg className="w-16 h-16 text-[#C6A869]/80" viewBox="0 0 80 80" fill="none">
                <polygon points="40,8 72,24 72,56 40,72 8,56 8,24" stroke="currentColor" strokeWidth="1.5" />
                <line x1="40" y1="8" x2="40" y2="72" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="8" y1="24" x2="72" y2="56" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="8" y1="56" x2="72" y2="24" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
                <circle cx="40" cy="40" r="3.5" fill="currentColor" />
              </svg>
              <span className="text-[9px] font-mono tracking-widest text-[#C6A869]/70 uppercase mt-1">
                Gala Protocol
              </span>
            </div>
          </div>
        </section>
      ) : currentEvent.eventType === 'wedding' || currentEvent.eventType === 'anniversary' ? (
        // ─── POSTER B: WEDDING & ANNIVERSARY (Warm Ivory Stationery & Botanical Flourish) ───
        <section 
          aria-label="Event Poster"
          className="relative overflow-hidden rounded-2xl bg-[#FAF7F2] text-[#1C1917] p-4 sm:p-7 shadow-xl border-2 border-[#E7DFD3] dark:bg-[#181614] dark:text-[#F7F4EB] dark:border-[#2F2B26]"
        >
          {/* Subtle Inner Double Hairline Frame */}
          <div className="absolute inset-2 sm:inset-3 border border-[#C5A869]/25 dark:border-[#C5A869]/20 rounded-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-3 flex-1 min-w-0">
              
              {/* Top Meta Line */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-serif italic text-xs tracking-wider text-amber-800 dark:text-amber-300 font-semibold">
                  {currentEvent.eventType === 'wedding' ? 'The Wedding Celebration' : 'Anniversary Celebration'}
                </span>
                <span className="text-stone-300 dark:text-stone-700">•</span>
                <span className="font-mono text-[10px] uppercase text-stone-500 dark:text-stone-400">
                  {systemMode === 'live' ? 'AI Designed' : 'Curated Atelier'}
                </span>
              </div>

              {/* Title & Romantic Concept */}
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif italic tracking-normal text-stone-900 dark:text-stone-50 leading-tight text-balance">
                  {currentEvent.title}
                </h1>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif italic max-w-2xl line-clamp-2">
                  "{theme.conceptTitle}" — {theme.conceptDescription}
                </p>
              </div>

              {/* Clean Ivory Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                  <span className="font-medium">{formattedDate}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 shadow-2xs">
                  <MapPin className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                  <span className="truncate max-w-[200px]">{currentEvent.location}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 shadow-2xs">
                  <Users className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                  <span>{currentEvent.guestCount} guests ({targetTables} tables)</span>
                </div>
              </div>
            </div>

            {/* Original Handcrafted Botanical Flourish SVG Motif */}
            <div className="hidden lg:flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50/50 dark:bg-stone-900/60 border border-amber-200/50 dark:border-stone-800 shrink-0">
              <svg className="w-16 h-16 text-amber-800/70 dark:text-amber-400/70" viewBox="0 0 80 80" fill="none">
                <path d="M40 10 C38 25, 42 55, 40 70" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M40 22 C32 18, 25 22, 22 28 C28 29, 36 26, 40 22 Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
                <path d="M40 32 C48 28, 55 32, 58 38 C52 39, 44 36, 40 32 Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
                <path d="M40 44 C32 40, 25 44, 22 50 C28 51, 36 48, 40 44 Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
                <path d="M40 54 C48 50, 55 54, 58 60 C52 61, 44 58, 40 54 Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
              </svg>
              <span className="text-[9px] font-serif italic text-amber-900/70 dark:text-amber-300/70 mt-1">
                Solemnity & Joy
              </span>
            </div>
          </div>
        </section>
      ) : (
        // ─── POSTER C: BIRTHDAY & CONTEMPORARY GATHERINGS (Graphic Typography & Curated Color Blocks) ───
        <section 
          aria-label="Event Poster"
          className="relative overflow-hidden rounded-2xl bg-[#0D1527] text-white p-4 sm:p-7 shadow-xl border border-[#1E293B]"
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-3 flex-1 min-w-0">
              
              {/* Top Meta Line */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-sans font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {currentEvent.eventType.replace('_', ' ')}
                </span>
                <span className="text-slate-500 font-mono text-[10px]">•</span>
                <span className="text-slate-400 font-mono text-[10px] uppercase">
                  {currentEvent.venueType}
                </span>
              </div>

              {/* Bold Graphic Typography */}
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-sans font-black tracking-tight text-white leading-tight text-balance">
                  {currentEvent.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl line-clamp-2">
                  <strong className="text-white">"{theme.conceptTitle}"</strong> — {theme.conceptDescription}
                </p>
              </div>

              {/* Graphic Contrast Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200">
                  <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="font-semibold">{formattedDate}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200">
                  <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate max-w-[200px]">{currentEvent.location}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200">
                  <Users className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>{currentEvent.guestCount} guests ({targetTables} tables)</span>
                </div>
              </div>
            </div>

            {/* Original Geometric Party Motif SVG */}
            <div className="hidden lg:flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 shrink-0">
              <svg className="w-16 h-16" viewBox="0 0 80 80" fill="none">
                <circle cx="36" cy="44" r="20" fill="#F43F5E" fillOpacity="0.85" />
                <circle cx="48" cy="32" r="16" fill="#FBBF24" fillOpacity="0.85" />
                <circle cx="40" cy="38" r="10" fill="#38BDF8" fillOpacity="0.9" />
                <path d="M22 18 L25 24 L32 25 L27 30 L28 37 L22 33 L16 37 L17 30 L12 25 L19 24 Z" fill="#FDE047" />
              </svg>
              <span className="text-[9px] font-mono tracking-wider text-slate-400 uppercase mt-1">
                Celebration
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. LINEAR-INSPIRED HIGH-DENSITY OPERATIONAL STRIP
          Clean, natural language: Budget, Guests & seating, Run of show, Adjust your plan
         ───────────────────────────────────────────────────────────── */}
      <section 
        aria-label="Event Highlights & Quick Adjust"
        className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm divide-y lg:divide-y-0 lg:divide-x divide-stone-200 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* Card 1: Budget */}
        <div className="p-4 sm:p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span className="font-semibold text-xs text-stone-700 dark:text-stone-300">Budget</span>
            <DollarSign className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-stone-900 dark:text-stone-100">
              {formatCurrency(totalBudgetCents, budget.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-stone-500 dark:text-stone-400">
              Committed: <strong className="font-mono text-stone-900 dark:text-stone-100">{formatCurrency(totalCommittedCents, budget.currency)}</strong>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
              totalCommittedCents === 0 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
            }`}>
              {totalCommittedCents === 0 ? '100% Uncommitted' : `${Math.round((remainingHeadroomCents / totalBudgetCents) * 100)}% Free`}
            </span>
          </div>
        </div>

        {/* Card 2: Guests & seating */}
        <div className="p-4 sm:p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span className="font-semibold text-xs text-stone-700 dark:text-stone-300">Guests & seating</span>
            <Users className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {attendingCount} <span className="text-xs font-normal text-stone-500 font-mono">/ {currentEvent.guestCount} confirmed</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-stone-500 dark:text-stone-400 font-mono">
              {targetTables} Tables ({guests.targetTableCapacity}/table)
            </span>
            <span className="text-[10.5px] text-stone-600 dark:text-stone-300">
              {guests.dietarySummary.confirmedVegan + guests.dietarySummary.confirmedVegetarian} dietary
            </span>
          </div>
        </div>

        {/* Card 3: Run of show */}
        <div className="p-4 sm:p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span className="font-semibold text-xs text-stone-700 dark:text-stone-300">Run of show</span>
            <Clock className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-mono">
              {timeline.milestones.length} <span className="text-xs font-normal text-stone-500 font-sans">Milestones</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-stone-500 dark:text-stone-400 font-mono truncate max-w-[170px]" title={timeline.milestones[0]?.title}>
              Start {timeline.milestones[0]?.time || '14:00'}
            </span>
            <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[10px] font-bold text-stone-700 dark:text-stone-300 font-mono">
              {completedMilestones} Done
            </span>
          </div>
        </div>

        {/* Card 4: Adjust your plan */}
        <div className="p-4 sm:p-5 space-y-2 bg-stone-50/60 dark:bg-stone-950/40">
          <div className="flex items-center justify-between text-xs text-stone-700 dark:text-stone-300">
            <span className="font-semibold text-xs">Adjust your plan</span>
            <span className="text-[10px] text-stone-400 font-mono">Automatic ripple</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Guest Input */}
            <div className="flex-1 flex items-center bg-white dark:bg-stone-900 px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs shadow-2xs min-w-0">
              <label htmlFor="adjust-guests" className="sr-only">Guest Count</label>
              <Users className="w-3 h-3 text-stone-400 mr-1.5 shrink-0" />
              <input
                id="adjust-guests"
                type="number"
                min="10"
                max="5000"
                value={tempGuests}
                onChange={(e) => setTempGuests(parseInt(e.target.value) || 0)}
                className="w-full text-xs font-mono font-bold bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none min-w-0"
                title="Target guest headcount"
              />
              <button
                type="button"
                onClick={handleApplyGuestChange}
                disabled={tempGuests === currentEvent.guestCount}
                aria-label="Recalculate guest adaptive ripple"
                className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 disabled:opacity-25 hover:opacity-90 transition shrink-0 ml-1"
              >
                Ripple
              </button>
            </div>

            {/* Budget Input */}
            <div className="flex-1 flex items-center bg-white dark:bg-stone-900 px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs shadow-2xs min-w-0">
              <label htmlFor="adjust-budget" className="sr-only">Budget</label>
              <DollarSign className="w-3 h-3 text-stone-400 mr-1 shrink-0" />
              <input
                id="adjust-budget"
                type="number"
                step="1000"
                value={tempBudgetDollars}
                onChange={(e) => setTempBudgetDollars(parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-mono font-bold bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none min-w-0"
                title="Total budget ceiling in USD"
              />
              <button
                type="button"
                onClick={handleApplyBudgetChange}
                disabled={dollarsToCents(tempBudgetDollars) === currentEvent.budget.totalBudgetCents}
                aria-label="Recalculate capital ripple"
                className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 disabled:opacity-25 hover:opacity-90 transition shrink-0 ml-1"
              >
                Rebalance
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. PENDING ADAPTIVE ACTION BANNER (if a ripple is pending)
         ───────────────────────────────────────────────────────────── */}
      {pendingRipple && (
        <aside 
          aria-label="Pending Adaptive Review"
          className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                Needs review
              </span>
              <span className="text-xs font-bold text-amber-950 dark:text-amber-100">
                {pendingRipple.title}
              </span>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-1">
              {pendingRipple.impactSummary}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveRippleAlert(pendingRipple);
              setAdaptiveModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold rounded-lg text-white bg-amber-800 hover:bg-amber-900 dark:bg-amber-600 dark:hover:bg-amber-500 shadow-sm transition whitespace-nowrap self-start sm:self-center"
          >
            Review changes →
          </button>
        </aside>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. CREATIVE DIRECTION & CONNECTED WORKSPACES
          Clean moodboard layout: Paint chip swatches & atmosphere notes
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 COLS): Palette & Atmosphere */}
        <div className="lg:col-span-7 space-y-6">
          {/* Material Palette Swatch Board */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div>
                <h2 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
                  Color palette
                </h2>
                <p className="text-xs text-stone-500">Curated shades for decor, stationery, and florals</p>
              </div>
              <span className="text-[10px] text-stone-400 font-mono">
                Click to copy HEX
              </span>
            </div>

            {/* Vertical Paint-Chip Swatch Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {theme.colorPalette.map((color, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleCopyHex(color.hex)}
                  className="group rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 p-2 text-left transition-all hover:border-stone-400 dark:hover:border-stone-600 space-y-2"
                  aria-label={`Copy color ${color.name} ${color.hex}`}
                >
                  <div
                    className="w-full h-14 sm:h-16 rounded-lg shadow-2xs border border-black/10 group-hover:scale-[1.02] transition-transform duration-200"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate block">
                        {color.name}
                      </span>
                      {copiedHex === color.hex ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Copy className="w-3 h-3 text-stone-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono">
                      <span>{color.hex}</span>
                      <span className="capitalize text-[9px] px-1 rounded bg-stone-200/60 dark:bg-stone-700/60 text-stone-700 dark:text-stone-300">
                        {color.role}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Atmosphere & Directives Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dress Code */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1.5">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5 text-stone-500" /> Attire & dress code
              </span>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {theme.dressCode}
              </p>
            </div>

            {/* Scenography & Decor */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1.5">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-stone-500" /> Decor & florals
              </span>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {theme.decorStyle}
              </p>
            </div>

            {/* Lighting */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1.5">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-500" /> Lighting ambiance
              </span>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {theme.ambianceLighting}
              </p>
            </div>

            {/* Signature Drink */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1.5">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-stone-500" /> Signature service
              </span>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {theme.signatureDrink || 'Curated Champagne Toast & Vintage Cordials'}
              </p>
            </div>
          </div>

          {/* Centerpiece Concept */}
          {theme.centerpieceConcept && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                Table centerpieces
              </span>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-serif italic text-sm">
                "{theme.centerpieceConcept}"
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (5 COLS): Connected Modules */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
            <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
              <h2 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
                Connected planning tools
              </h2>
              <p className="text-xs text-stone-500">Direct shortcuts to event modules</p>
            </div>

            {/* Jump Link 1: Budget Ledger */}
            <button
              type="button"
              onClick={() => setActiveTab('budget')}
              className="w-full p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-stone-900 dark:hover:border-stone-100 bg-stone-50/50 dark:bg-stone-800/30 text-left transition group space-y-0.5 block"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-stone-500" />
                  Budget & expenses
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-1 transition" />
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {currentEvent.budget.allocations.length} allocations • {budget.expenses.length} logged expenses • 0-cent reconciliation
              </p>
            </button>

            {/* Jump Link 2: Run-of-Show */}
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className="w-full p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-stone-900 dark:hover:border-stone-100 bg-stone-50/50 dark:bg-stone-800/30 text-left transition group space-y-0.5 block"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-stone-500" />
                  Run of show
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-1 transition" />
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {timeline.milestones.length} milestones • Day-of execution mode
              </p>
            </button>

            {/* Jump Link 3: Guests & Seating */}
            <button
              type="button"
              onClick={() => setActiveTab('guests')}
              className="w-full p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-stone-900 dark:hover:border-stone-100 bg-stone-50/50 dark:bg-stone-800/30 text-left transition group space-y-0.5 block"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-stone-500" />
                  Guests & catering
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-1 transition" />
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {currentEvent.guestCount} target roster • Kitchen dietary notes • Seating
              </p>
            </button>

            {/* Jump Link 4: Creative Studio */}
            <button
              type="button"
              onClick={() => setActiveTab('creative')}
              className="w-full p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-stone-900 dark:hover:border-stone-100 bg-stone-50/50 dark:bg-stone-800/30 text-left transition group space-y-0.5 block"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-stone-500" />
                  Creative studio
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-1 transition" />
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Invitations, toast drafts, and playlist vibes
              </p>
            </button>

            {/* Jump Link 5: Vendor Coordination */}
            <button
              type="button"
              onClick={() => setActiveTab('vendors')}
              className="w-full p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-stone-900 dark:hover:border-stone-100 bg-stone-50/50 dark:bg-stone-800/30 text-left transition group space-y-0.5 block"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-stone-500" />
                  Vendors & RFPs
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-1 transition" />
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {currentEvent.vendors.categories.length} vendor categories • Inquiry email drafts
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
