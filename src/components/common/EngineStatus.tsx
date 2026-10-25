import React from 'react';
import { useEventStore } from '../../store/eventStore';

export const EngineStatus: React.FC<{ className?: string }> = ({ className = 'text-stone-600 dark:text-stone-300' }) => {
  const { systemMode, systemMessage } = useEventStore();
  return (
    <span className={`inline-flex items-center gap-2 text-xs ${className}`} title={systemMessage}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${systemMode === 'live' ? 'bg-emerald-600' : systemMode === 'sample' ? 'bg-stone-400' : 'bg-amber-600'}`} />
      {systemMode === 'live' ? 'Live AI Engine' : systemMode === 'sample' ? 'Sample Showcase' : 'Offline Engine'}
    </span>
  );
};
