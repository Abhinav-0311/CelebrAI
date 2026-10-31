import React, { useState } from 'react';
import { 
  Store, 
  CheckSquare, 
  Square, 
  Mail, 
  Copy, 
  Check, 
  DollarSign, 
  UserCheck,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { formatCurrency } from '../../types/event';

export const VendorsTab: React.FC = () => {
  const { 
    currentEvent, 
    toggleVendorChecklist,
    dismissVendorReview,
    syncVendorDraftHeadcount 
  } = useEventStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyError, setCopyError] = useState('');

  if (!currentEvent) return null;

  const { vendors } = currentEvent;
  const categories = vendors.categories;

  const handleCopy = async (id: string, text: string) => {
    setCopyError('');
    setCopiedId(null);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setCopyError('Could not copy. Select the draft and copy it manually, or allow clipboard access.');
    }
  };

  const handleOpenEmail = (vendorEmail: string | undefined, subject: string, body: string) => {
    const url = `mailto:${vendorEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#C5A869] font-bold">
          Supply Chain & Procurement
        </span>
        <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
          Vendor Coordination & RFP Inquiry Drafts
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Actionable vendor checklists and automated RFP inquiry emails with your event parameters injected
        </p>
      </div>

      {copyError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{copyError}</p>}

      {/* Categories Grid */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const completedTasks = cat.checklist.filter((item) => item.isCompleted).length;
          const totalTasks = cat.checklist.length;
          const isAllDone = totalTasks > 0 && completedTasks === totalTasks;

          return (
            <div
              key={cat.id}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 space-y-5"
            >
              {/* Category Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-[#C5A869]">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100 capitalize">
                        {cat.name}
                      </h3>
                      {isAllDone && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono">
                          Complete
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <DollarSign className="w-3.5 h-3.5 text-[#C5A869]" />
                        Target: {formatCurrency(cat.recommendedBudgetCents, currentEvent.budget.currency)}
                      </span>
                      {cat.confirmedVendorName && (
                        <span className="flex items-center gap-1 text-stone-700 dark:text-stone-300 font-semibold font-serif">
                          <UserCheck className="w-3.5 h-3.5 text-[#C5A869]" />
                          {cat.confirmedVendorName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-xs font-semibold px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 self-start sm:self-auto font-mono">
                  {completedTasks} / {totalTasks} Tasks Done
                </div>
              </div>

              {/* Adaptive Needs Review Flag */}
              {cat.needsReview && (
                <div
                  role="status"
                  className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn"
                >
                  <div className="flex items-start sm:items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                    <div>
                      <span className="font-bold">Adaptive Parameter Update: </span>
                      <span>{cat.reviewReason || 'Event parameters have changed. Please verify inquiry content.'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {(cat.category === 'catering' || cat.category === 'venue') && (
                      <button
                        type="button"
                        onClick={() => syncVendorDraftHeadcount(cat.id, currentEvent.guestCount)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 hover:bg-amber-300 transition flex items-center gap-1 font-mono"
                        title={`Sync inquiry draft to reference ${currentEvent.guestCount} guests`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Update to {currentEvent.guestCount} Guests</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => dismissVendorReview(cat.id)}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
                    >
                      Mark Reviewed
                    </button>
                  </div>
                </div>
              )}

              {/* Checklist & RFP Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Interactive Checklist */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Vendor Checklist & Deliverables
                  </h4>
                  <div className="space-y-2">
                    {cat.checklist.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => toggleVendorChecklist(cat.id, task.id)}
                        className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 ${
                          task.isCompleted
                            ? 'bg-stone-50 dark:bg-stone-850/40 border-stone-200 dark:border-stone-800 opacity-75'
                            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-[#C5A869]'
                        }`}
                      >
                        <span className="shrink-0 mt-0.5 text-[#C5A869]">
                          {task.isCompleted ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-stone-400" />}
                        </span>
                        <span
                          className={`text-xs ${
                            task.isCompleted
                              ? 'line-through text-stone-400'
                              : 'text-stone-700 dark:text-stone-200 font-medium'
                          }`}
                        >
                          {task.task}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* RFP Inquiry Draft */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2 flex items-center justify-between">
                      <span>Automated Vendor RFP Inquiry Email</span>
                      {cat.needsReview ? (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 font-mono">
                          Review Required
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#C5A869] font-medium font-mono">
                          Ready to send
                        </span>
                      )}
                    </h4>
                    <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-850/60 border border-stone-200 dark:border-stone-750 text-xs text-stone-700 dark:text-stone-300 font-mono whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                      {cat.inquiryDraft}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(cat.id, cat.inquiryDraft)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 transition"
                    >
                      {copiedId === cat.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
                      <span>{copiedId === cat.id ? 'Copied!' : 'Copy Email'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleOpenEmail(
                          cat.contactEmail,
                          `Inquiry: ${currentEvent.title} (${currentEvent.eventDate})`,
                          cat.inquiryDraft
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:opacity-90 transition shadow-sm"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Open in Mail</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
