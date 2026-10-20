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

  const [newMilestone, setNewMilestone] = useState<Partial<TimelineMilestone>>({
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
      durationMinutes: Number(newMilestone.durationMinutes) || 30,
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Logistics & Execution
              </span>
              {isLive && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1.5 animate-pulse">
                  <Radio className="w-3 h-3 text-emerald-600" /> Day-of Execution Mode Active
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              Run-of-Show & Minute-by-Minute Timeline
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Precise milestone sequencing from load-in to grand send-off
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={toggleDayOfLive}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition ${
                isLive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isLive ? 'animate-pulse' : ''}`} />
              <span>{isLive ? 'Exit Day-of Mode' : 'Enter Day-of Mode'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Cue</span>
            </button>
          </div>
        </div>

        {/* Live Day-of Dashboard Bar */}
        {isLive && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-slate-50 to-brand-50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-brand-950/30 border border-emerald-300/80 dark:border-emerald-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-slate-900 text-emerald-400 px-4 py-2 rounded-xl font-mono text-xl font-bold tracking-widest border border-slate-800 shadow-inner flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-500" />
                <span>{currentTime || '00:00:00'}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Live Stage Direction Active</p>
                <p className="text-[11px] text-slate-500">Click any milestone status badge to progress cue state in real-time</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                ✓ {completedCount} Done
              </span>
              <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold">
                ▶ {inProgressCount} In Progress
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold">
                ⏳ {pendingCount} Pending
              </span>
            </div>
          </div>
        )}

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 text-xs">
          <span className="text-slate-400 mr-1 font-medium">Filter:</span>
          {['all', 'setup', 'ceremony', 'reception', 'meal', 'speech', 'entertainment', 'teardown'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-full capitalize font-medium transition ${
                filterCategory === cat
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {filteredMilestones.map((m) => {
          const isPending = m.status === 'pending';
          const isInProgress = m.status === 'in_progress';
          const isCompleted = m.status === 'completed';

          return (
            <div
              key={m.id}
              className={`relative bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border transition-all shadow-sm ${
                isInProgress
                  ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20 dark:bg-amber-950/20'
                  : isCompleted
                  ? 'border-slate-200 dark:border-slate-800 opacity-80'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Timeline Dot Indicator */}
              <div
                className={`absolute -left-6 sm:-left-8 top-5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center transition ${
                  isCompleted
                    ? 'bg-emerald-500'
                    : isInProgress
                    ? 'bg-amber-500 ring-4 ring-amber-500/20 animate-pulse'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      {m.time}
                    </span>
                    <span className="text-[11px] text-slate-400">({m.durationMinutes} mins)</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        m.category === 'ceremony'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : m.category === 'meal'
                          ? 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                          : m.category === 'speech'
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : m.category === 'entertainment'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {m.category}
                    </span>
                  </div>

                  <h3
                    className={`text-base font-bold ${
                      isCompleted ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {m.title}
                  </h3>

                  {m.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80">
                      {m.notes}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <User className="w-3.5 h-3.5" />
                    <span>Assigned: <strong className="text-slate-700 dark:text-slate-200">{m.assignedTo}</strong></span>
                  </div>
                </div>

                {/* Status Toggle & Delete */}
                <div className="flex items-center gap-2 self-start">
                  <button
                    type="button"
                    onClick={() => toggleMilestoneStatus(m.id)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                        : isInProgress
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-200'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                    title="Click to cycle status: Pending -> In Progress -> Completed"
                  >
                    {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    {isInProgress && <PlayCircle className="w-3.5 h-3.5 text-amber-600 animate-spin" />}
                    {isPending && <AlertCircle className="w-3.5 h-3.5 text-slate-400" />}
                    <span className="capitalize">{m.status.replace('_', ' ')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteMilestone(m.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Add Timeline Cue / Milestone
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Milestone Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Champagne Toast & Honors"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Scheduled Time (24h) *
                  </label>
                  <input
                    type="time"
                    required
                    value={newMilestone.time}
                    onChange={(e) => setNewMilestone({ ...newMilestone, time: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={newMilestone.durationMinutes}
                    onChange={(e) => setNewMilestone({ ...newMilestone, durationMinutes: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={newMilestone.category}
                    onChange={(e) => setNewMilestone({ ...newMilestone, category: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Lead
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Stage Captain"
                    value={newMilestone.assignedTo}
                    onChange={(e) => setNewMilestone({ ...newMilestone, assignedTo: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Stage Directions & Cue Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Dim ballroom lights, cue intro audio track"
                  value={newMilestone.notes}
                  onChange={(e) => setNewMilestone({ ...newMilestone, notes: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm"
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
