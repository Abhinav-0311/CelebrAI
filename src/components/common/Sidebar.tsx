import React from 'react';
import { 
  Palette, 
  DollarSign, 
  Clock, 
  Users, 
  PenTool, 
  Store, 
  BrainCircuit, 
  Calendar
} from 'lucide-react';
import { useEventStore, NavigationTab } from '../../store/eventStore';
import { CelebrAILogo } from './CelebrAILogo';
import { EngineStatus } from './EngineStatus';
import { handleTabKeyDown } from './NavigationTabs';

interface TabItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

export const Sidebar: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { 
    activeTab, 
    setActiveTab, 
    currentEvent
  } = useEventStore();

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
    <aside 
      className={`w-64 bg-[#171614] text-[#f8f3ee] border-r border-[#302d29] flex flex-col justify-between shrink-0 h-screen sticky top-0 ${className}`}
      aria-label="Application Sidebar"
    >
      <div className="p-5 space-y-6 flex-1 overflow-y-auto">
        {/* Brand */}
        <div className="flex items-center justify-between pb-1">
          <CelebrAILogo className="[&>span]:text-white [&>span>span]:text-brand-300" />
        </div>

        {/* Current Event Context Card */}
        {currentEvent && (
          <div className="p-3 rounded-xl bg-[#24221f] border border-[#39342f] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-[#d6c7bb]">Active event</span>
              <span className="text-xs text-[#bfb0a4] ">
                {currentEvent.eventType.replace('_', ' ')}
              </span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#fff8f0] line-clamp-2" title={currentEvent.title}>
                {currentEvent.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#bfb0a4] mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#bfb0a4]" />
                  {currentEvent.eventDate}
                </span>
                <span>•</span>
                <span>{currentEvent.guestCount} guests</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1" role="tablist" aria-label="Event Sections" aria-orientation="vertical" onKeyDown={handleTabKeyDown}>
          <p className="text-xs font-medium text-[#bfb0a4] px-2 py-1 uppercase tracking-wider">
            Workspace
          </p>
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
                className={`w-full flex items-center justify-between px-2.5 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#fff8f2] text-[#a63b20] font-semibold'
                    : 'text-[#d6c7bb] hover:text-white hover:bg-[#302b26]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-700' : 'text-[#bfb0a4]'}`} />
                  <span>{tab.label}</span>
                </div>

                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                      typeof tab.badge === 'string' && tab.badge.includes('alert')
                        ? 'bg-amber-500 text-white animate-pulse'
                        : isActive
                        ? 'bg-[#f1d6c6] text-[#6e3826]'
                        : 'bg-[#39332c] text-[#e9d9cb]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Controls */}
      <div className="p-3 border-t border-[#39332c]">
        {/* Subtle System Status */}
        <EngineStatus className="text-[#d6c7bb]" />
      </div>
    </aside>
  );
};
