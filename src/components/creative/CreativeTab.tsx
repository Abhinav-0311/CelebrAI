import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Share2, 
  Mic, 
  Music, 
  Gamepad2, 
  Sparkles, 
  MessageSquare,
  AlertTriangle 
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';

export const CreativeTab: React.FC = () => {
  const { currentEvent, dismissInvitationReview } = useEventStore();
  const [selectedInvStyle, setSelectedInvStyle] = useState<string>('formal');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!currentEvent) return null;

  const { creative } = currentEvent;
  const invitations = creative.invitations;
  const speeches = creative.speeches;
  const playlist = creative.playlistVibes;
  const games = creative.partyGames;

  const activeInvitation = invitations.find((inv) => inv.style === selectedInvStyle) || invitations[0];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleShareWhatsApp = (text: string) => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#C5A869] font-bold">
          Content & Narrative Architecture
        </span>
        <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
          AI Creative Studio: Invitations, Speeches & Entertainment
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Bespoke copy tailored to your celebration vibe, speaker roles, and guest interactions
        </p>
      </div>

      {/* Invitation Copywriter Section */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-[#C5A869]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
                Digital Invitation Studio
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Curated tone variations ready for distribution</p>
            </div>
          </div>

          {/* Tone Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {invitations.map((inv) => (
              <button
                key={inv.id}
                type="button"
                onClick={() => setSelectedInvStyle(inv.style)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition font-mono ${
                  selectedInvStyle === inv.style
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {inv.style}
              </button>
            ))}
          </div>
        </div>

        {activeInvitation && (
          <div className="p-6 rounded-xl border-2 border-[#E7DFD3] dark:border-[#2F2B26] bg-[#FAF7F2] dark:bg-[#181614] space-y-4 shadow-sm relative">
            {/* Adaptive Review Banner */}
            {activeInvitation.needsReview && (
              <div
                role="status"
                className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-fadeIn"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{activeInvitation.reviewReason || 'Event parameters have changed. Please verify invitation copy.'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => dismissInvitationReview(activeInvitation.id)}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 transition self-end sm:self-auto"
                >
                  Mark Reviewed
                </button>
              </div>
            )}

            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C5A869]">
                Headline
              </span>
              <h4 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
                {activeInvitation.headline}
              </h4>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
                Invitation Body
              </span>
              <p className="text-sm font-serif text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                {activeInvitation.body}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-lg bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800">
                <span className="font-semibold text-stone-500 dark:text-stone-400 block mb-0.5 font-mono text-[10px] uppercase">RSVP Call-to-Action:</span>
                <span className="text-stone-800 dark:text-stone-200">{activeInvitation.rsvpCallToAction}</span>
              </div>
              <div className="p-3 rounded-lg bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800">
                <span className="font-semibold text-stone-500 dark:text-stone-400 block mb-0.5 font-mono text-[10px] uppercase">Dress Code Guidance:</span>
                <span className="text-stone-800 dark:text-stone-200">{activeInvitation.dressCodeNote}</span>
              </div>
            </div>

            {/* Copy & Share Bar */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200/60 dark:border-stone-800">
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    activeInvitation.id,
                    `${activeInvitation.headline}\n\n${activeInvitation.body}\n\nRSVP: ${activeInvitation.rsvpCallToAction}\nAttire: ${activeInvitation.dressCodeNote}`
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 transition"
              >
                {copiedId === activeInvitation.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === activeInvitation.id ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleShareWhatsApp(
                    `✨ *${activeInvitation.headline}*\n\n${activeInvitation.body}\n\n📅 Date: ${currentEvent.eventDate}\n📍 Location: ${currentEvent.location}\n👔 Dress Code: ${activeInvitation.dressCodeNote}\n\n${activeInvitation.rsvpCallToAction}`
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share via WhatsApp</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Speeches & Toasts Studio */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-[#C5A869]">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
              Speeches & Toast Drafts
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Customized scripts and talking points for hosts and honorees</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {speeches.map((sp) => (
            <div
              key={sp.id}
              className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/40 space-y-3 relative flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 capitalize font-serif">
                    {sp.speakerRole}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-mono">
                    <span className="px-2 py-0.5 rounded-full bg-stone-200/60 dark:bg-stone-800 capitalize font-medium text-stone-700 dark:text-stone-300">
                      {sp.tone}
                    </span>
                    <span>• {sp.estimatedDuration}</span>
                  </div>
                </div>

                {/* Key Talking Points */}
                <div className="bg-white dark:bg-stone-900 p-2.5 rounded-lg border border-stone-200/80 dark:border-stone-800">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C5A869] block mb-1">
                    Key Highlights:
                  </span>
                  <ul className="text-xs text-stone-600 dark:text-stone-300 list-disc list-inside space-y-0.5">
                    {sp.keyHighlights.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>

                <p className="text-xs text-stone-700 dark:text-stone-300 font-serif italic leading-relaxed pt-1">
                  "{sp.content}"
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleCopy(sp.id, sp.content)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  {copiedId === sp.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === sp.id ? 'Copied' : 'Copy Speech'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Entertainment & Playlist Vibes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Curated Playlist Vibes */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-[#C5A869]">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-stone-900 dark:text-stone-100">
                Curated Soundtrack & Music Cues
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Audio atmospheres for every phase of the event</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {playlist.map((track, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-stone-50 dark:bg-stone-850/60 border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 flex items-start gap-2"
              >
                <span className="font-mono font-bold text-[#C5A869]">0{i + 1}.</span>
                <span>{track}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Party Games */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-[#C5A869]">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-stone-900 dark:text-stone-100">
                Interactive Guest Activities & Games
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Icebreakers and memory-making experiences</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {games.map((game, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-stone-50 dark:bg-stone-850/60 border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 flex items-start gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#C5A869] shrink-0 mt-0.5" />
                <span>{game}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
