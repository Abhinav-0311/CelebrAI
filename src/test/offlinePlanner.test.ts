import { describe, it, expect } from 'vitest';
import { generateDeterministicPlan, reconcileBudgetCents } from '../services/offlinePlanner';
import { AIEventPlanResponseSchema, EventCreationInput } from '../types/schemas';
import { dollarsToCents } from '../types/event';

describe('Offline Deterministic Planner (Cents Precision)', () => {
  const sampleInput: EventCreationInput = {
    title: 'Emerald Garden Wedding',
    eventType: 'wedding',
    guestCount: 120,
    totalBudget: 35000,
    currency: 'USD',
    eventDate: '2026-12-15',
    timezone: 'America/Los_Angeles',
    location: 'Botanical Conservatory, Portland, OR',
    venueType: 'garden',
    vibeKeywords: ['Romantic', 'Botanical', 'Intimate'],
  };

  it('generates a schema-compliant event plan with integer minor currency units', () => {
    const plan = generateDeterministicPlan(sampleInput);
    const parsed = AIEventPlanResponseSchema.safeParse(plan);

    expect(parsed.success).toBe(true);
    expect(plan.theme.conceptTitle).toContain('Botanical');
    expect(plan.theme.colorPalette.length).toBeGreaterThanOrEqual(4);
    expect(plan.allocations.length).toBeGreaterThan(0);
    expect(plan.milestones.length).toBeGreaterThan(0);
    expect(plan.vendorCategories.length).toBeGreaterThan(0);
    expect(plan.creative.invitations.length).toBeGreaterThanOrEqual(2);
  });

  it('reconciles budget allocations to the exact single cent (zero drift)', () => {
    const targetCents = dollarsToCents(35000); // 3,500,000 cents
    const plan = generateDeterministicPlan(sampleInput);
    const totalAllocatedCents = plan.allocations.reduce((sum, a) => sum + a.allocatedCents, 0);

    // Exact mathematical equality down to the single cent
    expect(totalAllocatedCents).toBe(targetCents);
  });

  it('reconcileBudgetCents uses largest-remainder method with odd budget numbers', () => {
    // Test with an odd budget amount that does not divide cleanly by percentages
    const oddBudgetCents = 3333333; // $33,333.33
    const pcts = [
      { category: 'catering', name: 'Catering', pct: 33 },
      { category: 'venue', name: 'Venue', pct: 33 },
      { category: 'decor', name: 'Decor', pct: 34 },
    ];

    const allocations = reconcileBudgetCents(oddBudgetCents, pcts);
    const sumCents = allocations.reduce((sum, a) => sum + a.allocatedCents, 0);

    expect(sumCents).toBe(oddBudgetCents);
  });

  it('generates appropriate corporate gala milestones and theme', () => {
    const galaInput: EventCreationInput = {
      title: 'Global Tech Leadership Summit Gala',
      eventType: 'corporate_gala',
      guestCount: 250,
      totalBudget: 75000,
      currency: 'USD',
      eventDate: '2026-11-20',
      timezone: 'America/New_York',
      location: 'Metropolitan Convention Center',
      venueType: 'ballroom',
      vibeKeywords: ['Innovative', 'Prestigious'],
    };

    const plan = generateDeterministicPlan(galaInput);
    expect(plan.theme.dressCode).toContain('Black Tie');
    const keynoteMilestone = plan.milestones.find((m) => m.category === 'speech' || m.title.includes('Highlight'));
    expect(keynoteMilestone).toBeDefined();

    const sumGalaCents = plan.allocations.reduce((sum, a) => sum + a.allocatedCents, 0);
    expect(sumGalaCents).toBe(dollarsToCents(75000));
  });
});
