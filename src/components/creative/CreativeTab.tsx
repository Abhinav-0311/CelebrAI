import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Share2, 
  Mic, 
  Music, 
  Gamepad2, 
  Sparkles, 
  AlertTriangle,
  Calendar,
  MapPin
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';

export const CreativeTab: React.FC = () => {
  const { currentEvent, dismissInvitationReview, updateInvitation } = useEventStore();
  const [selectedInvStyle, setSelectedInvStyle] = useState<string>('formal');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [copyError, setCopyError] = useState('');

  if (!currentEvent) return null;

  const { creative } = currentEvent;
  const invitations = creative.invitations;
  const speeches = creative.speeches;
  const playlist = creative.playlistVibes;
  const games = creative.partyGames;

  const activeInvitation = invitations.find((inv) => inv.style === selectedInvStyle) || invitations[0];

  const handleCopy = async (id: string, text: string) => {
    setCopyError('');
    setCopiedId(null);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setCopyError('Could not copy. Select the text and copy it manually, or allow clipboard access.');
    }
  };

  const handleShareWhatsApp = (text: string) => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const formattedDate = new Date(currentEvent.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 font-sans">
      
      {/* ─────────────────────────────────────────────────────────────
          1. STUDIO HEADER BAR
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <h1 className="page-title text-stone-900 dark:text-stone-50">
          Digital Invitation Studio
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-500">
          Refine your invitation, choose a tone and make every word your own.
        </p>
        <a href="#invitation-editor" className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4 xl:hidden">Edit invitation ↓</a>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. PURPOSE-BUILT SPLIT WORKSPACE:
             LEFT = INVITATION ARTIFACT PREVIEW
             RIGHT = WRITING & DISTRIBUTION STUDIO
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN (5 COLS): PHYSICAL / DIGITAL STATIONERY ARTIFACT */}
        <div className="xl:col-span-5 flex flex-col gap-3">
          <div className="flex min-h-[18px] items-center justify-between gap-3">
            <span className="text-caption">Invitation preview</span>
            <span className="text-caption">Updates as you write</span>
          </div>

          {/* Invitation Stationery Card */}
          <div 
            role="region" aria-label="Invitation preview"
            className={`flex-1 rounded-2xl p-6 sm:p-8 shadow-sm border relative flex flex-col justify-between min-h-[460px] transition-colors ${
              currentEvent.eventType === 'wedding' || currentEvent.eventType === 'anniversary'
                ? 'bg-[#FAF7F2] text-[#1C1917] border-[#E7DFD3] dark:bg-[#181614] dark:text-[#F7F4EB] dark:border-[#2F2B26]'
                : currentEvent.eventType === 'corporate_gala'
                ? 'bg-[#fff5ea] text-[#442d22] border-[#ddc5b3]'
                : 'bg-[#eee6fa] text-[#35264b] border-[#d7c7e9]'
            }`}
          >
            {/* Subtle inner framing line */}
            <div className="absolute inset-3 border border-current opacity-15 rounded-xl pointer-events-none" />

            {/* Top Stationery Header */}
            <div className="relative z-10 space-y-3 text-center pt-2">
              <span className="text-xs  uppercase tracking-widest opacity-70">
                You Are Cordially Invited To
              </span>
              <h2 className={`font-display text-2xl font-medium leading-[1.2] tracking-[-0.025em] ${
                currentEvent.eventType === 'wedding' ? 'font-serif italic' : ''
              }`}>
                {currentEvent.title}
              </h2>
              <div className="w-12 h-px bg-current opacity-25 mx-auto" />
            </div>

            {/* Middle Invitation Narrative Body */}
            {activeInvitation && (
              <div className="relative z-10 space-y-3 text-center my-6">
                <p className="text-base font-medium leading-relaxed opacity-85">
                  {activeInvitation.headline}
                </p>
                <p className={`text-sm leading-relaxed opacity-85 max-w-sm mx-auto whitespace-pre-line ${
                  currentEvent.eventType === 'wedding' ? 'font-serif italic' : ''
                }`}>
                  {activeInvitation.body}
                </p>
              </div>
            )}

            {/* Bottom Event Logistics & RSVP CTA */}
            <div className="relative z-10 space-y-4 pt-4 border-t border-current border-opacity-15 text-center text-sm">
              <div className="space-y-1 opacity-80 text-xs">
                <p className="font-medium flex items-center justify-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formattedDate}</span>
                </p>
                <p className="flex items-center justify-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="break-words min-w-0">{currentEvent.location}</span>
                </p>
                {activeInvitation?.dressCodeNote && (
                  <p className="opacity-75 text-xs">
                    Attire: {activeInvitation.dressCodeNote}
                  </p>
                )}
              </div>

              <p className="pt-1 text-xs font-medium">
                {activeInvitation?.rsvpCallToAction || 'Contact your host to RSVP.'}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7 COLS): WRITING & DISTRIBUTION STUDIO */}
        <div id="invitation-editor" className="xl:col-span-7 space-y-3 scroll-mt-44">
          <div className="flex min-h-[18px] items-center justify-between gap-3"><span className="text-caption">Invitation copy</span><span className="text-caption">Saved on this device</span></div>
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 sm:p-6 shadow-sm space-y-6">
            
            {/* Tone Variations Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="section-title text-stone-900 dark:text-stone-100">
                  Your invitation
                </h2>
                <p className="text-sm text-stone-500">Choose a starting tone, then make it yours.</p>
              </div>

              <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
                {invitations.map((inv) => (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => setSelectedInvStyle(inv.style)}
                    aria-pressed={activeInvitation?.id === inv.id}
                    className={`px-3 py-2.5 text-sm font-medium rounded-lg capitalize transition ${
                      activeInvitation?.id === inv.id
                        ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                        : 'text-stone-600 dark:text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    {inv.style}
                  </button>
                ))}
              </div>
            </div>

            {/* Adaptive Review Banner */}
            {activeInvitation?.needsReview && (
              <div
                role="status"
                className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-sm text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-fadeIn"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{activeInvitation.reviewReason || 'Event parameters have changed. Please verify invitation copy.'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => dismissInvitationReview(activeInvitation.id)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 transition self-end sm:self-auto"
                >
                  Mark Reviewed
                </button>
              </div>
            )}

            {/* Editable / Readable Copy Studio Fields */}
            {activeInvitation && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="invitation-headline" className="field-label">
                    Headline
                  </label>
                  <input
                    type="text"
                    id="invitation-headline"
                    value={activeInvitation.headline}
                    onChange={event => updateInvitation(activeInvitation.id, { headline: event.target.value })}
                    className="min-h-11 w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="invitation-body" className="field-label">
                    Invitation Narrative Body
                  </label>
                  <textarea
                    rows={7}
                    id="invitation-body"
                    value={activeInvitation.body}
                    onChange={event => updateInvitation(activeInvitation.id, { body: event.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-line focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label htmlFor="invitation-rsvp" className="field-label">
                      RSVP Call-to-Action
                    </label>
                    <input
                      type="text"
                      id="invitation-rsvp"
                    value={activeInvitation.rsvpCallToAction}
                    onChange={event => updateInvitation(activeInvitation.id, { rsvpCallToAction: event.target.value })}
                      className="min-h-11 w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="invitation-dress-code" className="field-label">
                      Dress Code Guidance
                    </label>
                    <input
                      type="text"
                      id="invitation-dress-code"
                    value={activeInvitation.dressCodeNote}
                    onChange={event => updateInvitation(activeInvitation.id, { dressCodeNote: event.target.value })}
                      className="min-h-11 w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="pt-5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        activeInvitation.id,
                        `${activeInvitation.headline}\n\n${activeInvitation.body}\n\nRSVP: ${activeInvitation.rsvpCallToAction}\nAttire: ${activeInvitation.dressCodeNote}`
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 transition"
                  >
                    {copiedId === activeInvitation.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                    <span>{copiedId === activeInvitation.id ? 'Copied!' : 'Copy Text'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleShareWhatsApp(
                        `✨ *${activeInvitation.headline}*\n\n${activeInvitation.body}\n\n📅 Date: ${currentEvent.eventDate}\n📍 Location: ${currentEvent.location}\n👔 Dress Code: ${activeInvitation.dressCodeNote}\n\n${activeInvitation.rsvpCallToAction}`
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition shadow-sm"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share via WhatsApp</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {copyError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{copyError}</p>}
      <p role="status" className="sr-only">{copiedId ? 'Copied to clipboard' : ''}</p>

      {/* ─────────────────────────────────────────────────────────────
          3. SPEECHES & TOASTS STUDIO ( Milanote-style cue cards )
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-title text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Mic className="w-4 h-4 text-stone-500" />
              <span>Speeches & Toast Drafts</span>
            </h2>
            <p className="text-sm text-stone-500">Prepared talking points and scripts for key participants</p>
          </div>
          <span className="text-sm  text-stone-500">{speeches.length} Speeches Prepared</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {speeches.map((sp) => (
            <div
              key={sp.id}
              className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 capitalize">
                    {sp.speakerRole}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 ">
                    <span className="px-2 py-0.5 rounded bg-stone-200/60 dark:bg-stone-800 text-stone-700 dark:text-stone-300 capitalize font-medium">
                      {sp.tone}
                    </span>
                    <span>• {sp.estimatedDuration}</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-stone-900 p-3 rounded-lg border border-stone-200/80 dark:border-stone-800">
                  <span className="text-caption block mb-2">
                    Key Highlights
                  </span>
                  <ul className="text-sm text-stone-600 dark:text-stone-300 list-disc list-inside space-y-0.5">
                    {sp.keyHighlights.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>

                <p className="text-sm text-stone-700 dark:text-stone-300 leading-[1.8] pt-1">
                  "{sp.content}"
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleCopy(sp.id, sp.content)}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  {copiedId === sp.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                  <span>{copiedId === sp.id ? 'Copied' : 'Copy Speech'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. AUDIO & INTERACTIVE CUES (Curated Soundtrack + Party Games)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Curated Playlist */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-stone-500" />
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Curated Soundtrack & Music Cues
            </h3>
          </div>
          <div className="space-y-2">
            {playlist.map((track, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800 text-sm text-stone-700 dark:text-stone-300 flex items-center gap-2"
              >
                <span className=" text-stone-500 text-xs">0{i + 1}</span>
                <span>{track}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Guest Activities */}
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-stone-500" />
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Interactive Guest Activities & Games
            </h3>
          </div>
          <div className="space-y-2">
            {games.map((game, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800 text-sm text-stone-700 dark:text-stone-300 flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{game}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
