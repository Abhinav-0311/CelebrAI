import React, { useRef, useState } from 'react';
import { Download, Upload, RotateCcw, Plus } from 'lucide-react';
import { useEventStore, NavigationTab } from '../../store/eventStore';
import { CelebrAILogo } from './CelebrAILogo';
import { EngineStatus } from './EngineStatus';

export const Header: React.FC = () => {
  const { currentEvent, activeTab, loadSampleEvent, setCreateModalOpen, exportEventJson, importEventJson, storageRecoveryJson } = useEventStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState('');

  const downloadJson = (json: string, filename: string) => {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => downloadJson(
    exportEventJson(),
    `celebr-ai-${currentEvent?.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'event'}.json`,
  );

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onerror = () => setImportError('Could not read this file. Please choose it again.');
    reader.onload = () => {
      const result = importEventJson(String(reader.result ?? ''));
      if (result.success) alert('Event data successfully imported!');
      else setImportError(result.error || 'Invalid event file. Your current plan has been kept.');
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const tabLabels: Record<NavigationTab, string> = {
    overview: 'Overview', budget: 'Budget & Expenses', timeline: 'Run-of-Show', guests: 'Guests & Catering',
    creative: 'Creative Studio', vendors: 'Vendors & RFPs', intelligence: 'Adaptive Engine',
  };
  const actionClass = 'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors';

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-[#fbf6f1] dark:border-stone-800 dark:bg-stone-900">
      <span className="sr-only">CelebrAI workspace</span>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 lg:hidden"><span className="text-lg font-bold tracking-tight sm:hidden">Celebr<span className="text-brand-700">AI</span></span><div className="hidden sm:block"><CelebrAILogo /></div></div>
            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-sm font-medium" title={currentEvent?.title}>{currentEvent?.title || 'Your next celebration'}</p>
              <p className="text-xs text-stone-500">{tabLabels[activeTab]}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button type="button" onClick={handleExport} aria-label="Export event JSON" title="Export event JSON" className={actionClass} disabled={!currentEvent}>
              <Download aria-hidden="true" className="h-4 w-4" /><span className="hidden xl:inline">Export</span>
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Import event JSON" title="Import event JSON" className={actionClass}>
              <Upload aria-hidden="true" className="h-4 w-4" /><span className="hidden xl:inline">Import</span>
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" aria-label="Choose event JSON file" />
            <button type="button" onClick={loadSampleEvent} className={`${actionClass} hidden sm:inline-flex`} title="Reset to sample showcase event">
              <RotateCcw aria-hidden="true" className="h-4 w-4" /><span>Sample Event</span>
            </button>
            <button type="button" onClick={() => setCreateModalOpen(true)} aria-label="Create new celebration plan" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-brand-700 px-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800 dark:bg-stone-100 dark:text-stone-900">
              <Plus aria-hidden="true" className="hidden h-4 w-4 sm:block" /><span>Plan Event</span>
            </button>
          </div>
        </div>
        <div className="flex min-h-9 min-w-0 items-center justify-between gap-3 border-t border-stone-100 pb-1 lg:hidden dark:border-stone-800">
          <span className="min-w-0 truncate text-xs text-stone-600 dark:text-stone-300" title={currentEvent?.title}>{currentEvent?.title || 'Your next celebration'}</span>
          <span className="shrink-0"><EngineStatus /></span>
        </div>
        {storageRecoveryJson !== null && <div role="alert" className="pb-3 text-sm text-rose-700 dark:text-rose-300">
          <p>Your saved plan could not be restored. The original saved data is preserved for recovery.</p>
          <button type="button" onClick={() => downloadJson(storageRecoveryJson, 'celebr-ai-saved-data-recovery.json')} className="mt-1 min-h-11 underline underline-offset-4">Download saved data</button>
        </div>}
        {importError && <p role="alert" className="pb-3 text-sm text-rose-700 dark:text-rose-300">{importError}</p>}
      </div>
    </header>
  );
};
