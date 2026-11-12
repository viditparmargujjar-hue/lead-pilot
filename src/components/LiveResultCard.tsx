import { useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { Bookmark, BookmarkCheck, ExternalLink, Globe, MapPin, Phone, Mail, MessageCircle, Sparkles, Building2, CalendarDays, CheckCircle2, UserRound, Layers3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CompareButton } from '@/components/CompareControls';
import { getLiveAnalysis, registerLiveCompany } from '@/lib/data';
import { discoveryDetails } from '@/lib/live-result-details';
import { toLeadProfile } from '@/lib/lead-profile';
import type { LiveResult } from '@/lib/live-search';

function Info({ icon: Icon, label, value, href }: { icon: typeof Globe; label: string; value: string | null | undefined; href?: string | undefined }) {
  if (!value) return null;
  return <div className="flex min-w-0 items-start gap-2.5"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><div className="min-w-0"><p className="text-[11px] text-muted-foreground">{label}</p>{href ? <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="break-all text-sm text-primary underline-offset-2 hover:underline">{value}</a> : <p className="break-words text-sm">{value}</p>}</div></div>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="space-y-3 border-t pt-4"><h3 className="text-sm font-semibold">{title}</h3><div className="grid gap-3 sm:grid-cols-2">{children}</div></section>;
}

export function LiveResultCard({ result: r, query, saved, onSave, selected = false, onSelect }: { result: LiveResult; query: string; saved: boolean; onSave: () => void; selected?: boolean; onSelect?: (checked: boolean) => void }) {
  const id = `live:${r.domain}`;
  const details = discoveryDetails(r, query);
  const cached = getLiveAnalysis(id);
  const analysis = cached?.criteria.trim().toLowerCase() === query.trim().toLowerCase() ? cached : undefined;
  const profile = toLeadProfile(r, query, analysis);
  const score = analysis ? analysis.score : details.score;
  const temperature = analysis ? analysis.temperature : details.temperature;
  const location = [analysis?.facts.headquartersCity?.value, analysis?.facts.headquartersRegion?.value, analysis?.facts.headquartersCountry?.value].filter(Boolean).join(', ');
  const prepare = () => registerLiveCompany({ ...r, query });
  const [open, setOpen] = useState(false);
  const tone = temperature === 'Hot' ? 'bg-hot-soft text-hot' : temperature === 'Warm' ? 'bg-warm-soft text-warm' : 'bg-muted text-muted-foreground';
  return (
    <>
      <article className={`lead-card card-surface flex min-w-0 flex-col gap-3 p-4 ${selected ? 'ring-2 ring-primary' : ''}`}>
        {onSelect && <label className="flex w-fit items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" aria-label={`Select ${profile.name}`} checked={selected} onChange={e => onSelect(e.target.checked)} className="h-4 w-4 accent-primary" />Select</label>}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border bg-muted text-muted-foreground"><Building2 className="h-5 w-5" /></span><div className="min-w-0"><h3 className="break-words font-semibold">{profile.name}</h3><p className="mt-0.5 break-all text-xs text-muted-foreground">{r.domain}</p></div></div>
          <span className="shrink-0 rounded-md border px-2 py-1 text-xs tabular-nums">{profile.completeness}% data</span>
        </div>
        <Progress aria-label={`Data completeness ${profile.completeness}%`} value={profile.completeness} className="h-1.5" />
        <div className="grid gap-3 border-y py-3 sm:grid-cols-2">
          {profile.phones[0] && <Info icon={Phone} label="Phone" value={profile.phones[0]} href={`tel:${profile.phones[0].replace(/[^+\d]/g, '')}`} />}
          {profile.emails[0] && <Info icon={Mail} label="Email" value={profile.emails[0]} href={`mailto:${profile.emails[0]}`} />}
          {profile.website && <Info icon={Globe} label="Website candidate" value={r.domain} href={profile.website} />}
          {(location || profile.location) && <Info icon={MapPin} label={analysis ? 'Headquarters · cited research' : 'Location'} value={location || profile.location} href={analysis?.facts.headquartersCity?.sourceUrl ?? undefined} />}
          {profile.industry && <Info icon={Layers3} label="Industry · not verified" value={profile.industry} />}
          {profile.employees && <Info icon={Building2} label="Company size · cited research" value={profile.employees} />}
        </div>
        <p className="line-clamp-3 break-words text-sm text-muted-foreground">{profile.description || 'No business description was returned.'}</p>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <div><p className="text-[11px] text-muted-foreground">{analysis ? 'Research relevance' : 'Excerpt-based relevance'}</p><span className="font-semibold tabular-nums">{score === null ? 'Not assessed' : `${score} / 100`}</span> <span className={`rounded-md px-2 py-1 text-xs font-semibold ${tone}`}>{temperature}</span></div>
          <div className="flex flex-wrap gap-1.5"><Button size="sm" variant="outline" onClick={() => setOpen(true)}>View details</Button><Button size="sm" variant={saved ? 'secondary' : 'outline'} onClick={onSave}>{saved ? <><BookmarkCheck />Saved</> : <><Bookmark />Save</>}</Button></div>
        </div>
        <div className="flex flex-wrap gap-2"><span onClickCapture={prepare}><CompareButton id={id} name={profile.name} /></span><Button size="sm" variant="outline" asChild><Link to="/research" search={{ id }} onClick={prepare}><Sparkles />Research</Link></Button>{profile.whatsapp && <Button size="sm" variant="outline" asChild><a href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><MessageCircle />WhatsApp</a></Button>}</div>
        <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground underline"><ExternalLink className="h-3 w-3" />Original source{r.published ? ` · ${r.published}` : ''}</a>
      </article>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader className="pr-8 text-left"><SheetTitle className="break-words">{profile.name}</SheetTitle><SheetDescription>{r.domain} · {profile.completeness}% data completeness</SheetDescription></SheetHeader>
          <div className="mt-6 space-y-5">
            <Section title="Business overview"><Info icon={Layers3} label="Industry · excerpt-based" value={profile.industry} /><Info icon={Building2} label="Description" value={profile.description} /><Info icon={Layers3} label="Products and services · cited research" value={profile.products} /><Info icon={Building2} label="Size · cited research" value={profile.employees} /></Section>
            <Section title="Contact details"><Info icon={Phone} label="Phone" value={profile.phones.join(' · ')} href={profile.phones[0] ? `tel:${profile.phones[0].replace(/[^+\d]/g, '')}` : undefined} /><Info icon={Mail} label="Email" value={profile.emails.join(' · ')} href={profile.emails[0] ? `mailto:${profile.emails[0]}` : undefined} /><Info icon={MessageCircle} label="WhatsApp · only if sourced" value={profile.whatsapp} href={profile.whatsapp ? `https://wa.me/${profile.whatsapp.replace(/\D/g, '')}` : undefined} /><Info icon={UserRound} label="Contact person · cited research" value={profile.contacts} /></Section>
            <Section title="Location"><Info icon={MapPin} label={analysis ? 'Headquarters · cited research' : 'Location · excerpt-based'} value={location || profile.location} href={analysis?.facts.headquartersCity?.sourceUrl ?? undefined} /><Info icon={Building2} label="Offices · cited research" value={analysis?.facts.offices?.value} /></Section>
            <Section title="Online presence"><Info icon={Globe} label="Website candidate" value={profile.domain} href={profile.website ?? undefined} /><Info icon={ExternalLink} label="LinkedIn · excerpt or cited research" value={profile.linkedin} href={profile.linkedin ?? undefined} /><Info icon={ExternalLink} label="Instagram" value={profile.instagram} href={profile.instagram ?? undefined} /><Info icon={ExternalLink} label="Facebook" value={profile.facebook} href={profile.facebook ?? undefined} /><Info icon={ExternalLink} label="YouTube" value={profile.youtube} href={profile.youtube ?? undefined} /></Section>
            <Section title="Company intelligence"><Info icon={Layers3} label="Products and services · cited research" value={profile.products} /><Info icon={Building2} label="Target market · cited research" value={analysis?.facts.targetMarket?.value} /><Info icon={Sparkles} label="Hiring or growth signals · cited research" value={analysis?.signals.filter(s => ['hiring', 'expansion', 'growth'].includes(s.kind)).map(s => s.claim.value).join(' · ')} /></Section>
            <Section title="Source and data status"><Info icon={ExternalLink} label="Original data source" value={profile.sourceUrl} href={profile.sourceUrl} /><Info icon={CalendarDays} label="Retrieved" value={new Date(profile.retrievedAt).toLocaleString()} /><Info icon={CheckCircle2} label="Research status" value={profile.verified ? 'Cited full-page research available' : 'Search excerpt only; not verified'} /><Info icon={Layers3} label="Data completeness · not a quality score" value={`${profile.completeness}%`} />{analysis?.pages.map(p => <Info key={p.url} icon={ExternalLink} label={p.official ? 'Official evidence page' : 'Evidence page'} value={p.url} href={p.url} />)}</Section>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}