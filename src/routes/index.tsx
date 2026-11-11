import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, Bookmark, Building2, Database, Flame, CalendarClock, Search, GitCompareArrows, Plus, FolderOpen, Send, Sparkles, Lightbulb, History, MapPin, Users, Globe } from 'lucide-react';
import { LabelBadge, ResearchButton, SaveButton, ScoreRing } from '@/components/LeadCard';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/WorkspaceUI';
import { search } from '@/lib/ai';
import { useStore } from '@/lib/store';
import { useWorkspace } from '@/lib/workspace-store';
import { useHistory } from '@/lib/history';
import { getCompany } from '@/lib/data';
import { metrics, taskStatus } from '@/lib/workspace';
import { pageMeta } from '@/lib/page-meta';

export const Route = createFileRoute('/')({ head: () => pageMeta('Home', 'Your operational lead workspace: saved companies, recommendations, follow-ups and recent searches.'), component: Home });

const QUICK_ACTIONS = [
  { to: '/leads', label: 'View My Leads', icon: Bookmark },
  { to: '/compare', label: 'Compare Leads', icon: GitCompareArrows },
  { to: '/tasks', label: 'Create Follow-up', icon: Plus },
  { to: '/lists', label: 'Organize Lists', icon: FolderOpen },
  { to: '/outreach', label: 'Plan Outreach', icon: Send },
  { to: '/research', label: 'AI Research', icon: Sparkles },
] as const;

function SectionTitle({ title, to, hint }: { title: string; to?: string; hint?: string }) {
  return (
    <div className="dashboard-section-title mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {hint && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      </div>
      {to && <Button asChild variant="ghost" size="icon"><Link to={to} aria-label={`View ${title}`} title={`View ${title}`}><ArrowRight className="h-4 w-4" /></Link></Button>}
    </div>
  );
}

