import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { useEventStore } from '../store/eventStore';
import { sampleEventData } from '../services/sampleEvent';
import { EventCreationSchema } from '../types/schemas';

const storageKey = 'celebr-ai-storage-v1';
const saved = () => ({ version: 1, state: {
  currentEvent: structuredClone(sampleEventData), systemMode: 'live', systemMessage: 'Saved live plan',
} });

beforeEach(() => {
  localStorage.clear();
  useEventStore.setState({ storageRecoveryJson: null });
  useEventStore.getState().loadSampleEvent();
});
afterEach(() => {
  cleanup();
  useEventStore.setState({ storageRecoveryJson: null });
  useEventStore.getState().loadSampleEvent();
});

describe('Saved-plan recovery', () => {
  it.each([
    ['malformed JSON', '{broken saved JSON'],
    ['empty JSON', ''],
    ['invalid mode', JSON.stringify({ ...saved(), state: { ...saved().state, systemMode: 'unknown-mode' } })],
    ['incomplete event', JSON.stringify({ version: 1, state: { currentEvent: { id: 'broken' } } })],
    ['unsupported version', JSON.stringify({ ...saved(), version: 99 })],
    ['invalid currency', JSON.stringify({ ...saved(), state: { ...saved().state,
      currentEvent: { ...sampleEventData, budget: { ...sampleEventData.budget, currency: 'not-a-currency' } },
    } })],
  ])('keeps the original %s available while opening a usable workspace', async (_name, raw) => {
    localStorage.setItem(storageKey, raw);
    await act(async () => { await useEventStore.persist.rehydrate(); });
    render(<App />);
    expect(screen.getByRole('heading', { name: 'No Event Loaded' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('saved plan could not be restored');
    expect(screen.getByRole('button', { name: 'Download saved data' })).toBeEnabled();
    expect(useEventStore.getState().storageRecoveryJson).toBe(raw);
    expect(localStorage.getItem(storageKey)).toBe(raw);
    act(() => useEventStore.getState().loadSampleEvent());
    expect(JSON.parse(localStorage.getItem(storageKey)!).state.storageRecoveryJson).toBe(raw);
    await act(async () => { await useEventStore.persist.rehydrate(); });
    expect(useEventStore.getState().storageRecoveryJson).toBe(raw);
  });

  it('restores a valid saved plan without a recovery warning or replacing actions', async () => {
    const original = saved();
    original.state.currentEvent.timeline.milestones[0].completedAt = '2026-12-20T18:00:00Z';
    const payload = { ...original, state: { ...original.state, setActiveTab: 'not a function' } };
    localStorage.setItem(storageKey, JSON.stringify(payload));
    await useEventStore.persist.rehydrate();
    expect(useEventStore.getState().currentEvent).toEqual(original.state.currentEvent);
    expect(useEventStore.getState().systemMode).toBe('live');
    const exported = useEventStore.getState().exportEventJson();
    expect(useEventStore.getState().importEventJson(exported).success).toBe(true);
    expect(useEventStore.getState().currentEvent).toEqual(original.state.currentEvent);
    expect(useEventStore.getState().storageRecoveryJson).toBeNull();
    useEventStore.getState().setActiveTab('budget');
    expect(useEventStore.getState().activeTab).toBe('budget');
  });

  it('restores an explicitly empty workspace and handles missing storage', async () => {
    const payload = saved();
    localStorage.setItem(storageKey, JSON.stringify({ ...payload, state: { ...payload.state, currentEvent: null } }));
    await useEventStore.persist.rehydrate();
    expect(useEventStore.getState().currentEvent).toBeNull();
    expect(useEventStore.getState().storageRecoveryJson).toBeNull();
    localStorage.clear();
    await useEventStore.persist.rehydrate();
    expect(useEventStore.getState().storageRecoveryJson).toBeNull();
  });

  it('downloads the original saved bytes without replacing them', async () => {
    const raw = '{original damaged saved data';
    localStorage.setItem(storageKey, raw);
    await useEventStore.persist.rehydrate();
    const createUrl = vi.fn().mockReturnValue('blob:recovery');
    vi.stubGlobal('URL', { createObjectURL: createUrl, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('celebr-ai-saved-data-recovery.json');
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Download saved data' }));
    expect(click).toHaveBeenCalledOnce();
    const blob = createUrl.mock.calls[0][0] as Blob;
    const downloaded = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsText(blob);
    });
    expect(downloaded).toBe(raw);
    expect(localStorage.getItem(storageKey)).toBe(raw);
  });
});

describe('Currency boundaries', () => {
  it.each(['not-a-currency', '', 'US', '123'])('rejects %s before replacing the current plan', currency => {
    const current = useEventStore.getState().currentEvent;
    const input = { title: 'Currency test', eventType: 'wedding', guestCount: 100, totalBudget: 25000,
      eventDate: '2026-12-20', location: 'City Hall', venueType: 'indoor', currency };
    expect(EventCreationSchema.safeParse(input).success).toBe(false);
    const event = { ...sampleEventData, budget: { ...sampleEventData.budget, currency } };
    const result = useEventStore.getState().importEventJson(JSON.stringify(event));
    expect(result.success).toBe(false);
    expect(result.error).toContain('budget.currency');
    expect(useEventStore.getState().currentEvent).toBe(current);
  });

  it.each(['USD', 'INR', 'EUR', 'GBP', 'usd'])('retains the supported formatting code %s', currency => {
    const event = { ...sampleEventData, budget: { ...sampleEventData.budget, currency } };
    expect(useEventStore.getState().importEventJson(JSON.stringify(event)).success).toBe(true);
    expect(useEventStore.getState().currentEvent?.budget.currency).toBe(currency);
  });
});
