import { describe, expect, it } from 'vitest';
import { discoveryDetails, relevantLiveResults } from './live-result-details';
import type { LiveResult } from './live-search';
const result = (description: string, domain = 'real.test'): LiveResult => ({ name: 'Real company', description, domain, website: `https://${domain}`, sourceUrl: `https://${domain}/about`, published: null, fetchedAt: '2026-11-10T08:44:00Z' });
describe('live excerpt accuracy', () => {
  it('never derives company location from the query', () => { expect(discoveryDetails(result('We provide AI services.'), 'AI companies in Haridwar India').location).toBeNull(); });
  it('distinguishes branch location from headquarters', () => { expect(discoveryDetails(result('Our branch is in Pune, Maharashtra, India.'), 'AI').locationKind).toBe('Location / office reported'); expect(discoveryDetails(result('Headquarters: Pune, Maharashtra, India.'), 'AI').locationKind).toBe('Headquarters reported'); });
  it('assigns no score for incomplete criteria evidence', () => { expect(discoveryDetails(result('We provide AI services.'), 'AI India').score).toBeNull(); });
  it('general relevance is Warm 55 and not buying intent', () => { const d = discoveryDetails(result('We provide AI services in India. We are famous with 10000 employees.'), 'AI India'); expect(d.score).toBe(55); expect(d.temperature).toBe('Warm'); });
  it('recent relevant growth is Warm 70', () => { const d = discoveryDetails(result('We provide AI services in India. On 2026-11-01 we are hiring AI engineers.'), 'AI India'); expect(d.score).toBe(70); expect(d.temperature).toBe('Warm'); });
  it('only explicit recent relevant buying intent is Hot 90', () => { const d = discoveryDetails(result('We provide AI services in India. On 2026-11-01 we are seeking AI software vendors.'), 'AI India'); expect(d.score).toBe(90); expect(d.temperature).toBe('Hot'); });
  it('undated and old buying signals cannot make a Hot lead', () => { for (const date of ['', '2020-11-01']) expect(discoveryDetails(result(`We provide AI services in India. ${date} We are seeking AI software vendors.`), 'AI India').score).toBe(55); });
  it('removes directories, duplicates and unrelated hospitality results', () => { const company = result('We provide AI services.'); expect(relevantLiveResults([company, company, result('AI companies directory', 'clutch.co'), result('Welcome to our hotel in India.', 'hotel.test')], 'AI companies India')).toEqual([company]); });
  it('keeps restaurants when restaurants are the requested industry', () => { const r = result('Our restaurant serves food in Haridwar.'); expect(relevantLiveResults([r], 'restorents in haridwar')).toEqual([r]); });
  it('excludes company-profile directories and public news portals', () => { expect(relevantLiveResults([result('AI in India', 'pitchbook.com'), result('AI in India', 'indiaai.gov.in')], 'AI India')).toEqual([]); });
  it('excludes results lacking the explicitly requested place without inventing location', () => { expect(relevantLiveResults([result('We provide AI services in India.')], 'AI companies in Meerut India')).toEqual([]); });
});