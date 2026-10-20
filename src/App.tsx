import React from 'react';
import { Header } from './components/common/Header';
import { NavigationTabs } from './components/common/NavigationTabs';
import { OverviewTab } from './components/overview/OverviewTab';
import { BudgetTab } from './components/budget/BudgetTab';
import { TimelineTab } from './components/timeline/TimelineTab';
import { GuestsTab } from './components/guests/GuestsTab';
import { CreativeTab } from './components/creative/CreativeTab';
import { VendorsTab } from './components/vendors/VendorsTab';
import { IntelligenceTab } from './components/intelligence/IntelligenceTab';
import { CreateEventModal } from './components/wizard/CreateEventModal';
import { AdaptiveReviewModal } from './components/intelligence/AdaptiveReviewModal';
import { useEventStore } from './store/eventStore';

export const App: React.FC = () => {
  const { activeTab } = useEventStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Application Header */}
      <Header />

      {/* Navigation Bar */}
      <NavigationTabs />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'budget' && <BudgetTab />}
        {activeTab === 'timeline' && <TimelineTab />}
        {activeTab === 'guests' && <GuestsTab />}
        {activeTab === 'creative' && <CreativeTab />}
        {activeTab === 'vendors' && <VendorsTab />}
        {activeTab === 'intelligence' && <IntelligenceTab />}
      </main>

      {/* Global Accessible Modals */}
      <CreateEventModal />
      <AdaptiveReviewModal />

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">CelebrAI</span>
            <span>•</span>
            <span>PromptWars Virtual Challenge 5 (Celebration & Event Planner)</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Powered by Google Gemini 3.8 Flash & Antigravity</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">WCAG 2.1 AA Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
