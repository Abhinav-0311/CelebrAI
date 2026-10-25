import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { useEventStore } from '../store/eventStore';

describe('CelebrAI UI Integration & Flow Tests', () => {
  beforeEach(() => {
    useEventStore.getState().loadSampleEvent();
  });

  it('renders application brand, header, and system operating mode badge', () => {
    render(<App />);

    expect(screen.getAllByText('CelebrAI').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Sample Showcase/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Plan Event')).toBeInTheDocument();
  });

  it('navigates seamlessly across all core functional tabs', () => {
    render(<App />);

    // Click Budget Tab
    const budgetTab = screen.getByRole('tab', { name: /Budget & Expenses/i });
    fireEvent.click(budgetTab);
    expect(screen.getByRole('heading', { name: 'Budget & Spending Ledger' })).toBeInTheDocument();
    expect(screen.getByText('Category Allocation Breakdown')).toBeInTheDocument();

    // Click Timeline Tab
    const timelineTab = screen.getByRole('tab', { name: /Run-of-Show/i });
    fireEvent.click(timelineTab);
    expect(screen.getByText('Run-of-Show & Minute-by-Minute Timeline')).toBeInTheDocument();
    expect(screen.getByText('Enter Day-of Mode')).toBeInTheDocument();

    // Click Guests Tab
    const guestsTab = screen.getByRole('tab', { name: /Guests & Catering/i });
    fireEvent.click(guestsTab);
    expect(screen.getByText(/Guest Directory & Dietary/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Kitchen/i).length).toBeGreaterThanOrEqual(1);

    // Click Creative Studio Tab
    const creativeTab = screen.getByRole('tab', { name: /Creative Studio/i });
    fireEvent.click(creativeTab);
    expect(screen.getByText('Digital Invitation Studio')).toBeInTheDocument();
    expect(screen.getByText('Speeches & Toast Drafts')).toBeInTheDocument();

    // Click Vendors Tab
    const vendorsTab = screen.getByRole('tab', { name: /Vendors & RFPs/i });
    fireEvent.click(vendorsTab);
    expect(screen.getByText('Vendor Coordination & RFP Inquiry Drafts')).toBeInTheDocument();

    // Click Adaptive Engine Tab
    const intelTab = screen.getByRole('tab', { name: /Adaptive Engine/i });
    fireEvent.click(intelTab);
    expect(screen.getByText('Adaptive Event Intelligence Engine')).toBeInTheDocument();
  });

  it('opens and closes the Event Creation Wizard dialog', () => {
    render(<App />);

    const newEventBtn = screen.getByRole('button', { name: /Create new celebration plan/i });
    fireEvent.click(newEventBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Plan a New Celebration')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('activates and exits Live Day-of Mode on the Timeline', () => {
    render(<App />);

    const timelineTab = screen.getByRole('tab', { name: /Run-of-Show/i });
    fireEvent.click(timelineTab);

    const toggleModeBtn = screen.getByRole('button', { name: /Enter Day-of Mode/i });
    fireEvent.click(toggleModeBtn);

    expect(screen.getByText(/Day-of Execution Mode Active/i)).toBeInTheDocument();
    expect(screen.getByText('Exit Day-of Mode')).toBeInTheDocument();

    // Exit
    fireEvent.click(screen.getByRole('button', { name: /Exit Day-of Mode/i }));
    expect(screen.queryByText(/Day-of Execution Mode Active/i)).not.toBeInTheDocument();
  });

  it('triggers the Adaptive Event Intelligence Diff Modal when guest count changes', () => {
    render(<App />);

    // Go to Adaptive Engine tab to use simulator button
    const intelTab = screen.getByRole('tab', { name: /Adaptive Engine/i });
    fireEvent.click(intelTab);

    const expandBtn = screen.getByRole('button', { name: /\+30 Guests/i });
    fireEvent.click(expandBtn);

    // Modal opens
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Adaptive Intelligence Alert/i)).toBeInTheDocument();
    expect(screen.getByText(/Apply Recommendations/i)).toBeInTheDocument();

    // Apply
    const applyBtn = screen.getByRole('button', { name: /Apply Recommendations/i });
    fireEvent.click(applyBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // Guest count should now be 180
    expect(useEventStore.getState().currentEvent?.guestCount).toBe(180);
  });

  it('verifies OverviewTab displays $0.00 committed spend for fresh event and synchronizes quick-adjust inputs (Bug 1 & 2 fixes)', async () => {
    const { rerender } = render(<App />);

    // Initial sample event has 150 guests and $45,000 budget
    const guestInput = screen.getByLabelText(/Guest Count/i) as HTMLInputElement;
    const budgetInput = screen.getByLabelText(/Budget/i, { selector: 'input' }) as HTMLInputElement;
    expect(guestInput.value).toBe('150');
    expect(budgetInput.value).toBe('45000');

    // Create a new fresh event with 140 guests and $35,000 budget
    await act(async () => useEventStore.getState().createEvent({
      title: 'Montecito Garden Soirée',
      eventType: 'wedding',
      guestCount: 140,
      totalBudget: 35000,
      currency: 'USD',
      eventDate: '2026-10-10',
      timezone: 'America/Los_Angeles',
      location: 'Montecito Estate',
      venueType: 'garden',
      vibeKeywords: ['Elegant', 'Botanical'],
    }));

    rerender(<App />);

    // Bug 1 assertion: Fresh event committed spending in Overview must be strictly $0 and 100% uncommitted
    expect(screen.getByText(/Committed:/i)).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('100% Uncommitted')).toBeInTheDocument();

    // Bug 2 assertion: Inputs must be updated to new event's values (140, 35000) instead of stale 150, 45000
    const updatedGuestInput = screen.getByLabelText(/Guest Count/i) as HTMLInputElement;
    const updatedBudgetInput = screen.getByLabelText(/Budget/i, { selector: 'input' }) as HTMLInputElement;
    expect(updatedGuestInput.value).toBe('140');
    expect(updatedBudgetInput.value).toBe('35000');
  });
});
