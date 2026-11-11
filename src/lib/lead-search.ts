import { interpret, type Criteria, type ScoredLead } from './ai';
import { companies, getResearch } from './data';
import type { SavedLead } from './store';

export interface LeadFilters { industry: string; location: string; range: string; minScore: number; maxScore: number; status: string }
export const defaultLeadFilters: LeadFilters = { industry: '', location: '', range: '', minScore: 0, maxScore: 100, status: '' };
export const employeeRanges: Record<string, [number, number]> = { '1–50': [1, 50], '51–200': [51, 200], '201–500': [201, 500], '501+': [501, Infinity] };
export const normalizeQuery = (query: string) => query.trim().replace(/\s+/g, ' ');
const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const filler = new Set('find show me all the a an and or in with that may need needs software companies company employees employee people businesses business relevant to for of startups startup growing growth fast expanding hiring over more than above under less below fewer between from based located tools'.split(' '));

function matchesQuery(lead: ScoredLead, query: string, criteria: Criteria) {
  if (!query) return true;
  const c = lead.company;
  if (criteria.industry && c.industry !== criteria.industry) return false;
  if (criteria.location && ![c.city, c.country, c.region].includes(criteria.location)) return false;
  if (criteria.minEmp != null && c.employees < criteria.minEmp) return false;
  if (criteria.maxEmp != null && c.employees > criteria.maxEmp) return false;
  const research = getResearch(c.id);
  if (criteria.growth && !research?.signals.some(s => ['Hiring', 'Growth', 'Expansion'].includes(s))) return false;
  const haystack = normalize([c.name, c.industry, c.city, c.country, c.region, ...c.tags, research?.summary, research?.potentialNeed].join(' '));
  const structuredTerms = normalize([criteria.industry, criteria.location].filter(Boolean).join(' ')).split(' ');
  const aliases = new Set(criteria.industry === 'AI' ? ['artificial', 'intelligence', 'machine', 'learning', 'genai'] : []);
  if (criteria.location === 'United States') aliases.add('usa');
  if (criteria.location === 'United Kingdom') aliases.add('uk');
  const tokens = normalize(query).split(' ').filter(token => token && !filler.has(token) && !structuredTerms.includes(token) && !aliases.has(token) && !/^\d+$/.test(token));
  return tokens.every(token => haystack.includes(token));
}

export function filterLeads(leads: ScoredLead[], query: string, filters: LeadFilters, saved: SavedLead[]) {
  const criteria = interpret(normalizeQuery(query));
  const seen = new Set<string>();
  return leads.filter(lead => {
    const c = lead.company;
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    if (!matchesQuery(lead, normalizeQuery(query), criteria)) return false;
    if (filters.industry && c.industry !== filters.industry) return false;
    if (filters.location && ![c.city, c.country, c.region].includes(filters.location)) return false;
    const range = employeeRanges[filters.range];
    if (range && (c.employees < range[0] || c.employees > range[1])) return false;
    if (lead.score < filters.minScore || lead.score > filters.maxScore) return false;
    const record = saved.find(s => s.companyId === c.id);
    if (filters.status === 'Hot' && lead.label !== 'Hot') return false;
    if (filters.status === 'Saved' && !record) return false;
    if (['New', 'Reviewing', 'Contacted'].includes(filters.status) && record?.status !== filters.status) return false;
    return true;
  });
}

export const filterIndustries = [...new Set(companies.map(c => c.industry))].sort();
export const filterLocations = [...new Set(companies.flatMap(c => [c.city, c.country, c.region]))].sort();