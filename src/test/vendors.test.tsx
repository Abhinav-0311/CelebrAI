import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VendorsTab } from '../components/vendors/VendorsTab';
import { useEventStore } from '../store/eventStore';

beforeEach(() => useEventStore.getState().loadSampleEvent());

describe('Vendor inquiry clipboard feedback', () => {
  it('reports denied clipboard access without announcing success', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) },
    });
    render(<VendorsTab />);
    await user.click(screen.getAllByRole('button', { name: 'Copy Email' })[0]);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not copy');
    expect(screen.queryByRole('button', { name: 'Copied!' })).not.toBeInTheDocument();
  });

  it('waits for a completed write before announcing success', async () => {
    const user = userEvent.setup();
    let finish!: () => void;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true, value: { writeText: vi.fn(() => new Promise<void>(resolve => { finish = resolve; })) },
    });
    render(<VendorsTab />);
    await user.click(screen.getAllByRole('button', { name: 'Copy Email' })[0]);
    expect(screen.queryByRole('button', { name: 'Copied!' })).not.toBeInTheDocument();
    await act(async () => finish());
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument();
  });
});
