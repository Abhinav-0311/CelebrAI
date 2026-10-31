import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Plus, 
  Trash2, 
  PlayCircle, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  User 
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { TimelineMilestone, MilestoneCategory } from '../../types/event';

export const TimelineTab: React.FC = () => {
  const { 
    currentEvent, 
    toggleMilestoneStatus, 
    addMilestone, 
    deleteMilestone, 
    toggleDayOfLive 
  } = useEventStore();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [newMilestone, setNewMilestone] = useState<Omit<Partial<TimelineMilestone>, 'durationMinutes'> & { durationMinutes: number | string }>({
    time: '18:00',
    durationMinutes: 45,
    title: '',
    category: 'reception',
    assignedTo: 'Lead Coordinator',
    notes: '',
  });

  // Digital clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!currentEvent) return null;

  const { timeline } = currentEvent;
  const milestones = timeline.milestones;
  const isLive = timeline.isDayOfLiveActive;

  const filteredMilestones = milestones.filter((m) => {
    if (filterCategory === 'all') return true;
    return m.category === filterCategory;
  });

  const completedCount = milestones.filter((m) => m.status === 'completed').length;
  const inProgressCount = milestones.filter((m) => m.status === 'in_progress').length;
  const pendingCount = milestones.filter((m) => m.status === 'pending').length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestone.title || !newMilestone.time) return;

    addMilestone({
      time: newMilestone.time,
      durationMinutes: Number.parseInt(String(newMilestone.durationMinutes), 10) || 30,
      title: newMilestone.title,
      category: (newMilestone.category as MilestoneCategory) || 'reception',
      assignedTo: newMilestone.assignedTo || 'Event Staff',
      notes: newMilestone.notes || '',
      status: 'pending',
    });

    setNewMilestone({
      time: '18:00',
      durationMinutes: 30,
      title: '',
      category: 'reception',
      assignedTo: 'Lead Coordinator',
      notes: '',
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Mode Switch */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#C5A869] font-bold">
                Logistics & Execution
              </span>
              {isLive && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1.5 animate-pulse font-mono">
                  <Radio className="w-3 h-3 text-emerald-600" /> Day-of Execution Mode Active
                </span>
              )}
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-1">
              Run-of-Show & Minute-by-Minute Timeline
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Precise milestone sequencing from load-in to grand send-off
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={toggleDayOfLive}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition ${
                isLive
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20 hover:bg-emerald-800'
                  : 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isLive ? 'animate-pulse' : ''}`} />
              <span>{isLive ? 'Exit Day-of Mode' : 'Enter Day-of Mode'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Cue</span>
            </button>
          </div>
        </div>

        {/* Live Day-of Dashboard Bar */}
        {isLive && (
          <div className="p-4 rounded-xl bg-stone-900 text-white border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-inner">
            <div className="flex items-center gap-4">
              <div className="bg-stone-950 text-[#C5A869] px-4 py-2 rounded-xl font-mono text-xl font-bold tracking-widest border border-stone-800 shadow-inner flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#C5A869]" />
                <span>{currentTime || '00:00:00'}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-stone-100 font-serif">Live Stage Direction Active</p>
                <p className="text-[11px] text-stone-400">Click any milestone status badge to progress cue state in real-time</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-semibold">
                ✓ {completedCount} Done
              </span>
              <span className="px-2.5 py-1 rounded-md bg-amber-950 text-amber-300 border border-amber-800/60 font-semibold">
                ▶ {inProgressCount} In Progress
              </span>
              <span className="px-2.5 py-1 rounded-md bg-stone-800 text-stone-300 border border-stone-700 font-semibold">
                ⏳ {pendingCount} Pending
              </span>
            </div>
          </div>
        )}

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 text-xs">
          <span className="text-stone-400 mr-1 font-medium font-mono text-[11px]">Filter:</span>
          {['all', 'setup', 'ceremony', 'reception', 'meal', 'speech', 'entertainment', 'teardown'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-full capitalize font-medium transition text-xs ${
                filterCategory === cat
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200 dark:before:bg-stone-800">
        {filteredMilestones.map((m) => {
          const isPending = m.status === 'pending';
          const isInProgress = m.status === 'in_progress';
          const isCompleted = m.status === 'completed';

          return (
            <div
              key={m.id}
              className={`relative bg-white dark:bg-stone-900 rounded-xl p-4 sm:p-5 border transition-all shadow-sm ${
                isInProgress
                  ? 'border-[#C5A869] ring-2 ring-[#C5A869]/20 bg-amber-50/20 dark:bg-amber-950/20'
                  : isCompleted
                  ? 'border-stone-200 dark:border-stone-800 opacity-75'
                  : 'border-stone-200 dark:border-stone-800'
              }`}
            >
              {/* Timeline Dot Indicator */}
              <div
                className={`absolute -left-6 sm:-left-8 top-5 w-4 h-4 rounded-full border-2 border-white dark:border-stone-900 flex items-center justify-center transition ${
                  isCompleted
                    ? 'bg-emerald-600'
                    : isInProgress
                    ? 'bg-[#C5A869] ring-4 ring-[#C5A869]/25 animate-pulse'
                    : 'bg-stone-300 dark:bg-stone-700'
                }`}
              />

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#C5A869]" />
                      {m.time}
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono">({m.durationMinutes} mins)</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full font-mono ${
                        m.category === 'ceremony'
                          ? 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700'
                          : m.category === 'meal'
                          ? 'bg-[#C5A869]/15 text-[#8E7033] dark:text-[#E8D49B] border border-[#C5A869]/30'
                          : m.category === 'speech'
                          ? 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200'
                          : m.category === 'entertainment'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                      }`}
                    >
                      {m.category}
                    </span>
                  </div>

                  <h3
                    className={`text-base font-bold ${
                      isCompleted ? 'text-stone-400 line-through' : 'text-stone-900 dark:text-stone-100 font-serif'
                    }`}
                  >
                    {m.title}
                  </h3>

                  {m.notes && (
                    <p className="text-xs text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-lg border border-stone-200 dark:border-stone-800">
                      {m.notes}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 pt-1">
                    <User className="w-3.5 h-3.5 text-[#C5A869]" />
                    <span>Assigned: <strong className="text-stone-800 dark:text-stone-200">{m.assignedTo}</strong></span>
                  </div>
                </div>

                {/* Status Toggle & Delete */}
                <div className="flex items-center gap-2 self-start">
                  <button
                    type="button"
                    onClick={() => toggleMilestoneStatus(m.id)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition font-mono ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                        : isInProgress
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-200'
                        : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-750'
                    }`}
                    title="Click to cycle status: Pending -> In Progress -> Completed"
                  >
                    {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    {isInProgress && <PlayCircle className="w-3.5 h-3.5 text-amber-600 animate-spin" />}
                    {isPending && <AlertCircle className="w-3.5 h-3.5 text-stone-400" />}
                    <span className="capitalize">{m.status.replace('_', ' ')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteMilestone(m.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg transition"
                    aria-label={`Delete milestone ${m.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Milestone Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
              Add Timeline Cue / Milestone
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label htmlFor="cue-title" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Milestone Title *
                </label>
                <input id="cue-title"
                  type="text"
                  required
                  placeholder="e.g. VIP Champagne Toast & Honors"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#C5A869]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cue-time" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Scheduled Time (24h) *
                  </label>
                  <input id="cue-time"
                    type="time"
                    required
                    value={newMilestone.time}
                    onChange={(e) => setNewMilestone({ ...newMilestone, time: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#C5A869]"
                  />
                </div>

                <div>
                  <label htmlFor="cue-duration" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input id="cue-duration"
                    type="number"
                    min="5"
                    step="5"
                    value={newMilestone.durationMinutes}
                    onChange={(e) => setNewMilestone({ ...newMilestone, durationMinutes: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#C5A869] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cue-category" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Category *
                  </label>
                  <select id="cue-category"
                    value={newMilestone.category}
                    onChange={(e) => setNewMilestone({ ...newMilestone, category: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#C5A869]"
                  >
                    <option value="setup">Setup & Prep</option>
                    <option value="ceremony">Ceremony / Highlight</option>
                    <option value="reception">Reception / Arrival</option>
                    <option value="meal">Meal & Dining</option>
                    <option value="speech">Speeches & Toasts</option>
                    <option value="entertainment">Entertainment & Dance</option>
                    <option value="teardown">Teardown</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="cue-lead" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Assigned Lead
                  </label>
                  <input id="cue-lead"
                    type="text"
                    placeholder="e.g. Stage Captain"
                    value={newMilestone.assignedTo}
                    onChange={(e) => setNewMilestone({ ...newMilestone, assignedTo: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#C5A869]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cue-notes" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Stage Directions & Cue Notes
                </label>
                <textarea id="cue-notes"
                  rows={2}
                  placeholder="e.g. Dim ballroom lights, cue intro audio track"
                  value={newMilestone.notes}
                  onChange={(e) => setNewMilestone({ ...newMilestone, notes: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#C5A869]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 rounded-lg shadow-sm transition"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
