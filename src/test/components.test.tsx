import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    expect(screen.getByText('Financial Architecture')).toBeInTheDocument();
    expect(screen.getByText('Category Allocation Breakdown')).toBeInTheDocument();

    // Click Timeline Tab
    const timelineTab = screen.getByRole('tab', { name: /Run-of-Show/i });
    fireEvent.click(timelineTab);
    expect(screen.getByText('Run-of-Show & Minute-by-Minute Timeline')).toBeInTheDocument();
    expect(screen.getByText('Enter Day-of Mode')).toBeInTheDocument();

    // Click Guests Tab
    const guestsTab = screen.getByRole('tab', { name: /Guests & Catering/i });
    fireEvent.click(guestsTab);
    expect(screen.getByText('Guest Directory & Dietary Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Kitchen Dietary Aggregations')).toBeInTheDocument();

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
});
