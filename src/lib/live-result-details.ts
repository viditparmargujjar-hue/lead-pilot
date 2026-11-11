import type { LiveResult } from './live-search';
import { isDirectoryDomain } from './live-search';

const categories = [
  ['AI', /\b(?:ai|artificial intelligence|machine learning)\b/i],
  ['SaaS', /\b(?:saas|software as a service)\b/i],
  ['Fintech', /\b(?:fintech|financial technology)\b/i],
  ['Cybersecurity', /\b(?:cybersecurity|cyber security)\b/i],
  ['Restaurants', /\b(?:restaurants?|restorents?|dining|eatery)\b/i],
  ['Hotels', /\b(?:hotels?|resorts?|hospitality)\b/i],
  ['Healthcare', /\b(?:healthcare|healthtech|hospitals?|clinics?)\b/i],
  ['E-commerce', /\b(?:e-commerce|ecommerce|online retail)\b/i],
] as const;
const stop = new Set('companies company startups startup growing in at of the a an and or for with that may need official website employees industry services products'.split(' '));
const words = (text: string): string[] => text.toLowerCase().match(/[a-z]+(?:-[a-z]+)*/g) ?? [];

/** Discovery excerpts support a provisional assessment, never verified research facts. */
export function discoveryDetails(result: LiveResult, query: string) {
  const text = `${result.name} ${result.description}`;
  const target = categories.find(([, pattern]) => pattern.test(query));
  const industry = categories.find(([, pattern]) => pattern.test(text));
  const terms = [...new Set(words(query).filter(w => !stop.has(w) && w.length > 1))];
  const matched = terms.filter(w => words(text).includes(w));
  const direct = /\b(?:we (?:are|build|offer|provide|develop)|(?:company|platform|restaurant|hotel) (?:that |which )?(?:provides|offers|builds|specializ)|(?:provides|offers|develops) .{0,80}(?:services|solutions|software))\b/i.test(result.description);
  const fit = !!target && target[1].test(text) && direct && terms.length > 0 && matched.length === terms.length;
  // Only date-bearing, explicit signals are counted; careers links and popularity are not intent.
  const sentences = result.description.split(/(?<=[.!?])\s+|\n+/);
  const recent = sentences.filter(sentence => {
    const dates = sentence.match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? [];
    return dates.some(date => { const age = Date.parse(result.fetchedAt) - Date.parse(date); return Number.isFinite(age) && age >= 0 && age <= 180 * 86400000; });
  });
  const buying = fit ? recent.find(s => /\b(?:seeking|looking for|request for proposals|inviting bids)\b/i.test(s) && /\b(?:vendors?|suppliers?|proposals|software|solutions)\b/i.test(s) && terms.some(t => words(s).includes(t))) : undefined;
  const growth = fit ? recent.find(s => /\b(?:expanding|expansion|hiring|opened|opening)\b/i.test(s) && terms.some(t => words(s).includes(t))) : undefined;
  const score = fit ? buying ? 90 : growth ? 70 : 55 : null;
  const location = sentences.find(s => /\b(?:headquarters|head office|registered office|corporate office|branch|office located|based in|located in)\b/i.test(s));
  return {
    industry: industry?.[0] ?? null,
    location: location ?? null,
    locationKind: location && /\b(?:headquarters|head office|registered office)\b/i.test(location) ? 'Headquarters reported' : 'Location / office reported',
    score,
    temperature: score === null ? 'Insufficient data' : score >= 75 ? 'Hot' : score >= 40 ? 'Warm' : 'Cold',
    reason: score === null ? 'The excerpt does not establish a direct company offering and all search criteria; no score assigned.' : buying ? 'Direct offering matches the search; a recent, explicit buying request is reported.' : growth ? 'Direct offering matches the search; recent growth is reported, not confirmed buying intent.' : 'Direct offering matches the search. Relevance alone does not establish buying intent.',
    buying: buying ?? 'No confirmed buying-intent evidence in the search excerpt.',
  };
}

export function relevantLiveResults(results: LiveResult[], query: string): LiveResult[] {
  const seen = new Set<string>();
  const target = categories.find(([, pattern]) => pattern.test(query));
  const terms = words(query).filter(w => !stop.has(w) && w.length > 1);
  const place = query.match(/\bin\s+(.+?)(?:\s+with\b|\s+that\b|$)/i)?.[1];
  const placeTerms = place ? words(place).filter(w => !stop.has(w)) : [];
  return results.filter(r => {
    if (!r.website || isDirectoryDomain(r.domain) || /(^|\.)(?:pitchbook\.com|indiaai\.gov\.in)$/.test(r.domain) || seen.has(r.domain)) return false;
    if (/\b(?:top \d+|best \d+|list of|directory of|companies to watch|company profile|valuation, funding|news portal)\b/i.test(r.name)) return false;
    const text = `${r.name} ${r.description}`;
    if (target && !target[1].test(text)) return false;
    if (placeTerms.length && !placeTerms.every(t => words(text).includes(t))) return false;
    // Non-hospitality searches exclude hospitality businesses, not software sold to them.
    if (target && !['Hotels', 'Restaurants'].includes(target[0]) && /\b(?:welcome to|stay at|book (?:a |your )?room|our (?:hotel|restaurant)|hotel in|restaurant in)\b/i.test(text)) return false;
    if (!target && terms.length && !terms.some(t => words(text).includes(t))) return false;
    seen.add(r.domain);
    return true;
  });
}