import React, { useRef, useState } from 'react';
import { 
  Sparkles, 
  CalendarPlus, 
  Download, 
  Upload, 
  Printer, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  Zap,
  MoreVertical
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { CelebrAILogo } from './CelebrAILogo';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleExport = () => {
    const jsonStr = exportEventJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `celebr-ai-${currentEvent?.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'event'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsMobileMenuOpen(false);
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
    setIsMobileMenuOpen(false);
  };

  const handlePrint = () => {
    setIsMobileMenuOpen(false);
    window.print();
  };

  const pendingRipple = currentEvent?.pendingRipples.find((r) => r.status === 'pending_review');

  return (
    <header className="bg-white dark:bg-stone-950 border-b border-stone-200 dark:border-stone-850 sticky top-0 z-40 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <CelebrAILogo />

          {/* Transparent System Operating Mode Badge */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300">
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
                <span className="inline-block w-2 h-2 rounded-full bg-stone-400 dark:bg-stone-500"></span>
                <span className="text-stone-800 dark:text-stone-200 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Sample Showcase
                </span>
              </>
            )}
            <span className="text-stone-300 dark:text-stone-700">|</span>
            <span className="text-stone-500 dark:text-stone-400 truncate max-w-xs font-sans text-xs" title={systemMessage}>
              {systemMessage}
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Adaptive Intelligence Alert Pill */}
            {pendingRipple && (
              <button
                type="button"
                onClick={() => {
                  setActiveRippleAlert(pendingRipple);
                  setAdaptiveModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800 animate-pulse hover:bg-amber-200 transition"
                aria-label="Pending adaptive intelligence ripple alert"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="hidden sm:inline font-mono text-[11px] uppercase">Review Impact</span>
                <span className="sm:hidden text-[10px] font-mono">Alert</span>
              </button>
            )}

            {/* Desktop-only Action Buttons */}
            <div className="hidden sm:flex items-center gap-1.5 font-sans">
              {/* Load Sample Event */}
              <button
                type="button"
                onClick={loadSampleEvent}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-stone-200 dark:hover:bg-stone-800 transition"
                title="Reset and load sample event"
              >
                <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
                <span>Sample Event</span>
              </button>

              {/* Print / Save PDF */}
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-stone-200 dark:hover:bg-stone-800 transition"
                title="Print or export Run-of-Show PDF"
                aria-label="Print or save as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden md:inline">Print</span>
              </button>

              {/* Export JSON */}
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-stone-200 dark:hover:bg-stone-800 transition"
                title="Export event data to JSON"
                aria-label="Export event JSON"
              >
                <Download className="w-3.5 h-3.5 text-stone-500" />
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-stone-200 dark:hover:bg-stone-800 transition"
                title="Import event data from JSON"
                aria-label="Import event JSON"
              >
                <Upload className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden md:inline">Import</span>
              </button>
            </div>

            {/* Mobile Actions: Export Icon Button (always accessible) */}
            <button
              type="button"
              onClick={handleExport}
              className="sm:hidden inline-flex items-center justify-center p-2 rounded-lg text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-stone-200 transition"
              title="Export event JSON"
              aria-label="Export event JSON"
            >
              <Download className="w-4 h-4 text-stone-500" />
            </button>

            {/* Mobile Tools Menu Button */}
            <div className="relative sm:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-stone-200 transition"
                title="More event actions"
                aria-label="More event actions"
              >
                <MoreVertical className="w-4 h-4 text-stone-500" />
              </button>

              {isMobileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-stone-900 rounded-xl shadow-xl border border-stone-200 dark:border-stone-800 py-1.5 z-50 animate-fadeIn text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2 text-stone-700 dark:text-stone-300"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="w-full text-left px-3.5 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2 text-stone-700 dark:text-stone-300"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Run-of-Show</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      loadSampleEvent();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2 text-stone-700 dark:text-stone-300"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Sample Event</span>
                  </button>
                </div>
              )}
            </div>

            {/* Primary Action: Plan Event Button (Refined Editorial Style) */}
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold rounded-lg text-stone-50 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200 border border-stone-800 dark:border-stone-200 shadow-sm transition shrink-0"
              aria-label="Create new celebration plan"
            >
              <CalendarPlus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Plan Event</span>
              <span className="sm:hidden">Plan</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
