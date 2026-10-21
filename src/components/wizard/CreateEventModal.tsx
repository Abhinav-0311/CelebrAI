import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { EventCreationSchema, EventCreationInput } from '../../types/schemas';
import { CelebrAILogoIcon } from '../common/CelebrAILogo';

const VIBE_OPTIONS = [
  'Elegant',
  'Romantic',
  'Sophisticated',
  'High-Energy',
  'Bohemian',
  'Minimalist',
  'Luminous',
  'Playful',
  'Rustic Chic',
  'Vintage Glam',
];

export const CreateEventModal: React.FC = () => {
  const { isCreateModalOpen, setCreateModalOpen, createEvent, isGenerating } = useEventStore();
  const modalRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<Partial<EventCreationInput>>({
    title: '',
    eventType: 'wedding',
    guestCount: 100,
    totalBudget: 25000,
    currency: 'USD',
    eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    location: '',
    venueType: 'indoor',
    vibeKeywords: ['Elegant', 'Romantic'],
    specialNotes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCreateModalOpen && !isGenerating) {
        setCreateModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (isCreateModalOpen && modalRef.current) {
      modalRef.current.focus();
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateModalOpen, isGenerating, setCreateModalOpen]);

  if (!isCreateModalOpen) return null;

  const handleVibeToggle = (vibe: string) => {
    const current = formData.vibeKeywords || [];
    if (current.includes(vibe)) {
      setFormData({ ...formData, vibeKeywords: current.filter((v) => v !== vibe) });
    } else {
      setFormData({ ...formData, vibeKeywords: [...current, vibe] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = EventCreationSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    await createEvent(result.data);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-event-title"
      ref={modalRef}
      tabIndex={-1}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <CelebrAILogoIcon size="md" />
            <div>
              <h2 id="create-event-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Plan a New Celebration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure your celebration parameters for AI-powered generation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCreateModalOpen(false)}
            disabled={isGenerating}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="evt-title" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Celebration Title *
            </label>
            <input
              id="evt-title"
              type="text"
              required
              placeholder="e.g. Maya & Kieran's Sunset Garden Wedding"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 ${
                errors.title ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title}</p>}
          </div>

          {/* Event Type & Venue Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="evt-type" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Event Category *
              </label>
              <select
                id="evt-type"
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value as any })}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
              >
                <option value="wedding">Wedding Celebration</option>
                <option value="birthday">Milestone Birthday Party</option>
                <option value="anniversary">Anniversary Jubilee</option>
                <option value="corporate_gala">Corporate Gala & Honors</option>
                <option value="baby_shower">Baby Shower / Arrival</option>
                <option value="graduation">Graduation Celebration</option>
                <option value="festival">Festival / Cultural Gathering</option>
                <option value="themed_party">Themed Costume / Soirée</option>
              </select>
            </div>

            <div>
              <label htmlFor="venue-type" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Venue Setting *
              </label>
              <select
                id="venue-type"
                value={formData.venueType}
                onChange={(e) => setFormData({ ...formData, venueType: e.target.value as any })}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
              >
                <option value="indoor">Indoor Banquet Hall</option>
                <option value="ballroom">Grand Ballroom</option>
                <option value="garden">Botanical Conservatory / Garden</option>
                <option value="outdoor">Outdoor Estate / Lawn</option>
                <option value="rooftop">Rooftop Lounge</option>
                <option value="beach">Beachside / Waterfront</option>
                <option value="restaurant">Boutique Restaurant</option>
                <option value="private_residence">Private Residence / Estate</option>
              </select>
            </div>
          </div>

          {/* Guest Count & Total Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="guest-count" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estimated Guests *
              </label>
              <input
                id="guest-count"
                type="number"
                min="2"
                max="5000"
                value={formData.guestCount}
                onChange={(e) => setFormData({ ...formData, guestCount: parseInt(e.target.value) || 0 })}
                className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 ${
                  errors.guestCount ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.guestCount && <p className="text-xs text-rose-500 mt-1">{errors.guestCount}</p>}
            </div>

            <div>
              <label htmlFor="total-budget" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Budget (USD) *
              </label>
              <input
                id="total-budget"
                type="number"
                min="100"
                step="any"
                value={formData.totalBudget}
                onChange={(e) => setFormData({ ...formData, totalBudget: parseFloat(e.target.value) || 0 })}
                className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 ${
                  errors.totalBudget ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.totalBudget && <p className="text-xs text-rose-500 mt-1">{errors.totalBudget}</p>}
            </div>
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="evt-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Event Date *
              </label>
              <input
                id="evt-date"
                type="date"
                required
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 ${
                  errors.eventDate ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.eventDate && <p className="text-xs text-rose-500 mt-1">{errors.eventDate}</p>}
            </div>

            <div>
              <label htmlFor="evt-location" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City / Venue Location *
              </label>
              <input
                id="evt-location"
                type="text"
                required
                placeholder="e.g. Austin, TX or Chicago, IL"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 ${
                  errors.location ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.location && <p className="text-xs text-rose-500 mt-1">{errors.location}</p>}
            </div>
          </div>

          {/* Vibe Keywords */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Atmosphere & Vibe Tags
            </span>
            <div className="flex flex-wrap gap-2">
              {VIBE_OPTIONS.map((vibe) => {
                const selected = formData.vibeKeywords?.includes(vibe);
                return (
                  <button
                    key={vibe}
                    type="button"
                    onClick={() => handleVibeToggle(vibe)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      selected
                        ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {vibe}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special Notes */}
          <div>
            <label htmlFor="evt-notes" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Custom Vision / Dietary / Music Notes (Optional)
            </label>
            <textarea
              id="evt-notes"
              rows={2}
              placeholder="e.g. Looking for candlelit ambiance, gluten-free dessert options, and an acoustic welcome set"
              value={formData.specialNotes}
              onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              disabled={isGenerating}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-2.5 text-xs font-bold rounded-lg text-white bg-gradient-to-r from-brand-600 via-fuchsia-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-md shadow-brand-500/25 transition flex items-center gap-2 disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Celebration Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Complete Plan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
