import React, { useRef } from 'react';
import { Sparkles, CalendarPlus, Download, Upload, Printer, RefreshCw, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';

export const Header: React.FC = () => {
  const {
    currentEvent,
    systemMode,
    systemMessage,
    loadSampleEvent,
    setCreateModalOpen,
    exportEventJson,
    importEventJson,
    setAdaptiveModalOpen,
    setActiveRippleAlert,
  } = useEventStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const jsonStr = exportEventJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `celebr-ai-${currentEvent?.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'event'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importEventJson(content);
        if (res.success) {
          alert('Event data successfully imported!');
        } else {
          alert(res.error || 'Failed to import event. Invalid format.');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePrint = () => {
    window.print();
  };

  const pendingRipple = currentEvent?.pendingRipples.find((r) => r.status === 'pending_review');

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-fuchsia-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-700 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">
                  CelebrAI
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Intelligent Celebration & Event Architect
              </p>
            </div>
          </div>

          {/* Transparent System Operating Mode Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
            {systemMode === 'live' && (
              <>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Live AI Engine
                </span>
              </>
            )}
            {systemMode === 'offline' && (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Offline Planner
                </span>
              </>
            )}
            {systemMode === 'sample' && (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
                <span className="text-indigo-700 dark:text-indigo-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Sample Showcase
                </span>
              </>
            )}
            <span className="text-slate-400 dark:text-slate-500">|</span>
            <span className="text-slate-600 dark:text-slate-300 truncate max-w-xs" title={systemMessage}>
              {systemMessage}
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Adaptive Intelligence Alert Pill */}
            {pendingRipple && (
              <button
                type="button"
                onClick={() => {
                  setActiveRippleAlert(pendingRipple);
                  setAdaptiveModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800 animate-pulse hover:bg-amber-200"
                aria-label="Pending adaptive intelligence ripple alert"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Impact Alert</span>
              </button>
            )}

            {/* Load Sample Event */}
            <button
              type="button"
              onClick={loadSampleEvent}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Reset and load sample event"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sample Event</span>
            </button>

            {/* Print / Save PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Print or export Run-of-Show PDF"
              aria-label="Print or save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            {/* Export JSON */}
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Export event data to JSON"
              aria-label="Export event JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Export</span>
            </button>

            {/* Import JSON */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
              aria-label="Upload event JSON"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Import event data from JSON"
              aria-label="Import event JSON"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Import</span>
            </button>

            {/* New Event Button */}
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-brand-600 to-fuchsia-600 hover:from-brand-700 hover:to-fuchsia-700 shadow-sm transition"
              aria-label="Create new celebration plan"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Plan Event</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
