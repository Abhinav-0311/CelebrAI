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
    plusOnes: number;
    dietary: DietaryRequirement[];
    tableNumber: number;
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
      plusOnes: Number(newGuest.plusOnes) || 0,
      dietary: newGuest.dietary.length > 0 ? newGuest.dietary : ['none'],
      tableNumber: Number(newGuest.tableNumber) || 1,
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Hospitality & Kitchen Intelligence
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              Guest Directory & Dietary Aggregations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distinguishing confirmed dietary portions from pending estimates with plus-one accounting
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Guest</span>
          </button>
        </div>

        {/* Dietary & Kitchen Aggregates */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <UtensilsCrossed className="w-3.5 h-3.5" /> Confirmed Kitchen Portions (Attending Guests & Plus-Ones)
            </h3>
            {summary.potentialDietaryCount > 0 && (
              <span className="text-[11px] text-amber-600 font-semibold">
                +{summary.potentialDietaryCount} pending RSVP dietary portions
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] text-slate-500">Vegetarian</span>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {summary.confirmedVegetarian}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] text-slate-500">Vegan</span>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {summary.confirmedVegan}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] text-slate-500">Gluten-Free</span>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {summary.confirmedGlutenFree}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] text-slate-500">Halal</span>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {summary.confirmedHalal}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-center">
              <span className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Nut Allergy
              </span>
              <p className="text-lg font-bold text-rose-700 dark:text-rose-300 mt-0.5">
                {summary.confirmedNutAllergy}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] text-slate-500">Target Seating</span>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {totalTables} Tables
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Guest Directory Controls & Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* RSVP Filter buttons */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">RSVP:</span>
            {['all', 'attending', 'pending', 'declined'].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setRsvpFilter(filter)}
                className={`px-2.5 py-1 rounded-full capitalize font-medium transition ${
                  rsvpFilter === filter
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {filteredGuests.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No guests match the filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Guest Name</th>
                  <th className="py-2.5 px-3">RSVP Status</th>
                  <th className="py-2.5 px-3">Table</th>
                  <th className="py-2.5 px-3">Party Size</th>
                  <th className="py-2.5 px-3">Dietary Requirements</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredGuests.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
                        {g.isVip && (
                          <span title="VIP Guest">
                            <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          </span>
                        )}
                        <span>{g.name}</span>
                      </div>
                      {g.email && <span className="text-[11px] text-slate-400 block">{g.email}</span>}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.rsvpStatus === 'attending'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : g.rsvpStatus === 'pending'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {g.rsvpStatus === 'attending' && <CheckCircle2 className="w-3 h-3" />}
                        {g.rsvpStatus === 'pending' && <Clock className="w-3 h-3" />}
                        {g.rsvpStatus === 'declined' && <XCircle className="w-3 h-3" />}
                        <span className="capitalize">{g.rsvpStatus}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">
                      Table {g.tableNumber || 1}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-semibold">
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
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
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
                        className="text-slate-400 hover:text-rose-500 p-1 rounded transition"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Add Attendee / Guest
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Julian Vance"
                  value={newGuest.name}
                  onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="julian@example.com"
                  value={newGuest.email}
                  onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    RSVP Status
                  </label>
                  <select
                    value={newGuest.rsvpStatus}
                    onChange={(e) => setNewGuest({ ...newGuest, rsvpStatus: e.target.value as any })}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="attending">Attending</option>
                    <option value="pending">Pending</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Plus-Ones
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={newGuest.plusOnes}
                    onChange={(e) => setNewGuest({ ...newGuest, plusOnes: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Table #
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newGuest.tableNumber}
                    onChange={(e) => setNewGuest({ ...newGuest, tableNumber: parseInt(e.target.value) || 1 })}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dietary Flags (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['vegan', 'vegetarian', 'gluten_free', 'halal', 'nut_allergy', 'dairy_free'] as DietaryRequirement[]).map((d) => {
                    const sel = newGuest.dietary.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleDietaryToggle(d)}
                        className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                          sel ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
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
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="vip-guest-chk" className="text-xs text-slate-700 dark:text-slate-300">
                  Mark as VIP Guest / Honoree
                </label>
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