function Home() {
  const { saved, criteria, query, loaded } = useStore();
  const { tasks } = useWorkspace();
  const { items } = useHistory();
  const all = search(criteria);
  const m = metrics(saved, tasks, criteria);
  const upcoming = tasks.filter(t => t.status !== 'Completed').sort((a, b) => a.due.localeCompare(b.due));

  const kpis = [
    { label: 'Total Leads', value: m.available, icon: Database, hint: 'Fictional demo catalog' },
    { label: 'Saved Leads', value: m.saved, icon: Bookmark, hint: 'Actually saved by you' },
    { label: 'Hot Leads', value: m.hot, icon: Flame, hint: 'Saved leads · score 80+' },
    { label: 'Pending Follow-ups', value: m.pending, icon: CalendarClock, hint: 'Includes overdue tasks' },
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header mb-7 flex flex-col gap-5 border-b pb-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground"><Sparkles className="h-3.5 w-3.5 text-primary" />LeadPilot AI <span className="mx-1 text-border" aria-hidden> / </span> Workspace</p>
          <h1 className="text-2xl font-semibold sm:text-3xl">Welcome to your<br className="hidden sm:block" /> lead workspace</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Your saved leads, next steps, and latest discoveries.</p>
        </div>
        <Button asChild size="lg" className="dashboard-find shrink-0 self-start sm:self-auto"><Link to="/find"><Search />Find leads<ArrowRight /></Link></Button>
      </header>

      <div className="dashboard-metrics grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(k => (
          <div key={k.label} className="dashboard-metric card-surface p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-foreground">
              <span>{k.label}</span>
              <span className="dashboard-metric-icon grid h-8 w-8 shrink-0 place-items-center rounded-md"><k.icon className="h-4 w-4" /></span>
            </div>
            <div className="dashboard-metric-value tabular mt-3 text-4xl font-semibold" aria-live="polite">{loaded ? k.value : '—'}</div>
            <div className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{k.hint}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-columns mt-9 grid gap-8 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 space-y-8">
          <section>
            <SectionTitle title="Top Recommended Leads" to="/find" hint={`Fictional demo recommendations · ${query ? 'Based on your current search' : 'SaaS · India · 50–500 employees · CRM'}.`} />
            <div className="space-y-3">
              {!all.length && <EmptyState title="No recommended leads"><Button asChild variant="outline"><Link to="/find"><Search />Find leads</Link></Button></EmptyState>}
              {all.slice(0, 3).map((lead, index) => (
                <article key={lead.company.id} className={`dashboard-lead card-surface p-4 sm:p-6 ${index === 0 ? 'dashboard-lead-featured' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div aria-hidden className="dashboard-company-mark grid h-11 w-11 shrink-0 place-items-center rounded-md border font-display text-base font-semibold">{lead.company.name.split(' ').map(word => word[0]).slice(0, 2).join('')}</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-base font-semibold sm:text-lg">{lead.company.name}</h3>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground"><span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" />{lead.company.website}</span><span className="dashboard-demo-label">Fictional company</span></p>
                    </div>
                    <div className="dashboard-score flex shrink-0 flex-col items-center gap-1"><ScoreRing score={lead.score} label={lead.label} size={50} /><span className="text-[10px] text-muted-foreground">Relevance</span></div>
                  </div>
                  <div className="dashboard-metadata mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span><Building2 className="h-3.5 w-3.5" />{lead.company.industry}</span>
                    <span><MapPin className="h-3.5 w-3.5" />{lead.company.city}, {lead.company.country}</span>
                    <span><Users className="h-3.5 w-3.5" />{lead.company.employees} employees</span>
                  </div>
                  <div className="dashboard-explanation mt-4 flex gap-2.5 rounded-md p-3.5">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-insight" />
                    <div className="min-w-0"><p className="text-[13px] leading-relaxed text-foreground">{lead.why}</p><p className="mt-2 text-[10px] text-muted-foreground">AI match explanation · unverified demo data</p></div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="dashboard-lead-label inline-flex items-center"><LabelBadge label={lead.label} /></span>
                    <div className="flex flex-wrap gap-2"><SaveButton id={lead.company.id} name={lead.company.name} /><ResearchButton id={lead.company.id} /></div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle title="Recently Saved Leads" to="/leads" />
            {!saved.length ? <EmptyState title="No saved leads yet" /> : (
              <div className="divide-y border-y">
                {[...saved].sort((a, b) => b.savedAt - a.savedAt).slice(0, 4).map(s => {
                  const c = getCompany(s.companyId);
                  return c && (
                    <div key={s.companyId} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Bookmark className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold">{c.name}</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">{s.status} · Saved {new Date(s.savedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <ResearchButton id={s.companyId} />
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="dashboard-rail min-w-0 space-y-8 xl:border-l xl:pl-6">
          <section>
            <SectionTitle title="Quick Actions" />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {QUICK_ACTIONS.map(a => (
                <Button key={a.to} asChild variant="ghost" className="dashboard-quick-action h-auto min-h-12 justify-start whitespace-normal border px-3 py-2.5 text-[13px]">
                  <Link to={a.to}><span className="dashboard-action-icon grid h-8 w-8 shrink-0 place-items-center rounded-md"><a.icon /></span><span className="flex-1">{a.label}</span><ArrowRight className="text-muted-foreground" /></Link>
                </Button>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle title="Upcoming Follow-ups" to="/tasks" />
            {!upcoming.length ? <EmptyState title="No pending follow-ups" /> : (
              <div className="divide-y border-y">
                {upcoming.slice(0, 4).map(t => (
                  <div key={t.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <h3 className="break-words text-sm font-semibold">{t.title}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">{getCompany(t.companyId)?.name} · {t.due}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-medium ${taskStatus(t) === 'Overdue' ? 'text-hot' : 'text-muted-foreground'}`}>{taskStatus(t)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionTitle title="Recent Search History" to="/history" />
            {!items.length ? <EmptyState title="No searches yet" /> : (
              <div className="divide-y border-y">
                {items.slice(0, 3).map(i => (
                  <div key={i.id} className="flex items-start gap-2.5 py-3 text-sm">
                    <History className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                    <p className="break-words font-medium">{i.query}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{new Date(i.at).toLocaleString()} · {i.count ?? 'Unknown'} results</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
