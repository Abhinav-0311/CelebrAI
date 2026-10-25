import React from 'react';
import { 
  Palette, 
  DollarSign, 
  Clock, 
  Users, 
  PenTool, 
  Store, 
  BrainCircuit 
} from 'lucide-react';
import { useEventStore, NavigationTab } from '../../store/eventStore';

interface TabItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

export function handleTabKeyDown(event: React.KeyboardEvent<HTMLElement>) {
  const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const index = tabs.indexOf(event.target as HTMLButtonElement);
  if (index < 0) return;
  const vertical = event.currentTarget.getAttribute('aria-orientation') === 'vertical';
  const nextKey = vertical ? 'ArrowDown' : 'ArrowRight';
  const prevKey = vertical ? 'ArrowUp' : 'ArrowLeft';
  let nextIndex;
  if (event.key === nextKey) nextIndex = (index + 1) % tabs.length;
  else if (event.key === prevKey) nextIndex = (index - 1 + tabs.length) % tabs.length;
  else if (event.key === 'Home') nextIndex = 0;
  else if (event.key === 'End') nextIndex = tabs.length - 1;
  else return;
  event.preventDefault();
  tabs[nextIndex].focus();
  tabs[nextIndex].click();
}

export const NavigationTabs: React.FC = () => {
  const { activeTab, setActiveTab, currentEvent } = useEventStore();

  const pendingRippleCount = currentEvent?.pendingRipples.filter((r) => r.status === 'pending_review').length || 0;
  const guestCount = currentEvent?.guestCount || 0;
  const milestoneCount = currentEvent?.timeline.milestones.length || 0;

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview', icon: Palette },
    { id: 'budget', label: 'Budget & Expenses', icon: DollarSign },
    { id: 'timeline', label: 'Run-of-Show', icon: Clock, badge: milestoneCount },
    { id: 'guests', label: 'Guests & Catering', icon: Users, badge: guestCount },
    { id: 'creative', label: 'Creative Studio', icon: PenTool },
    { id: 'vendors', label: 'Vendors & RFPs', icon: Store },
    { 
      id: 'intelligence', 
      label: 'Adaptive Engine', 
      icon: BrainCircuit,
      badge: pendingRippleCount > 0 ? `${pendingRippleCount} alert` : undefined 
    },
  ];

  return (
    <nav className="bg-stone-50/80 dark:bg-stone-950/80 border-b border-stone-200 dark:border-stone-800 backdrop-blur-sm" aria-label="Event Sections">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-1.5 overflow-x-auto py-2 scroll-smooth" role="tablist" aria-label="Event Sections" onKeyDown={handleTabKeyDown} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 min-h-11 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                  isActive
                    ? 'bg-brand-100 text-brand-900 dark:bg-stone-100 dark:text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-brand-700 dark:text-brand-300' : 'text-stone-400 dark:text-stone-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      typeof tab.badge === 'string' && tab.badge.includes('alert')
                        ? 'bg-amber-500 text-white animate-pulse'
                        : isActive
                        ? 'bg-stone-800 text-stone-200 dark:bg-stone-200 dark:text-stone-800'
                        : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
