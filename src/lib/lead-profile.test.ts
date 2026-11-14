import { describe, expect, it } from 'vitest';
import { leadsToCsv, toLeadProfile } from './lead-profile';
import type { LiveResult } from './live-search';

const result = (description: string): LiveResult => ({
  name: 'Example company', website: 'https://example.test', domain: 'example.test', description,
  sourceUrl: 'https://example.test/about', published: null, fetchedAt: '2026-11-10T08:00:00.000Z',
});

describe('live lead profile normalization', () => {
  it('leaves missing contact, location and company-size data empty and measures completeness only', () => {
    const profile = toLeadProfile(result(''), 'unrelated');
    expect(profile.phones).toEqual([]);
    expect(profile.emails).toEqual([]);
    expect(profile.location).toBeNull();
    expect(profile.employees).toBeNull();
    expect(profile.completeness).toBe(25);
    expect(profile.verified).toBe(false);
    expect(profile.retrievedAt).toBe('2026-11-10T08:00:00.000Z');
  });

  it('maps only contact and industry details actually present in the search excerpt', () => {
    const profile = toLeadProfile(result('AI company. Contact hello@example.test at +1 (212) 555-0134. https://www.linkedin.com/company/example-co'), 'AI');
    expect(profile.industry).toBe('AI');
    expect(profile.emails).toEqual(['hello@example.test']);
    expect(profile.phones).toContain('+1 (212) 555-0134');
    expect(profile.linkedin).toBe('https://www.linkedin.com/company/example-co');
    expect(profile.completeness).toBe(75);
  });

  it('leaves the separate category export field empty when the source only identifies industry', () => {
    const profile = toLeadProfile(result('AI company.'), 'AI');
    const [, values] = leadsToCsv([profile]).split('\n');
    expect(values?.split(',')[1]).toBe('');
    expect(values?.split(',')[2]).toBe('AI');
  });
});