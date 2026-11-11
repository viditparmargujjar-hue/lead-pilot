import { describe, expect, it } from 'vitest';
import { interpret, search } from './ai';
import { defaultLeadFilters, filterLeads, normalizeQuery } from './lead-search';

const find = (q: string, filters = defaultLeadFilters) => filterLeads(search(interpret(q)), q, filters, []);
describe('catalog search and filters', () => {
  it('matches company names and trims extra spaces', () => {
    expect(normalizeQuery('  CloudNova   Technologies  ')).toBe('CloudNova Technologies');
    expect(find('  CloudNova   Technologies  ').map(l => l.company.id)).toEqual(['c1']);
  });
  it('matches catalog keywords', () => expect(find('telemedicine').map(l => l.company.id)).toEqual(['c12']));
  it('matches locations', () => expect(find('Rotterdam').map(l => l.company.id)).toEqual(['c16']));
  it('combines industry, location and employee filters', () => expect(find('', { ...defaultLeadFilters, industry: 'SaaS', location: 'India', range: '51–200' }).map(l => l.company.id).sort()).toEqual(['c1', 'c3']));
  it('retains natural-language employee criteria', () => expect(find('SaaS companies in India with 50–500 employees').map(l => l.company.id).sort()).toEqual(['c1', 'c2', 'c3', 'c4']));
  it('shows all 26 catalog companies when search and filters reset', () => expect(find('')).toHaveLength(26));
  it('returns no results for an unknown query', () => expect(find('zzzzunknown')).toEqual([]));
  it('filters inclusive score bounds without changing scores', () => {
    const all = search({}); const score = all[0]?.score ?? 0;
    const rows = filterLeads(all, '', { ...defaultLeadFilters, minScore: score, maxScore: score }, []);
    expect(rows.length).toBeGreaterThan(0); expect(rows.every(l => l.score === score)).toBe(true);
  });
  it('uses actual hot labels', () => {
    const rows = find('SaaS India', { ...defaultLeadFilters, status: 'Hot' });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(l => l.score >= 80 && l.label === 'Hot')).toBe(true);
  });
  it('filters saved and reviewing records', () => {
    const saved = [{ companyId: 'c1', status: 'Reviewing' as const, savedAt: 1 }];
    for (const status of ['Saved', 'Reviewing']) expect(filterLeads(search({}), '', { ...defaultLeadFilters, status }, saved).map(l => l.company.id)).toEqual(['c1']);
  });
  it('deduplicates company IDs', () => { const leads = search({}); expect(filterLeads([...leads, ...leads], '', defaultLeadFilters, [])).toHaveLength(26); });
});