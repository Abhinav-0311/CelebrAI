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

export const NavigationTabs: React.FC = () => {
  const { activeTab, setActiveTab, currentEvent } = useEventStore();

  const pendingRippleCount = currentEvent?.pendingRipples.filter((r) => r.status === 'pending_review').length || 0;
  const guestCount = currentEvent?.guestCount || 0;
  const milestoneCount = currentEvent?.timeline.milestones.length || 0;

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Theme & Concept', icon: Palette },
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
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800" aria-label="Event Sections">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto no-scrollbar py-2" role="tablist">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 shadow-sm border border-brand-200 dark:border-brand-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                      typeof tab.badge === 'string' && tab.badge.includes('alert')
                        ? 'bg-amber-500 text-white animate-pulse'
                        : isActive
                        ? 'bg-brand-200 text-brand-800 dark:bg-brand-900 dark:text-brand-200'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
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
