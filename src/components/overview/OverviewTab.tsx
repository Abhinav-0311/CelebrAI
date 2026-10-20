import React, { useState } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  GlassWater, 
  Flower2, 
  SunMedium, 
  Shirt, 
  Copy, 
  Check, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { formatCurrency, dollarsToCents, centsToDollars } from '../../types/event';

export const OverviewTab: React.FC = () => {
  const { currentEvent, updateGuestCount, updateTotalBudgetCents, setActiveTab } = useEventStore();
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Local state for Quick-Adjust inputs
  const [tempGuests, setTempGuests] = useState<number>(currentEvent?.guestCount || 100);
  const [tempBudgetDollars, setTempBudgetDollars] = useState<number>(
    currentEvent ? centsToDollars(currentEvent.budget.totalBudgetCents) : 25000
  );

  if (!currentEvent) {
    return (
      <div className="text-center py-16">
        <Sparkles className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No event loaded</h3>
        <p className="text-xs text-slate-500 mt-1">Create a new celebration plan or load the sample event.</p>
      </div>
    );
  }

  const { theme, budget, guests, timeline } = currentEvent;

  // Quantitative metrics in integer cents
  const totalBudgetCents = budget.totalBudgetCents;
  const actualSpentCents = budget.allocations.reduce((sum, a) => sum + a.actualSpentCents, 0);
  const remainingCents = totalBudgetCents - actualSpentCents;
  const attendingCount = guests.dietarySummary.confirmedAttending;
  const completedMilestones = timeline.milestones.filter((m) => m.status === 'completed').length;

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

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Event Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {currentEvent.eventType.replace('_', ' ')}
            </span>
            <span className="px-3 py-1 text-[11px] font-semibold rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
              {currentEvent.venueType}
            </span>
            {currentEvent.appliedRipplesCount > 0 && (
              <span className="px-3 py-1 text-[11px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {currentEvent.appliedRipplesCount} Adaptive Diffs Applied
              </span>
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {currentEvent.title}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-brand-400" />
                {new Date(currentEvent.eventDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-400" />
                {currentEvent.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-brand-400" />
                {currentEvent.guestCount} Target Guests
              </span>
            </p>
          </div>

          {/* Vibe Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {currentEvent.vibeKeywords.map((vibe, idx) => (
              <span
                key={idx}
                className="text-xs px-2.5 py-0.5 rounded-md bg-white/10 text-slate-200 backdrop-blur-sm"
              >
                #{vibe}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Adaptive Quick-Adjust Bar */}
      <div className="bg-gradient-to-r from-amber-50 to-brand-50 dark:from-amber-950/20 dark:to-brand-950/20 rounded-2xl p-4 sm:p-5 border border-amber-200/80 dark:border-amber-900/40 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Adaptive Event Intelligence Quick-Adjust
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Change guests or budget to observe real-time ripple analysis across catering, seating, and vendor allocations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Guest Count Adjuster */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <Users className="w-4 h-4 text-slate-400" />
              <label htmlFor="adjust-guests" className="sr-only">Guest Count</label>
              <input
                id="adjust-guests"
                type="number"
                min="10"
                max="5000"
                value={tempGuests}
                onChange={(e) => setTempGuests(parseInt(e.target.value) || 0)}
                className="w-16 text-xs font-bold bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyGuestChange}
                disabled={tempGuests === currentEvent.guestCount}
                className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-600 text-white disabled:opacity-30 hover:bg-brand-700 transition"
              >
                Recalculate
              </button>
            </div>

            {/* Budget Adjuster */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <label htmlFor="adjust-budget" className="sr-only">Budget</label>
              <input
                id="adjust-budget"
                type="number"
                step="1000"
                value={tempBudgetDollars}
                onChange={(e) => setTempBudgetDollars(parseFloat(e.target.value) || 0)}
                className="w-20 text-xs font-bold bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyBudgetChange}
                disabled={dollarsToCents(tempBudgetDollars) === currentEvent.budget.totalBudgetCents}
                className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-600 text-white disabled:opacity-30 hover:bg-brand-700 transition"
              >
                Rebalance
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Total Budget Target</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
            {formatCurrency(totalBudgetCents, budget.currency)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {formatCurrency(remainingCents, budget.currency)} remaining
          </p>
        </div>

        {/* Committed Spend */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Actual Committed</span>
            <CheckCircle2 className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
            {formatCurrency(actualSpentCents, budget.currency)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {Math.round((actualSpentCents / totalBudgetCents) * 100)}% of total budget
          </p>
        </div>

        {/* Confirmed Guests */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Confirmed Attendees</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {attendingCount} / {currentEvent.guestCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {guests.dietarySummary.totalInvited} total invited
          </p>
        </div>

        {/* Milestones */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Run-of-Show Cues</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {completedMilestones} / {timeline.milestones.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Milestones executed
          </p>
        </div>
      </div>

      {/* Concept & Theme Showcase */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Celebration Concept Architecture
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {theme.conceptTitle}
            </h2>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
          {theme.conceptDescription}
        </p>

        {/* Color Palette Swatches */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Curated Color Harmonization (Click to Copy HEX)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {theme.colorPalette.map((color, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleCopyHex(color.hex)}
                className="group p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50 hover:border-brand-500 transition text-left space-y-2 relative"
                aria-label={`Copy color ${color.name} ${color.hex}`}
              >
                <div
                  className="w-full h-12 rounded-lg shadow-inner border border-black/5"
                  style={{ backgroundColor: color.hex }}
                />
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{color.name}</span>
                    {copiedHex === color.hex ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono">{color.hex}</span>
                    <span className="capitalize text-[10px] text-brand-600 dark:text-brand-400">{color.role}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Atmosphere & Styling Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Dress Code */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 shrink-0">
              <Shirt className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">Dress Code & Attire</h5>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{theme.dressCode}</p>
            </div>
          </div>

          {/* Decor Style */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 shrink-0">
              <Flower2 className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">Floral & Decor Styling</h5>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{theme.decorStyle}</p>
            </div>
          </div>

          {/* Ambiance Lighting */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 shrink-0">
              <SunMedium className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">Lighting & Ambiance</h5>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{theme.ambianceLighting}</p>
            </div>
          </div>

          {/* Signature Drink */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 shrink-0">
              <GlassWater className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">Signature Beverage</h5>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{theme.signatureDrink || 'Curated Champagne Toast'}</p>
            </div>
          </div>
        </div>

        {/* Centerpiece Concept */}
        {theme.centerpieceConcept && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
              Table Architecture & Centerpiece Concept
            </h5>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {theme.centerpieceConcept}
            </p>
          </div>
        )}
      </div>

      {/* Module Jump Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('budget')}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500 transition text-left group space-y-2 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Budget & Expenses</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Inspect minor-unit category splits, log actual payments, and monitor contingencies.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500 transition text-left group space-y-2 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Run-of-Show Timeline</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Minute-by-minute schedule from setup to teardown with Day-of live execution mode.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('creative')}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500 transition text-left group space-y-2 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">AI Creative Studio</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multi-tone invitation drafts, custom toast/speechwriter, and party games.
          </p>
        </button>
      </div>
    </div>
  );
};
