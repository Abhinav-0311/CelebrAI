import { describe, it, expect } from 'vitest';
import { generateDeterministicPlan } from '../services/offlinePlanner';
import { AIEventPlanResponseSchema, EventCreationInput } from '../types/schemas';

describe('Offline Deterministic Planner', () => {
  const sampleInput: EventCreationInput = {
    title: 'Emerald Garden Wedding',
    eventType: 'wedding',
    guestCount: 120,
    totalBudget: 35000,
    currency: 'USD',
    eventDate: '2026-12-15',
    location: 'Botanical Conservatory, Portland, OR',
    venueType: 'garden',
    vibeKeywords: ['Romantic', 'Botanical', 'Intimate'],
  };

  it('generates a schema-compliant event plan for weddings', () => {
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

  it('calculates mathematically sound budget allocations', () => {
    const plan = generateDeterministicPlan(sampleInput);
    const totalAllocated = plan.allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);

    // Sum of allocations should match totalBudget closely (within rounding margin)
    expect(Math.abs(totalAllocated - sampleInput.totalBudget)).toBeLessThanOrEqual(10);
    
    // Catering should be the largest single allocation for weddings
    const catering = plan.allocations.find((a) => a.category === 'catering');
    expect(catering).toBeDefined();
    expect(catering?.percentage).toBe(38);
  });

  it('generates appropriate corporate gala milestones and theme', () => {
    const galaInput: EventCreationInput = {
      title: 'Global Tech Leadership Summit Gala',
      eventType: 'corporate_gala',
      guestCount: 250,
      totalBudget: 75000,
      currency: 'USD',
      eventDate: '2026-11-20',
      location: 'Metropolitan Convention Center',
      venueType: 'ballroom',
      vibeKeywords: ['Innovative', 'Prestigious'],
    };

    const plan = generateDeterministicPlan(galaInput);
    expect(plan.theme.dressCode).toContain('Black Tie');
    const keynoteMilestone = plan.milestones.find((m) => m.category === 'speech' || m.title.includes('Highlight'));
    expect(keynoteMilestone).toBeDefined();
  });
});
