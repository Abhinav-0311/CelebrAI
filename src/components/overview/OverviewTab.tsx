import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Clock, 
  GlassWater, 
  Flower2, 
  SunMedium, 
  Shirt, 
  Copy, 
  Check, 
  ArrowRight,
  TrendingUp,
  Sparkles,
  Layers,
  Sliders
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
      <div className="text-center py-24 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <CelebrAILogoIcon size="lg" className="mx-auto mb-4" />
        <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">No Event Loaded</h3>
        <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
          Create a bespoke celebration plan or load the curated sample showcase from the production desk.
        </p>
      </div>
    );
  }

  const { theme, budget, guests, timeline } = currentEvent;

  // PRIORITY 0 (BUG 1 FIX): Derive committed and paid spending strictly from the expense ledger!
  // A fresh event with expenses: [] will strictly show $0.00 committed and 100% available headroom.
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

  // Event-specific archetype aesthetic direction
  const getEventArchetype = (type: string) => {
    switch (type) {
      case 'wedding':
        return {
          label: 'Matrimonial Direction & Architecture',
          tag: 'Ceremony & Banquet',
          accent: '#be185d',
          paperBg: 'from-stone-950 via-rose-950/20 to-stone-950',
          badgeBg: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
        };
      case 'corporate_gala':
        return {
          label: 'Executive Assembly & Honors Direction',
          tag: 'Keynote & Honors',
          accent: '#d97706',
          paperBg: 'from-stone-950 via-amber-950/20 to-stone-950',
          badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
        };
      case 'anniversary':
        return {
          label: 'Jubilee Milestone & Legacy Direction',
          tag: 'Heritage & Toast',
          accent: '#059669',
          paperBg: 'from-stone-950 via-emerald-950/20 to-stone-950',
          badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        };
      case 'birthday':
        return {
          label: 'Milestone Revelry & Sound Direction',
          tag: 'Soirée & Music',
          accent: '#7c3aed',
          paperBg: 'from-stone-950 via-purple-950/20 to-stone-950',
          badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
        };
      default:
        return {
          label: `${type.replace('_', ' ').toUpperCase()} DIRECTION`,
          tag: 'Production Architecture',
          accent: '#4f46e5',
          paperBg: 'from-stone-950 via-indigo-950/20 to-stone-950',
          badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
        };
    }
  };

  const archetype = getEventArchetype(currentEvent.eventType);
  const pendingRipple = currentEvent.pendingRipples.find((r) => r.status === 'pending_review');

  return (
    <div className="space-y-6 animate-fadeIn pb-16 font-sans">
      {/* ─────────────────────────────────────────────────────────────
          1. THE EVENT ATELIER POSTER HERO
          Visual editorial broadsheet adapting dynamically to event category
         ───────────────────────────────────────────────────────────── */}
      <section 
        aria-label="Event Poster"
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${archetype.paperBg} text-stone-100 p-6 sm:p-10 shadow-2xl border border-stone-800/80 transition-all`}
      >
        {/* Subtle architectural grid rule lines */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 space-y-6">
          {/* Top Atelier Metadata Line */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-stone-800/60 pb-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold text-stone-400">
                ATELIER DOSSIER • {currentEvent.id.toUpperCase()}
              </span>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${archetype.badgeBg}`}>
                {archetype.tag}
              </span>
            </div>

            {/* Operating Mode Pill */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900/90 border border-stone-700/80 text-[11px] font-medium text-stone-300 shadow-xs">
              {systemMode === 'live' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-[10px] uppercase font-semibold text-emerald-300">
                    Live AI • {currentEvent.theme.conceptTitle ? 'Custom Model' : 'Gemini'}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="font-mono text-[10px] uppercase font-semibold text-amber-300">
                    Deterministic Domain Engine
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Dramatic Typographic Title */}
          <div className="space-y-3 max-w-4xl">
            <span className="text-[11px] font-mono tracking-widest text-stone-400 uppercase">
              {archetype.label}
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight text-stone-50 leading-[1.08] text-balance">
              {currentEvent.title}
            </h1>
          </div>

          {/* Event Concept Narrative Manifesto */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/70 border border-stone-800/90 backdrop-blur-md space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                Artistic Direction Statement
              </span>
              <span className="text-stone-600">•</span>
              <span className="text-xs font-semibold text-stone-300 font-serif italic">
                "{theme.conceptTitle}"
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-3xl">
              {theme.conceptDescription}
            </p>
          </div>

          {/* Production Coordinates Bar */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1 text-xs text-stone-300 border-t border-stone-800/60 pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
              <span className="font-medium">
                {new Date(currentEvent.eventDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
              <span>{currentEvent.location}</span>
              <span className="text-stone-600">•</span>
              <span className="capitalize text-stone-400 font-mono text-[11px]">{currentEvent.venueType}</span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-stone-400 shrink-0" />
              <span className="font-semibold text-stone-100">{currentEvent.guestCount} Target Guests</span>
              <span className="text-stone-500 font-mono text-[11px]">({targetTables} tables)</span>
            </div>

            {/* Vibe Tags */}
            <div className="flex flex-wrap items-center gap-1.5 ml-auto">
              {currentEvent.vibeKeywords.map((vibe, idx) => (
                <span
                  key={idx}
                  className="text-[10.5px] px-2.5 py-0.5 rounded-full bg-stone-800/80 text-stone-300 border border-stone-700/60 font-medium"
                >
                  #{vibe}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. LINEAR-INSPIRED COMPACT OPERATIONAL STRIP
          Focused, high-density, mathematical precision controls
         ───────────────────────────────────────────────────────────── */}
      <section 
        aria-label="Operational Metrics & Quick Adjust"
        className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm divide-y lg:divide-y-0 lg:divide-x divide-stone-200 dark:divide-stone-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* Metric 1: Budget Capital */}
        <div className="p-4 sm:p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider">Financial Capital</span>
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

        {/* Metric 2: Attendance & Floor Architecture */}
        <div className="p-4 sm:p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider">Attendance & Floor</span>
            <Users className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {attendingCount} <span className="text-sm font-normal text-stone-500 font-mono">/ {currentEvent.guestCount} confirmed</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-stone-500 dark:text-stone-400 font-mono">
              {targetTables} Tables ({guests.targetTableCapacity} seats/table)
            </span>
            <span className="text-[10.5px] font-semibold text-stone-600 dark:text-stone-300">
              {guests.dietarySummary.confirmedVegan + guests.dietarySummary.confirmedVegetarian} dietary flags
            </span>
          </div>
        </div>

        {/* Metric 3: Production Cues & Run-of-Show */}
        <div className="p-4 sm:p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider">Production Schedule</span>
            <Clock className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-mono">
              {timeline.milestones.length} <span className="text-sm font-normal text-stone-500 font-sans">Milestone Cues</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-stone-500 dark:text-stone-400 font-mono">
              Load-in {timeline.milestones[0]?.time || '14:00'} → Wrap {timeline.milestones[timeline.milestones.length - 1]?.time || '22:00'}
            </span>
            <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[10px] font-bold text-stone-700 dark:text-stone-300">
              {completedMilestones} Done
            </span>
          </div>
        </div>

        {/* Metric 4: Atelier Quick-Adjust Controls */}
        <div className="p-4 sm:p-5 space-y-2.5 bg-stone-50/50 dark:bg-stone-950/40">
          <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <Sliders className="w-3.5 h-3.5" /> Adaptive Sandbox
            </span>
            <span className="text-[10px] text-stone-400 font-mono">Ripple Engine</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Guest Input */}
            <div className="flex-1 flex items-center bg-white dark:bg-stone-800 px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs shadow-2xs">
              <label htmlFor="adjust-guests" className="sr-only">Guest Count</label>
              <Users className="w-3 h-3 text-stone-400 mr-1.5 shrink-0" />
              <input
                id="adjust-guests"
                type="number"
                min="10"
                max="5000"
                value={tempGuests}
                onChange={(e) => setTempGuests(parseInt(e.target.value) || 0)}
                className="w-full text-xs font-mono font-bold bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none"
                title="Target guest headcount"
              />
              <button
                type="button"
                onClick={handleApplyGuestChange}
                disabled={tempGuests === currentEvent.guestCount}
                aria-label="Recalculate guest adaptive ripple"
                className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 disabled:opacity-20 hover:opacity-90 transition shrink-0 ml-1"
              >
                Ripple
              </button>
            </div>

            {/* Budget Input */}
            <div className="flex-1 flex items-center bg-white dark:bg-stone-800 px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs shadow-2xs">
              <label htmlFor="adjust-budget" className="sr-only">Budget</label>
              <DollarSign className="w-3 h-3 text-stone-400 mr-1 shrink-0" />
              <input
                id="adjust-budget"
                type="number"
                step="1000"
                value={tempBudgetDollars}
                onChange={(e) => setTempBudgetDollars(parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-mono font-bold bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none"
                title="Total budget ceiling in USD"
              />
              <button
                type="button"
                onClick={handleApplyBudgetChange}
                disabled={dollarsToCents(tempBudgetDollars) === currentEvent.budget.totalBudgetCents}
                className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 disabled:opacity-20 hover:opacity-90 transition shrink-0 ml-1"
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
          className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400">
                  Decision Pending
                </span>
                <span className="text-xs font-bold text-amber-950 dark:text-amber-100">
                  {pendingRipple.title}
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
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
            className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 shadow-sm transition whitespace-nowrap self-start sm:self-center"
          >
            Review Adaptive Diff →
          </button>
        </aside>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. MILANOTE-STYLE ASYMMETRICAL CREATIVE ATELIER
          Curated moodboard layout: Paint chip swatches & scenography notes
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 COLS): Visual Palette & Scenography Directives */}
        <div className="lg:col-span-7 space-y-6">
          {/* Material Palette Swatch Board */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400 font-bold">
                  Material Palette
                </span>
                <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
                  Harmonized Color Swatches
                </h3>
              </div>
              <span className="text-[11px] text-stone-400 font-mono">
                Click chip to copy HEX
              </span>
            </div>

            {/* Vertical Paint-Chip Swatch Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {theme.colorPalette.map((color, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleCopyHex(color.hex)}
                  className="group rounded-2xl border border-stone-200 dark:border-stone-700/80 bg-stone-50 dark:bg-stone-800/60 p-2.5 text-left transition-all hover:border-stone-900 dark:hover:border-stone-100 hover:shadow-md relative space-y-2"
                  aria-label={`Copy color ${color.name} ${color.hex}`}
                >
                  <div
                    className="w-full h-16 sm:h-20 rounded-xl shadow-xs border border-black/10 group-hover:scale-[1.02] transition-transform duration-200"
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
                        <Copy className="w-3.5 h-3.5 text-stone-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono">
                      <span>{color.hex}</span>
                      <span className="capitalize text-[9px] px-1 py-0.2 rounded bg-stone-200/60 dark:bg-stone-700/60 text-stone-700 dark:text-stone-300">
                        {color.role}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Scenography & Environmental Directives Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dress Code */}
            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-stone-400">
                <Shirt className="w-4 h-4 text-stone-500" />
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
                  Attire Protocol
                </span>
              </div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                Dress Code & Styling
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {theme.dressCode}
              </p>
            </div>

            {/* Floral & Decor */}
            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-stone-400">
                <Flower2 className="w-4 h-4 text-stone-500" />
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
                  Floral & Materiality
                </span>
              </div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                Scenography & Decor
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {theme.decorStyle}
              </p>
            </div>

            {/* Ambiance Lighting */}
            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-stone-400">
                <SunMedium className="w-4 h-4 text-stone-500" />
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
                  Luminescence
                </span>
              </div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                Lighting Architecture
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {theme.ambianceLighting}
              </p>
            </div>

            {/* Signature Beverage */}
            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-stone-400">
                <GlassWater className="w-4 h-4 text-stone-500" />
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
                  Mixology Craft
                </span>
              </div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                Signature Service
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {theme.signatureDrink || 'Curated Champagne Toast & Vintage Cordials'}
              </p>
            </div>
          </div>

          {/* Table Architecture / Centerpiece */}
          {theme.centerpieceConcept && (
            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400 font-bold block">
                Table Architecture & Centerpiece Direction
              </span>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-serif italic text-sm">
                "{theme.centerpieceConcept}"
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (5 COLS): Directives & Production Modules */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400 font-bold">
                Production Stages
              </span>
              <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
                Connected Atelier Workspaces
              </h3>
            </div>

            {/* Jump Link 1: Budget Ledger */}
            <button
              type="button"
              onClick={() => setActiveTab('budget')}
              className="w-full p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-stone-900 dark:hover:border-stone-100 bg-stone-50/60 dark:bg-stone-800/40 text-left transition group space-y-1 block"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 font-serif flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-stone-500" />
                  Financial Ledger & Splits
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-1 transition" />
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {currentEvent.budget.allocations.length} allocations • {budget.expenses.length} logged invoices • Exact minor-unit accounting
              </p>
            </button>

            {/* Jump Link 2: Run-of-Show */}
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className="w-full p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-stone-900 dark:hover:border-stone-100 bg-stone-50/60 dark:bg-stone-800/40 text-left transition group space-y-1 block"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 font-serif flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-stone-500" />
                  Run-of-Show Schedule
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-1 transition" />
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {timeline.milestones.length} sequential cues • Load-in to teardown • Interactive Day-of execution
              </p>
            </button>

            {/* Jump Link 3: Guests & Seating */}
            <button
              type="button"
              onClick={() => setActiveTab('guests')}
              className="w-full p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-stone-900 dark:hover:border-stone-100 bg-stone-50/60 dark:bg-stone-800/40 text-left transition group space-y-1 block"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 font-serif flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-stone-500" />
                  Guest Directory & Dietary
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-1 transition" />
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {currentEvent.guestCount} target roster • Kitchen dietary breakdown • Floor table assignments
              </p>
            </button>

            {/* Jump Link 4: Creative Studio */}
            <button
              type="button"
              onClick={() => setActiveTab('creative')}
              className="w-full p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-stone-900 dark:hover:border-stone-100 bg-stone-50/60 dark:bg-stone-800/40 text-left transition group space-y-1 block"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 font-serif flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-stone-500" />
                  Stationery & Toast Studio
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-1 transition" />
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {currentEvent.creative.invitations.length} invitation drafts • Keynote speechwriter • Playlist curation
              </p>
            </button>

            {/* Jump Link 5: Vendor Coordination */}
            <button
              type="button"
              onClick={() => setActiveTab('vendors')}
              className="w-full p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-stone-900 dark:hover:border-stone-100 bg-stone-50/60 dark:bg-stone-800/40 text-left transition group space-y-1 block"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 font-serif flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-stone-500" />
                  Vendor Coordination & RFPs
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-1 transition" />
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {currentEvent.vendors.categories.length} provider categories • Actionable checklists • Pre-drafted inquiry emails
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
