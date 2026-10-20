import React, { useState } from 'react';
import { 
  Store, 
  CheckSquare, 
  Square, 
  Mail, 
  Copy, 
  Check, 
  DollarSign, 
  UserCheck 
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { formatCurrency } from '../../types/event';

export const VendorsTab: React.FC = () => {
  const { currentEvent, toggleVendorChecklist } = useEventStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!currentEvent) return null;

  const { vendors } = currentEvent;
  const categories = vendors.categories;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleOpenEmail = (vendorEmail: string | undefined, subject: string, body: string) => {
    const url = `mailto:${vendorEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          Supply Chain & Procurement
        </span>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
          Vendor Coordination & RFP Inquiry Drafts
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Actionable vendor checklists and automated RFP inquiry emails with your event parameters injected
        </p>
      </div>

      {/* Categories Grid */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const completedTasks = cat.checklist.filter((item) => item.isCompleted).length;
          const totalTasks = cat.checklist.length;
          const isAllDone = totalTasks > 0 && completedTasks === totalTasks;

          return (
            <div
              key={cat.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5"
            >
              {/* Category Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 capitalize">
                        {cat.name}
                      </h3>
                      {isAllDone && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Complete
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        Target: {formatCurrency(cat.recommendedBudgetCents, currentEvent.budget.currency)}
                      </span>
                      {cat.confirmedVendorName && (
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                          <UserCheck className="w-3.5 h-3.5 text-brand-600" />
                          {cat.confirmedVendorName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 self-start sm:self-auto">
                  {completedTasks} / {totalTasks} Tasks Done
                </div>
              </div>

              {/* Checklist & RFP Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Interactive Checklist */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                            ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-75'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-brand-500'
                        }`}
                      >
                        <span className="shrink-0 mt-0.5 text-brand-600 dark:text-brand-400">
                          {task.isCompleted ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                        </span>
                        <span
                          className={`text-xs ${
                            task.isCompleted
                              ? 'line-through text-slate-400'
                              : 'text-slate-700 dark:text-slate-200 font-medium'
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
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
                      <span>Automated Vendor RFP Inquiry Email</span>
                      <span className="text-[10px] text-brand-600 dark:text-brand-400 font-medium lowercase">
                        Ready to send
                      </span>
                    </h4>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                      {cat.inquiryDraft}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(cat.id, cat.inquiryDraft)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition"
                    >
                      {copiedId === cat.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition shadow-sm"
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
