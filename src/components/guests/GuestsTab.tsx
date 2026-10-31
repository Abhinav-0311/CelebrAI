import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  UtensilsCrossed, 
  AlertTriangle, 
  Crown, 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle 
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { RSVPStatus, DietaryRequirement } from '../../types/event';

export const GuestsTab: React.FC = () => {
  const { currentEvent, addGuest, deleteGuest } = useEventStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newGuest, setNewGuest] = useState<{
    name: string;
    email: string;
    rsvpStatus: RSVPStatus;
    plusOnes: number | string;
    dietary: DietaryRequirement[];
    tableNumber: number | string;
    isVip: boolean;
  }>({
    name: '',
    email: '',
    rsvpStatus: 'attending',
    plusOnes: 0,
    dietary: [],
    tableNumber: 1,
    isVip: false,
  });

  if (!currentEvent) return null;

  const { guests } = currentEvent;
  const list = guests.list;
  const summary = guests.dietarySummary;

  const filteredGuests = list.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.email && g.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRsvp = rsvpFilter === 'all' || g.rsvpStatus === rsvpFilter;
    return matchesSearch && matchesRsvp;
  });

  const totalTables = Math.ceil(currentEvent.guestCount / (guests.targetTableCapacity || 10));
  const totalTrackedHeadcount = list.reduce((sum, g) => sum + 1 + (g.plusOnes || 0), 0);
  const attendingHeadcount = list.filter((g) => g.rsvpStatus === 'attending').reduce((sum, g) => sum + 1 + (g.plusOnes || 0), 0);
  const pendingHeadcount = list.filter((g) => g.rsvpStatus === 'pending').reduce((sum, g) => sum + 1 + (g.plusOnes || 0), 0);
  const declinedHeadcount = list.filter((g) => g.rsvpStatus === 'declined').reduce((sum, g) => sum + 1 + (g.plusOnes || 0), 0);

  const handleDietaryToggle = (item: DietaryRequirement) => {
    if (newGuest.dietary.includes(item)) {
      setNewGuest({ ...newGuest, dietary: newGuest.dietary.filter((d) => d !== item) });
    } else {
      setNewGuest({ ...newGuest, dietary: [...newGuest.dietary, item] });
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuest.name) return;

    addGuest({
      name: newGuest.name,
      email: newGuest.email,
      rsvpStatus: newGuest.rsvpStatus,
      plusOnes: Number.parseInt(String(newGuest.plusOnes), 10) || 0,
      dietary: newGuest.dietary.length > 0 ? newGuest.dietary : ['none'],
      tableNumber: Number.parseInt(String(newGuest.tableNumber), 10) || 1,
      isVip: newGuest.isVip,
    });

    setNewGuest({
      name: '',
      email: '',
      rsvpStatus: 'attending',
      plusOnes: 0,
      dietary: [],
      tableNumber: 1,
      isVip: false,
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#C5A869] font-bold">
              Hospitality & Kitchen Intelligence
            </span>
            <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-1">
              Guest Directory & Dietary Aggregations
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Distinguishing confirmed dietary portions from pending estimates with plus-one accounting
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white shadow-sm transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Guest</span>
          </button>
        </div>

        {/* Headcount Accounting: Target Capacity vs Directory Registered */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850/60 border border-stone-200 dark:border-stone-800">
            <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Target Capacity</span>
            <p className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5 font-mono">
              {currentEvent.guestCount}
            </p>
            <span className="text-[10px] text-stone-400 font-mono">{totalTables} Tables ({guests.targetTableCapacity || 10}/tbl)</span>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850/60 border border-stone-200 dark:border-stone-800">
            <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Tracked in Directory</span>
            <p className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5 font-mono">
              {totalTrackedHeadcount}
            </p>
            <span className="text-[10px] text-stone-400 font-mono">{list.length} RSVP invitations</span>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850/60 border border-stone-200 dark:border-stone-800">
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Confirmed Attending</span>
            <p className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5 font-mono">
              {attendingHeadcount}
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Guaranteed covers</span>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850/60 border border-stone-200 dark:border-stone-800">
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Pending Response</span>
            <p className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5 font-mono">
              {pendingHeadcount}
            </p>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">Awaiting RSVP</span>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850/60 border border-stone-200 dark:border-stone-800 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Declined</span>
            <p className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5 font-mono">
              {declinedHeadcount}
            </p>
            <span className="text-[10px] text-stone-400 font-mono">Not attending</span>
          </div>
        </div>

        {/* Dietary & Kitchen Aggregates */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5 font-mono">
              <UtensilsCrossed className="w-3.5 h-3.5 text-[#C5A869]" /> Confirmed Kitchen Portions (Attending Guests & Plus-Ones)
            </h3>
            {summary.potentialDietaryCount > 0 && (
              <span className="text-[11px] text-amber-600 font-semibold font-mono">
                +{summary.potentialDietaryCount} pending RSVP dietary portions
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850/60 border border-stone-200 dark:border-stone-800 text-center">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Vegetarian</span>
              <p className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5 font-mono">
                {summary.confirmedVegetarian}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850/60 border border-stone-200 dark:border-stone-800 text-center">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Vegan</span>
              <p className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5 font-mono">
                {summary.confirmedVegan}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850/60 border border-stone-200 dark:border-stone-800 text-center">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Gluten-Free</span>
              <p className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5 font-mono">
                {summary.confirmedGlutenFree}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850/60 border border-stone-200 dark:border-stone-800 text-center">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Halal</span>
              <p className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5 font-mono">
                {summary.confirmedHalal}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 text-center">
              <span className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Nut Allergy
              </span>
              <p className="text-lg font-bold text-rose-700 dark:text-rose-300 mt-0.5 font-mono">
                {summary.confirmedNutAllergy}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850/60 border border-stone-200 dark:border-stone-800 text-center">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Target Seating</span>
              <p className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5 font-mono">
                {totalTables} Tables
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Guest Directory Controls & Table */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              aria-label="Search guests"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#C5A869]"
            />
          </div>

          {/* RSVP Filter buttons */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-stone-400 font-medium font-mono text-[11px]">RSVP:</span>
            {['all', 'attending', 'pending', 'declined'].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setRsvpFilter(filter)}
                className={`px-2.5 py-1 rounded-full capitalize font-medium transition text-xs ${
                  rsvpFilter === filter
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {filteredGuests.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-xl border-stone-200 dark:border-stone-800">
            <Users className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">No guests match the filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold border-y border-stone-200 dark:border-stone-800 font-mono text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Guest Name</th>
                  <th className="py-2.5 px-3">RSVP Status</th>
                  <th className="py-2.5 px-3">Table</th>
                  <th className="py-2.5 px-3">Party Size</th>
                  <th className="py-2.5 px-3">Dietary Requirements</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredGuests.map((g) => (
                  <tr key={g.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 font-semibold text-stone-900 dark:text-stone-100">
                        {g.isVip && (
                          <span title="VIP Guest">
                            <Crown className="w-3.5 h-3.5 text-[#C5A869] shrink-0" />
                          </span>
                        )}
                        <span>{g.name}</span>
                      </div>
                      {g.email && <span className="text-[11px] text-stone-400 block font-mono">{g.email}</span>}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          g.rsvpStatus === 'attending'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : g.rsvpStatus === 'pending'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                        }`}
                      >
                        {g.rsvpStatus === 'attending' && <CheckCircle2 className="w-3 h-3" />}
                        {g.rsvpStatus === 'pending' && <Clock className="w-3 h-3" />}
                        {g.rsvpStatus === 'declined' && <XCircle className="w-3 h-3" />}
                        <span className="capitalize">{g.rsvpStatus}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-stone-700 dark:text-stone-300 font-mono">
                      Table {g.tableNumber || 1}
                    </td>
                    <td className="py-2.5 px-3 text-stone-600 dark:text-stone-400 font-semibold font-mono">
                      {1 + (g.plusOnes || 0)} {g.plusOnes > 0 ? `(+${g.plusOnes})` : ''}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {g.dietary.map((d, i) => (
                          <span
                            key={i}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize ${
                              d === 'nut_allergy'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                            }`}
                          >
                            {d.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => deleteGuest(g.id)}
                        className="text-stone-400 hover:text-rose-500 p-1 rounded transition"
                        aria-label={`Delete guest ${g.name}`}
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

      {/* Add Guest Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
              Add Attendee / Guest
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label htmlFor="guest-name" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Full Name *
                </label>
                <input
                  id="guest-name"
                  type="text"
                  required
                  placeholder="e.g. Dr. Julian Vance"
                  value={newGuest.name}
                  onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#C5A869]"
                />
              </div>

              <div>
                <label htmlFor="guest-email" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Email Address
                </label>
                <input
                  id="guest-email"
                  type="email"
                  placeholder="julian@example.com"
                  value={newGuest.email}
                  onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#C5A869]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="guest-rsvp" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    RSVP Status
                  </label>
                  <select
                    id="guest-rsvp"
                    value={newGuest.rsvpStatus}
                    onChange={(e) => setNewGuest({ ...newGuest, rsvpStatus: e.target.value as RSVPStatus })}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#C5A869]"
                  >
                    <option value="attending">Attending</option>
                    <option value="pending">Pending</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="guest-plus-ones" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Plus-Ones
                  </label>
                  <input
                    id="guest-plus-ones"
                    type="number"
                    min="0"
                    max="10"
                    value={newGuest.plusOnes}
                    onChange={(e) => setNewGuest({ ...newGuest, plusOnes: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#C5A869] font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="guest-table" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Table #
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    id="guest-table"
                    value={newGuest.tableNumber}
                    onChange={(e) => setNewGuest({ ...newGuest, tableNumber: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#C5A869] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Dietary Flags (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['vegan', 'vegetarian', 'gluten_free', 'halal', 'nut_allergy', 'dairy_free'] as DietaryRequirement[]).map((d) => {
                    const sel = newGuest.dietary.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={sel}
                        onClick={() => handleDietaryToggle(d)}
                        className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                          sel ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                        }`}
                      >
                        {d.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="vip-guest-chk"
                  checked={newGuest.isVip}
                  onChange={(e) => setNewGuest({ ...newGuest, isVip: e.target.checked })}
                  className="rounded text-stone-900 focus:ring-[#C5A869]"
                />
                <label htmlFor="vip-guest-chk" className="text-xs text-stone-700 dark:text-stone-300">
                  Mark as VIP Guest / Honoree
                </label>
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
                  Save Guest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
