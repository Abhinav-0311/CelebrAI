import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, AlertCircle, Search } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { BudgetAllocation, formatCurrency, dollarsToCents } from '../../types/event';
import { computeFinancialSummary } from '../../services/eventAnalytics';

export const BudgetTab: React.FC = () => {
  const { currentEvent, addExpense, deleteExpense, toggleExpensePaid } = useEventStore();
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const logButtonRef = useRef<HTMLButtonElement>(null);
  const [newExpense, setNewExpense] = useState({
    name: '', category: 'catering' as BudgetAllocation['category'], estimated: 1000, actual: 1000, vendor: '', isPaid: false,
  });

  useEffect(() => {
    if (!isAddExpenseOpen) return;
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      logButtonRef.current?.focus();
    };
  }, [isAddExpenseOpen]);

  if (!currentEvent) return null;
  const { budget } = currentEvent;
  const summary = computeFinancialSummary(budget);
  const { totalBudgetCents, totalAllocatedCents, totalCommittedCents, totalPaidCents, totalOutstandingCents, remainingHeadroomCents, isOverBudget } = summary;
  const committedPercent = totalBudgetCents > 0 ? Math.round(totalCommittedCents / totalBudgetCents * 100) : 0;
  const overCategories = budget.allocations.filter(item => item.actualSpentCents > item.allocatedCents);
  const filteredExpenses = budget.expenses.filter(item =>
    (categoryFilter === 'all' || item.category === categoryFilter) &&
    `${item.name} ${item.vendor || ''}`.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );
  const handleAddExpenseSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const allocation = budget.allocations.find(item => item.category === newExpense.category);
    if (!newExpense.name.trim() || !allocation || !Number.isFinite(newExpense.estimated) || !Number.isFinite(newExpense.actual) || newExpense.estimated < 0 || newExpense.actual < 0) return;
    addExpense({
      allocationId: allocation.id, name: newExpense.name.trim(), category: newExpense.category,
      estimatedCents: dollarsToCents(newExpense.estimated), actualCents: dollarsToCents(newExpense.actual),
      vendor: newExpense.vendor.trim(), isPaid: newExpense.isPaid, notes: '',
    });
    setNewExpense({ name: '', category: 'catering', estimated: 500, actual: 500, vendor: '', isPaid: false });
    setIsAddExpenseOpen(false);
  };
  const inputClass = 'min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100';

  return (
    <div className="workspace space-y-6 sm:space-y-8 pb-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Budget & Spending Ledger</h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">Track commitments, payments and what you have left to spend.</p>
        </div>
        <button ref={logButtonRef} type="button" onClick={() => {
          setNewExpense(value => ({...value, category: budget.allocations.some(item => item.category === value.category) ? value.category : budget.allocations[0]?.category || 'catering'}));
          setIsAddExpenseOpen(true);
        }} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 dark:bg-stone-100 dark:text-stone-900">
          <Plus aria-hidden="true" className="h-4 w-4" />Log Expense
        </button>
      </div>

      <section aria-label="Budget summary" className="space-y-4 border-y border-stone-200 py-5 dark:border-stone-800">
        <dl className="grid grid-cols-6 gap-x-3 gap-y-4 sm:grid-cols-3 xl:grid-cols-5">
          {[
            ['Total budget', totalBudgetCents], [isOverBudget ? 'Over budget' : 'Available', Math.abs(remainingHeadroomCents)],
            ['Committed', totalCommittedCents], ['Paid', totalPaidCents], ['Outstanding', totalOutstandingCents],
          ].map(([label, value], index) => (
            <div key={label} className={`${index < 2 ? 'col-span-3' : 'col-span-2'} min-w-0 sm:col-span-1`}>
              <dt className="text-xs font-medium text-stone-600 dark:text-stone-400">{label}</dt>
              <dd className={`mt-1.5 font-display text-xl font-medium tracking-[-0.02em] tabular-nums [overflow-wrap:anywhere] sm:text-2xl ${label === 'Over budget' ? 'text-rose-700 dark:text-rose-300' : ''}`}>{formatCurrency(Number(value), budget.currency)}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-stone-600 dark:text-stone-400">
          <progress aria-label="Budget committed" max={100} value={Math.min(100, committedPercent)} className="h-1.5 w-28 accent-stone-800 dark:accent-stone-200" />
          <span>{committedPercent}% committed · {formatCurrency(totalAllocatedCents, budget.currency)} allocated</span>
          {overCategories.length > 0 && <a href="#budget-allocations" className="inline-flex items-center gap-1.5 text-rose-700 underline underline-offset-4 dark:text-rose-300"><AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />{overCategories.length} {overCategories.length === 1 ? 'category' : 'categories'} over allocation</a>}
        </div>
        {isOverBudget && <p role="status" className="text-sm font-medium text-rose-700 dark:text-rose-300">Committed expenses exceed the total budget by {formatCurrency(Math.abs(remainingHeadroomCents), budget.currency)}. Review your ledger before adding commitments.</p>}
      </section>

      <section aria-labelledby="ledger-title" className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <div className="space-y-4 border-b border-stone-200 p-5 sm:p-6 dark:border-stone-800">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="ledger-title" className="section-title">Expense ledger <span className="font-normal text-stone-500">({budget.expenses.length})</span></h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search aria-hidden="true" className="absolute left-3 top-3.5 h-4 w-4 text-stone-500" />
              <input type="search" aria-label="Search expense ledger" placeholder="Search ledger..." value={searchQuery} onChange={event => setSearchQuery(event.target.value)} className={`${inputClass} pl-10`} />
            </div>
            <select aria-label="Filter expenses by category" value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} className={`${inputClass} sm:w-56`}>
              <option value="all">All Categories</option>
              {budget.allocations.map(allocation => <option key={allocation.id} value={allocation.category}>{allocation.name}</option>)}
            </select>
          </div>
        </div>
        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-sm">
            <p className="font-medium">{budget.expenses.length ? 'No matching expenses' : 'No expenses recorded'}</p>
            <p className="mt-2 text-stone-600 dark:text-stone-400">{budget.expenses.length ? 'Try another description, vendor or category.' : 'Log your first expense when you have a quote or commitment.'}</p>
            {budget.expenses.length > 0 && <button type="button" className="mt-3 min-h-11 underline underline-offset-4" onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }}>Clear filters</button>}
          </div>
        ) : (
          <table className="block w-full text-left text-sm xl:table">
            <caption className="sr-only">Event expenses, estimated and committed costs, and payment status</caption>
            <thead className="hidden bg-stone-50 text-xs text-stone-600 xl:table-header-group dark:bg-stone-950 dark:text-stone-400">
              <tr><th scope="col" className="px-6 py-4">Expense / vendor</th><th scope="col" className="px-6 py-4">Category</th><th scope="col" className="px-6 py-4 text-right">Estimated</th><th scope="col" className="px-6 py-4 text-right">Committed</th><th scope="col" className="px-6 py-4">Payment</th><th scope="col" className="px-6 py-4"><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody className="block divide-y divide-stone-200 xl:table-row-group dark:divide-stone-800">
              {filteredExpenses.map(item => (
                <tr key={item.id} className="grid grid-cols-2 gap-4 p-5 xl:table-row xl:p-0">
                  <td className="col-span-2 block min-w-0 xl:table-cell xl:px-6 xl:py-4"><p className="font-medium">{item.name}</p><p className="mt-1 text-xs text-stone-500">{item.vendor || 'No vendor assigned'}</p></td>
                  <td className="col-span-2 block text-stone-600 xl:table-cell xl:px-6 xl:py-4 dark:text-stone-400">{budget.allocations.find(allocation => allocation.category === item.category)?.name || item.category}</td>
                  <td className="block tabular-nums xl:table-cell xl:px-6 xl:py-4 xl:text-right"><span className="mb-1 block text-xs text-stone-500 xl:hidden">Estimated</span>{formatCurrency(item.estimatedCents, budget.currency)}</td>
                  <td className="block font-medium tabular-nums xl:table-cell xl:px-6 xl:py-4 xl:text-right"><span className="mb-1 block text-xs font-normal text-stone-500 xl:hidden">Committed</span>{formatCurrency(item.actualCents, budget.currency)}</td>
                  <td className="block xl:table-cell xl:px-6 xl:py-4"><button type="button" onClick={() => toggleExpensePaid(item.id)} aria-label={`Mark ${item.name} as ${item.isPaid ? 'unpaid' : 'paid'}`} className={`min-h-11 rounded-lg px-3 text-xs font-medium ${item.isPaid ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200'}`}>{item.isPaid ? 'Paid' : 'Pending'}</button></td>
                  <td className="block text-right xl:table-cell xl:p-2"><button type="button" onClick={() => deleteExpense(item.id)} aria-label={`Delete expense ${item.name}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-stone-800"><Trash2 aria-hidden="true" className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section id="budget-allocations" aria-labelledby="allocations-title" className="scroll-mt-32 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 id="allocations-title" className="section-title">Category Allocation Breakdown</h2><p className="text-sm text-stone-600 dark:text-stone-400">Planned amounts compared with commitments</p></div>
        <div className="divide-y divide-stone-200 dark:divide-stone-800">
          {budget.allocations.map(allocation => {
            const balance = allocation.allocatedCents - allocation.actualSpentCents;
            return <div key={allocation.id} className="grid grid-cols-2 items-center gap-3 py-4 sm:grid-cols-[1fr_1fr_auto]">
              <p className="col-span-2 text-sm font-medium sm:col-span-1">{allocation.name}</p>
              <div><p className="mb-2 text-xs tabular-nums text-stone-600 dark:text-stone-400">{formatCurrency(allocation.actualSpentCents, budget.currency)} of {formatCurrency(allocation.allocatedCents, budget.currency)}</p><div className="h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800"><div className={`h-full ${balance < 0 ? 'bg-rose-600' : 'bg-stone-800 dark:bg-stone-300'}`} style={{width:`${allocation.allocatedCents > 0 ? Math.min(100, allocation.actualSpentCents / allocation.allocatedCents * 100) : allocation.actualSpentCents > 0 ? 100 : 0}%`}} /></div></div>
              <p className={`text-right text-sm tabular-nums ${balance < 0 ? 'text-rose-700 dark:text-rose-300' : 'text-stone-600 dark:text-stone-400'}`}>{formatCurrency(Math.abs(balance), budget.currency)} {balance < 0 ? 'over' : 'left'}</p>
            </div>;
          })}
        </div>
      </section>

      {isAddExpenseOpen && <dialog ref={dialogRef} aria-labelledby="expense-dialog-title" onKeyDown={event => {
        if (event.key !== 'Tab') return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>('input:not(:disabled), select:not(:disabled), button:not(:disabled)');
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }} onCancel={event => { event.preventDefault(); setIsAddExpenseOpen(false); }} className="fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-2xl border border-stone-200 bg-white p-5 text-stone-900 shadow-xl backdrop:bg-stone-950/50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100">
        <h2 id="expense-dialog-title" className="text-xl font-semibold">Log Event Expense</h2>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">Record the commitment now. Mark it paid once settled.</p>
        <form onSubmit={handleAddExpenseSubmit} className="mt-5 space-y-4">
          <div><label htmlFor="expense-name" className="mb-1.5 block text-sm font-medium">Expense Description *</label><input id="expense-name" type="text" required maxLength={200} placeholder="e.g. Acoustic Audio Equipment Rental" value={newExpense.name} onChange={event => setNewExpense({...newExpense, name:event.target.value})} className={inputClass} /></div>
          <div><label htmlFor="expense-category" className="mb-1.5 block text-sm font-medium">Category *</label><select id="expense-category" value={newExpense.category} onChange={event => setNewExpense({...newExpense, category:event.target.value as BudgetAllocation['category']})} className={inputClass}>{budget.allocations.map(allocation => <option key={allocation.id} value={allocation.category}>{allocation.name}</option>)}</select></div>
          <div><label htmlFor="expense-vendor" className="mb-1.5 block text-sm font-medium">Vendor / Payee</label><input id="expense-vendor" type="text" maxLength={200} placeholder="e.g. Sonic Sound Co" value={newExpense.vendor} onChange={event => setNewExpense({...newExpense, vendor:event.target.value})} className={inputClass} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label htmlFor="expense-estimated" className="mb-1.5 block text-sm font-medium">Estimated ({budget.currency})</label><input id="expense-estimated" type="number" min="0" step="0.01" value={newExpense.estimated} onChange={event => setNewExpense({...newExpense, estimated:Number(event.target.value)})} className={inputClass} /></div>
            <div><label htmlFor="expense-actual" className="mb-1.5 block text-sm font-medium">Committed ({budget.currency}) *</label><input id="expense-actual" type="number" min="0" step="0.01" required value={newExpense.actual} onChange={event => setNewExpense({...newExpense, actual:Number(event.target.value)})} className={inputClass} /></div>
          </div>
          <label className="flex min-h-11 items-center gap-3 text-sm"><input id="is-paid-chk" type="checkbox" checked={newExpense.isPaid} onChange={event => setNewExpense({...newExpense, isPaid:event.target.checked})} />Payment settled / invoice cleared</label>
          <div className="flex justify-end gap-3 border-t border-stone-200 pt-4 dark:border-stone-800"><button type="button" onClick={() => setIsAddExpenseOpen(false)} className="min-h-11 rounded-lg px-4 text-sm hover:bg-stone-100 dark:hover:bg-stone-800">Cancel</button><button type="submit" className="min-h-11 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 dark:bg-stone-100 dark:text-stone-900">Save Expense</button></div>
        </form>
      </dialog>}
    </div>
  );
};
