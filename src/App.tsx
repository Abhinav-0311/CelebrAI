import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
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
import { CelebrAILogoIcon } from './components/common/CelebrAILogo';
import { useEventStore, NavigationTab } from './store/eventStore';

export function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}

export const App: React.FC = () => {
  const { activeTab } = useEventStore();
  const isMobile = useIsMobile(1024);

  return (
    <div className="min-h-screen bg-[#f2e9e1] dark:bg-[#14110e] text-stone-900 dark:text-stone-100 flex font-sans">
      {/* Desktop Workspace Sidebar */}
      {!isMobile && <Sidebar />}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Context Bar */}
        <Header />

        {/* Mobile Horizontal Navigation Tabs */}
        {isMobile && <NavigationTabs />}

        {/* Main Workspace Canvas */}
        <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {([
            ['overview', <OverviewTab />], ['budget', <BudgetTab />], ['timeline', <TimelineTab />],
            ['guests', <GuestsTab />], ['creative', <CreativeTab />], ['vendors', <VendorsTab />],
            ['intelligence', <IntelligenceTab />],
          ] as [NavigationTab, React.ReactNode][]).map(([tab, content]) => (
            <section key={tab} id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} hidden={activeTab !== tab} tabIndex={0}>
              {activeTab === tab && content}
            </section>
          ))}
        </main>

        {/* Global Accessible Modals */}
        <CreateEventModal />
        <AdaptiveReviewModal />

        {/* Minimal Workspace Footer */}
        <footer className="bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-850 py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
            <div className="flex items-center gap-2">
              <CelebrAILogoIcon size="sm" className="w-4 h-4 rounded" />
              <span className="font-semibold text-stone-800 dark:text-stone-200">CelebrAI</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Plans saved on this device</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
