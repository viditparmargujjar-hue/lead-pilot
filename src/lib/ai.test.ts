import { describe, expect, it } from 'vitest';
import { interpret, search, weightedScore } from './ai';
describe('existing search and scoring', () => {
 it('interprets industry, location and employee range', () => expect(interpret('SaaS companies in India with 50-500 employees')).toMatchObject({ industry: 'SaaS', location: 'India', minEmp: 50, maxEmp: 500 }));
 it('keeps criteria scoring and match breakdown consistent', () => { const rows = search(interpret('SaaS companies in India with 50-500 employees')); expect(rows[0]?.company.industry).toBe('SaaS'); expect(rows[0]?.company.country).toBe('India'); for (const row of rows) expect(row.score).toBe(weightedScore(row.breakdown)); });
});
