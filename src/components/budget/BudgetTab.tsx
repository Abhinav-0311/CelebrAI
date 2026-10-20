import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  ShieldCheck, 
  PieChart 
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { BudgetAllocation, formatCurrency, dollarsToCents } from '../../types/event';
import { computeFinancialSummary } from '../../services/eventAnalytics';

export const BudgetTab: React.FC = () => {
  const { currentEvent, addExpense, deleteExpense, toggleExpensePaid } = useEventStore();
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  const [newExpenseDollars, setNewExpenseDollars] = useState<{
    name: string;
    category: BudgetAllocation['category'];
    estimated: number;
    actual: number;
    vendor: string;
    isPaid: boolean;
    notes: string;
  }>({
    name: '',
    category: 'catering',
    estimated: 1000,
    actual: 1000,
    vendor: '',
    isPaid: false,
    notes: '',
  });

  if (!currentEvent) return null;

  const { budget } = currentEvent;
  const summary = computeFinancialSummary(budget);
  const {
    totalBudgetCents,
    totalAllocatedCents,
    totalCommittedCents,
    totalPaidCents,
    totalOutstandingCents,
    remainingHeadroomCents,
    isOverBudget,
  } = summary;

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseDollars.name || !newExpenseDollars.category) return;

    const matchedAlloc = budget.allocations.find((a) => a.category === newExpenseDollars.category);

    addExpense({
      allocationId: matchedAlloc ? matchedAlloc.id : 'alloc-custom',
      name: newExpenseDollars.name,
      category: newExpenseDollars.category,
      estimatedCents: dollarsToCents(Number(newExpenseDollars.estimated) || 0),
      actualCents: dollarsToCents(Number(newExpenseDollars.actual) || 0),
      vendor: newExpenseDollars.vendor || '',
      isPaid: Boolean(newExpenseDollars.isPaid),
      notes: newExpenseDollars.notes || '',
    });

    setNewExpenseDollars({
      name: '',
      category: 'catering',
      estimated: 500,
      actual: 500,
      vendor: '',
      isPaid: false,
      notes: '',
    });
    setIsAddExpenseOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Financial Architecture (Cents Precision)
              </span>
              {isOverBudget && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Budget Exceeded
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              Event Budget & Expense Engine
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deterministic allocation modeling with exact minor-unit reconciliation
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddExpenseOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Log Expense</span>
          </button>
        </div>

        {/* Quantitative Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500">Total Budget</span>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5 font-mono">
              {formatCurrency(totalBudgetCents, budget.currency)}
            </p>
            <span className="text-[10px] text-slate-400">Planned: {formatCurrency(totalAllocatedCents, budget.currency)}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500">Committed (All)</span>
            <p className={`text-lg font-bold mt-0.5 font-mono ${isOverBudget ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'}`}>
              {formatCurrency(totalCommittedCents, budget.currency)}
            </p>
            <span className="text-[10px] text-slate-400">{Math.round((totalCommittedCents / totalBudgetCents) * 100)}% of ceiling</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Paid Expenditures</span>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5 font-mono">
              {formatCurrency(totalPaidCents, budget.currency)}
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Settled invoices</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Outstanding</span>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5 font-mono">
              {formatCurrency(totalOutstandingCents, budget.currency)}
            </p>
            <span className="text-[10px] text-amber-600 dark:text-amber-400">Pending payment</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-500">Available Headroom</span>
            <p className={`text-lg font-bold mt-0.5 font-mono ${remainingHeadroomCents >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(remainingHeadroomCents, budget.currency)}
            </p>
            <span className="text-[10px] text-slate-400">Remaining variance</span>
          </div>
        </div>

        {/* Distribution Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5" /> Budget Utilization
            </span>
            <span>{Math.round((totalCommittedCents / totalBudgetCents) * 100)}% Committed</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            {budget.allocations.map((alloc) => {
              const widthPct = (alloc.allocatedCents / totalBudgetCents) * 100;
              return (
                <div
                  key={alloc.id}
                  style={{ width: `${widthPct}%` }}
                  title={`${alloc.name}: ${formatCurrency(alloc.allocatedCents, budget.currency)} (${alloc.percentage}%)`}
                  className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300 relative group border-r border-white/20 last:border-0"
                >
                  <div
                    className={`w-full h-full ${
                      alloc.category === 'catering'
                        ? 'bg-brand-500'
                        : alloc.category === 'venue'
                        ? 'bg-indigo-500'
                        : alloc.category === 'entertainment'
                        ? 'bg-amber-500'
                        : alloc.category === 'decor'
                        ? 'bg-emerald-500'
                        : alloc.category === 'photography'
                        ? 'bg-rose-500'
                        : 'bg-slate-400'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Allocations Cards */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Category Allocation Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budget.allocations.map((alloc) => {
            const spentPct = alloc.allocatedCents > 0 ? Math.round((alloc.actualSpentCents / alloc.allocatedCents) * 100) : 0;
            const isCategoryOver = alloc.actualSpentCents > alloc.allocatedCents;

            return (
              <div
                key={alloc.id}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 capitalize">
                    {alloc.name}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {alloc.percentage}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500">Allocated</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {formatCurrency(alloc.allocatedCents, budget.currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500">Committed</span>
                    <p className={`text-sm font-bold font-mono ${isCategoryOver ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                      {formatCurrency(alloc.actualSpentCents, budget.currency)}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCategoryOver ? 'bg-rose-500' : spentPct > 80 ? 'bg-amber-500' : 'bg-brand-600'
                      }`}
                      style={{ width: `${Math.min(100, spentPct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{spentPct}% utilized</span>
                    <span className={isCategoryOver ? 'text-rose-600 font-bold' : ''}>
                      {alloc.allocatedCents - alloc.actualSpentCents >= 0
                        ? `${formatCurrency(alloc.allocatedCents - alloc.actualSpentCents, budget.currency)} left`
                        : `-${formatCurrency(Math.abs(alloc.allocatedCents - alloc.actualSpentCents), budget.currency)} over`}
                    </span>
                  </div>
                </div>

                {isCategoryOver && (
                  <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-1.5 text-[11px] text-rose-700 dark:text-rose-300">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <span className="font-bold">Over Budget:</span> Exceeds allocation by {formatCurrency(alloc.actualSpentCents - alloc.allocatedCents, budget.currency)}.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Line-Item Expenses & Commitments ({budget.expenses.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track vendor invoices and settled transactions
            </p>
          </div>
        </div>

        {budget.expenses.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No expenses logged yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Click "Log Expense" above to add your first line item.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Expense Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Vendor</th>
                  <th className="py-2.5 px-3 text-right">Estimated</th>
                  <th className="py-2.5 px-3 text-right">Actual</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {budget.expenses.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() => toggleExpensePaid(item.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.isPaid
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                        title="Click to toggle paid status"
                      >
                        {item.isPaid ? <CheckCircle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                        {item.isPaid ? 'Paid' : 'Pending'}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-3 capitalize text-slate-600 dark:text-slate-400">
                      {item.category}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                      {item.vendor || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                      {formatCurrency(item.estimatedCents, budget.currency)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {formatCurrency(item.actualCents, budget.currency)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => deleteExpense(item.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded transition"
                        aria-label={`Delete expense ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isAddExpenseOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Log Event Expense
            </h3>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acoustic Audio Equipment Rental"
                  value={newExpenseDollars.name}
                  onChange={(e) => setNewExpenseDollars({ ...newExpenseDollars, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={newExpenseDollars.category}
                    onChange={(e) => setNewExpenseDollars({ ...newExpenseDollars, category: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    {budget.allocations.map((a) => (
                      <option key={a.id} value={a.category}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vendor / Payee
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sonic Sound Co"
                    value={newExpenseDollars.vendor}
                    onChange={(e) => setNewExpenseDollars({ ...newExpenseDollars, vendor: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estimated Cost ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newExpenseDollars.estimated}
                    onChange={(e) => setNewExpenseDollars({ ...newExpenseDollars, estimated: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Actual Cost ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newExpenseDollars.actual}
                    onChange={(e) => setNewExpenseDollars({ ...newExpenseDollars, actual: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is-paid-chk"
                  checked={newExpenseDollars.isPaid}
                  onChange={(e) => setNewExpenseDollars({ ...newExpenseDollars, isPaid: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="is-paid-chk" className="text-xs text-slate-700 dark:text-slate-300">
                  Payment already processed / settled
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
