import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { useEventStore } from '../store/eventStore';

beforeEach(() => {
  useEventStore.getState().loadSampleEvent();
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });
});
afterEach(() => vi.restoreAllMocks());

describe('Redesign interaction regressions', () => {
  it('connects every navigation tab to a panel and supports roving keyboard focus', () => {
    render(<App />);
    for (const tab of screen.getAllByRole('tab')) {
      expect(document.getElementById(tab.getAttribute('aria-controls')!)).toBeInTheDocument();
    }
    const overview = screen.getByRole('tab', { name: 'Overview' });
    overview.focus();
    fireEvent.keyDown(overview, { key: 'ArrowDown' });
    const budget = screen.getByRole('tab', { name: 'Budget & Expenses' });
    expect(budget).toHaveFocus();
    expect(budget).toHaveAttribute('aria-selected', 'true');
    expect(overview).toHaveAttribute('tabindex', '-1');
    fireEvent.keyDown(budget, { key: 'Home' });
    expect(overview).toHaveFocus();
  });

  it('supports horizontal navigation at mobile widths', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 320 });
    render(<App />);
    const overview = screen.getByRole('tab', { name: 'Overview' });
    overview.focus();
    fireEvent.keyDown(overview, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Budget & Expenses' })).toHaveFocus();
  });

  it('persists invitation edits independently per tone and preserves them through JSON transfer', () => {
    useEventStore.getState().setActiveTab('creative');
    render(<App />);
    fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'An evening together' } });
    fireEvent.change(screen.getByLabelText('Invitation Narrative Body'), { target: { value: 'Please join us for dinner.' } });
    expect(screen.getByText('An evening together', { selector: 'p' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'playful' }));
    expect(screen.getByLabelText('Headline')).not.toHaveValue('An evening together');
    fireEvent.click(screen.getByRole('button', { name: 'formal' }));
    expect(screen.getByLabelText('Headline')).toHaveValue('An evening together');
    const persisted = JSON.parse(localStorage.getItem('celebr-ai-storage-v1')!);
    expect(persisted.state.currentEvent.creative.invitations[0].body).toBe('Please join us for dinner.');
    const exported = useEventStore.getState().exportEventJson();
    act(() => {
      useEventStore.getState().loadSampleEvent();
      expect(useEventStore.getState().importEventJson(exported).success).toBe(true);
    });
    expect(useEventStore.getState().currentEvent?.creative.invitations[0].headline).toBe('An evening together');
    expect(useEventStore.getState().systemMode).toBe('offline');
  });

  it('reports clipboard rejection without announcing success', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } });
    useEventStore.getState().setActiveTab('creative');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy Text' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not copy');
    expect(screen.queryByRole('button', { name: 'Copied!' })).not.toBeInTheDocument();
  });

  it('announces clipboard success only after the write resolves', async () => {
    let finish!: () => void;
    const writeText = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    useEventStore.getState().setActiveTab('creative');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy Text' }));
    expect(screen.queryByRole('button', { name: 'Copied!' })).not.toBeInTheDocument();
    await act(async () => finish());
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
  });

  it('keeps custom-event operating mode truthful', () => {
    useEventStore.setState({ systemMode: 'offline', systemMessage: 'Imported event' });
    render(<App />);
    expect(screen.queryByText('Sample Showcase')).not.toBeInTheDocument();
    expect(screen.getAllByText('Offline Engine').length).toBeGreaterThan(0);
    act(() => useEventStore.setState({ systemMode: 'live' }));
    expect(screen.getAllByText('Live AI Engine').length).toBeGreaterThan(0);
  });

  it('uses a labelled expense dialog and records fractional currency exactly', async () => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: vi.fn(function(this: HTMLDialogElement) { this.setAttribute('open', ''); }) });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: vi.fn(function(this: HTMLDialogElement) { this.removeAttribute('open'); }) });
    useEventStore.getState().setActiveTab('budget');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Log Expense' }));
    expect(screen.getByRole('dialog', { name: 'Log Event Expense' })).toBeInTheDocument();
    const first = screen.getByLabelText('Expense Description *');
    const last = screen.getByRole('button', { name: 'Save Expense' });
    first.focus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(first).toHaveFocus();
    fireEvent.change(screen.getByLabelText('Expense Description *'), { target: { value: 'Test cents' } });
    fireEvent.change(screen.getByLabelText('Committed (USD) *'), { target: { value: '10.25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Expense' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(useEventStore.getState().currentEvent?.budget.expenses[0].actualCents).toBe(1025);
  });
});
