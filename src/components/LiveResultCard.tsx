import { Link } from '@tanstack/react-router';
import { Bookmark, BookmarkCheck, ExternalLink, Globe, MapPin, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompareButton } from '@/components/CompareControls';
import { getLiveAnalysis, registerLiveCompany } from '@/lib/data';
import { discoveryDetails } from '@/lib/live-result-details';
import type { LiveResult } from '@/lib/live-search';

export function LiveResultCard({ result: r, query, saved, onSave }: { result: LiveResult; query: string; saved: boolean; onSave: () => void }) {
  const id = `live:${r.domain}`;
  const details = discoveryDetails(r, query);
  const cached = getLiveAnalysis(id);
  const analysis = cached?.criteria.trim().toLowerCase() === query.trim().toLowerCase() ? cached : undefined;
  const score = analysis ? analysis.score : details.score;
  const temperature = analysis ? analysis.temperature : details.temperature;
  const location = analysis ? [analysis.facts.headquartersCity?.value, analysis.facts.headquartersRegion?.value, analysis.facts.headquartersCountry?.value].filter(Boolean).join(', ') : '';
  const prepare = () => registerLiveCompany({ ...r, query });
  const tone = temperature === 'Hot' ? 'bg-hot-soft text-hot' : temperature === 'Warm' ? 'bg-warm-soft text-warm' : 'bg-muted text-muted-foreground';
  return (
    <article className="lead-card card-surface flex min-w-0 flex-col gap-3 p-4">
      <h3 className="break-words font-semibold">{analysis?.facts.name?.value ?? r.name}</h3>
      <a href={r.website} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-start gap-1 text-sm text-primary"><Globe className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="break-all">{r.domain}</span></a>
      <p className="text-xs text-muted-foreground">Company website candidate · sourced by Tavily</p>
      <p className="text-sm"><span className="font-medium">Industry: </span>{analysis?.facts.industry?.value ?? (details.industry ? `${details.industry} · excerpt-based` : 'Industry not verified')}</p>
      <div className="flex items-start gap-1.5 text-sm"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><div><p>{location ? `Headquarters: ${location}` : 'Location not verified'}</p>{location && <a href={analysis?.facts.headquartersCity?.sourceUrl ?? analysis?.facts.headquartersCountry?.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">Location evidence</a>}{!location && details.location && <p className="mt-1 text-xs text-muted-foreground">{details.locationKind} in excerpt (unverified): {details.location}</p>}{analysis?.facts.offices && <p className="mt-1 text-xs text-muted-foreground">Offices / branches: {analysis.facts.offices.value}</p>}</div></div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-y py-3">
        <div><p className="text-xs text-muted-foreground">{analysis ? 'Research score' : 'Excerpt-based relevance score'}</p><p className="font-semibold tabular-nums">{score === null ? 'Insufficient data' : `${score} / 100`}</p></div>
        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${tone}`}>{temperature}</span>
      </div>
      <p className="text-xs text-muted-foreground">{analysis?.reason ?? details.reason}</p>
      <p className="break-words whitespace-pre-line text-sm text-muted-foreground"><span className="font-medium text-foreground">Description{analysis?.facts.overview ? '' : ' · unverified excerpt'}: </span>{analysis?.facts.overview?.value ?? (r.description.replace(/#{1,6}\s*/g, '').replace(/[\uE000-\uF8FF]/g, '').trim() || 'No excerpt returned.')}</p>
      <p className="break-words text-xs text-muted-foreground"><span className="font-medium text-foreground">Buying intent: </span>{analysis ? analysis.signals.filter(s => s.kind === 'buying').map(s => s.claim.value).join('; ') || 'No confirmed buying-intent evidence.' : details.buying}</p>
      <div className="mt-auto flex flex-wrap gap-2 border-t pt-3">
        <Button size="sm" variant={saved ? 'secondary' : 'outline'} onClick={onSave}>{saved ? <><BookmarkCheck />Saved</> : <><Bookmark />Save lead</>}</Button>
        <span onClickCapture={prepare}><CompareButton id={id} name={r.name} /></span>
        <Button size="sm" variant="outline" asChild><Link to="/research" search={{ id }} onClick={prepare}><Sparkles />AI Research</Link></Button>
      </div>
      <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground underline"><ExternalLink className="h-3 w-3" />View source{r.published ? ` · ${r.published}` : ''}</a>
    </article>
  );
}