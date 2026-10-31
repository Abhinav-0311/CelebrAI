import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuestsTab } from '../components/guests/GuestsTab';
import { TimelineTab } from '../components/timeline/TimelineTab';
import { BudgetTab } from '../components/budget/BudgetTab';
import { useEventStore } from '../store/eventStore';

beforeEach(() => useEventStore.getState().loadSampleEvent());

describe('Operator workflows through accessible controls', () => {
  it('adds a guest with dietary preferences, finds them and removes the record', async () => {
    const user = userEvent.setup();
    render(<GuestsTab />);
    await user.click(screen.getByRole('button', { name: 'Add Guest' }));
    await user.type(screen.getByLabelText('Full Name *'), 'Asha Demo');
    await user.type(screen.getByLabelText('Email Address'), 'asha@example.com');
    await user.selectOptions(screen.getByLabelText('RSVP Status'), 'attending');
    await user.clear(screen.getByLabelText('Plus-Ones'));
    await user.type(screen.getByLabelText('Plus-Ones'), '1');
    await user.clear(screen.getByLabelText('Table #'));
    await user.type(screen.getByLabelText('Table #'), '4');
    const vegan = screen.getByRole('button', { name: 'vegan' });
    await user.click(vegan);
    expect(vegan).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByLabelText('Mark as VIP Guest / Honoree'));
    await user.click(screen.getByRole('button', { name: 'Save Guest' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Search guests'), 'Asha');
    await user.click(screen.getByRole('button', { name: 'attending' }));
    const row = screen.getByRole('row', { name: /Asha Demo/ });
    expect(within(row).getByText('vegan')).toBeInTheDocument();
    expect(within(row).getByText('Table 4')).toBeInTheDocument();
    expect(within(row).getByText('2 (+1)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete guest Asha Demo' }));
    expect(screen.queryByRole('row', { name: /Asha Demo/ })).not.toBeInTheDocument();
  });

  it('adds a labelled timeline cue with operational details and removes it', async () => {
    const user = userEvent.setup();
    render(<TimelineTab />);
    await user.click(screen.getByRole('button', { name: 'Add Cue' }));
    await user.type(screen.getByLabelText('Milestone Title *'), 'Dinner service check');
    await user.clear(screen.getByLabelText('Scheduled Time (24h) *'));
    await user.type(screen.getByLabelText('Scheduled Time (24h) *'), '18:45');
    await user.clear(screen.getByLabelText('Duration (Minutes)'));
    await user.type(screen.getByLabelText('Duration (Minutes)'), '45');
    await user.selectOptions(screen.getByLabelText('Category *'), 'meal');
    await user.clear(screen.getByLabelText('Assigned Lead'));
    await user.type(screen.getByLabelText('Assigned Lead'), 'Team lead');
    await user.type(screen.getByLabelText('Stage Directions & Cue Notes'), 'Check dietary meals');
    await user.click(screen.getByRole('button', { name: 'Save Milestone' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Dinner service check')).toBeInTheDocument();
    expect(screen.getByText('Team lead')).toBeInTheDocument();
    expect(screen.getByText('18:45')).toBeInTheDocument();
    expect(screen.getByText('(45 mins)')).toBeInTheDocument();
    expect(screen.getByText('Check dietary meals')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete milestone Dinner service check' }));
    expect(screen.queryByText('Dinner service check')).not.toBeInTheDocument();
  });

  it('recovers from empty ledger filters and updates payment totals through the ledger', async () => {
    const user = userEvent.setup();
    render(<BudgetTab />);
    await user.type(screen.getByRole('searchbox', { name: 'Search expense ledger' }), 'no-such-expense');
    expect(screen.getByText('No matching expenses')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await user.selectOptions(screen.getByLabelText('Filter expenses by category'), 'venue');
    await user.click(screen.getByRole('button', { name: /Mark Skyline Pavilion Rental.* as unpaid/ }));
    expect(screen.getByText('$24,700')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Delete expense Skyline Pavilion Rental/ }));
    expect(screen.queryByText('Skyline Pavilion Rental & Security Deposit')).not.toBeInTheDocument();
    expect(screen.getByText('$30,150')).toBeInTheDocument();
  });
});
