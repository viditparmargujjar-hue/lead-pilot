import { createFileRoute } from '@tanstack/react-router';
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/AppShell';
import { fieldClass } from '@/components/WorkspaceUI';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useWorkspace } from '@/lib/workspace-store';
import { useTheme, type ThemeChoice } from '@/lib/theme';
import type { Preferences } from '@/lib/workspace';
import { pageMeta } from '@/lib/page-meta';

export const Route = createFileRoute('/settings')({ head: () => pageMeta('Settings', 'Theme, display preferences and information about your locally stored demo workspace.'), component: Settings });

const themes: { value: ThemeChoice; label: string; hint: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', hint: 'Clean white surfaces', icon: Sun },
  { value: 'dark', label: 'Dark', hint: 'Navy and charcoal', icon: Moon },
  { value: 'system', label: 'System', hint: 'Follows your device', icon: Monitor },
];

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children?: ReactNode }) {
  return (
    <section aria-labelledby={id} className="card-surface p-5 sm:p-6">
      <h2 id={id} className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>}
      {children && <div className="mt-5 space-y-4">{children}</div>}
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid items-center gap-2 text-sm sm:grid-cols-2">
      <span><span className="font-medium">{label}</span>{hint && <span className="block text-xs text-muted-foreground">{hint}</span>}</span>
      {children}
    </label>
  );
}

function resetWorkspace() {
  try { Object.keys(localStorage).filter(k => k.startsWith('leadpilot-')).forEach(k => localStorage.removeItem(k)); } catch { /* storage unavailable */ }
  window.location.reload();
}

function Settings() {
  const { preferences, update } = useWorkspace();
  const { theme, setTheme } = useTheme();
  function change<K extends keyof Preferences>(key: K, value: Preferences[K]) { update(p => ({ ...p, preferences: { ...p.preferences, [key]: value } })); }

  return (
    <>
      <PageHeader title="Settings" description="Changes apply immediately and are saved in this browser." />
      <div className="max-w-3xl space-y-6">
        <Section id="appearance" title="Appearance" description="Choose how LeadPilot looks across every page.">
          <div role="radiogroup" aria-label="Theme" className="grid gap-3 sm:grid-cols-3">
            {themes.map(t => {
              const active = theme === t.value;
              return (
                <button key={t.value} type="button" role="radio" aria-checked={active} onClick={() => setTheme(t.value)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? 'border-primary bg-primary-soft' : 'bg-card hover:border-input hover:bg-muted'}`}>
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}><t.icon className="h-4 w-4" /></span>
                  <span><span className="block text-sm font-medium">{t.label}</span><span className="block text-xs text-muted-foreground">{t.hint}</span></span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section id="display" title="Display preferences">
          <Row label="Workspace density" hint="Tighter spacing on pages and cards"><select className={fieldClass} value={preferences.density} onChange={e => change('density', e.target.value as Preferences['density'])}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></Row>
          <Row label="Default saved lead view" hint="Used on My Leads"><select className={fieldClass} value={preferences.leadView} onChange={e => change('leadView', e.target.value as Preferences['leadView'])}><option value="detailed">Detailed</option><option value="compact">Compact</option></select></Row>
          <Row label="Default saved lead sorting" hint="Used on My Leads"><select className={fieldClass} value={preferences.sort} onChange={e => change('sort', e.target.value as Preferences['sort'])}><option value="high">Highest score</option><option value="recent">Recently saved</option></select></Row>
        </Section>

        <Section id="search" title="Search" description="Find Leads searches the built-in demo catalog only. Filters are set per search and reset with the Reset button; no live web search provider is connected, so there are no provider settings yet." />

        <Section id="notifications" title="Notifications" description="In-app: confirmations appear as short pop-up messages and cannot be turned off. Email: not configured — no emails or calendar reminders are sent, so there is nothing to enable here." />

        <Section id="account" title="Account and security" description="This workspace has no sign-in. There is no account, profile or password to manage, and data is not synced between devices." />

        <Section id="data" title="Data and privacy" description="All companies, scores and research signals are fictional demo data. Saved leads, lists, follow-ups, preferences, theme and search history are stored only in this browser. Export saved leads from Import & Export before clearing.">
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline" className="text-destructive hover:text-destructive">Reset workspace data</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all workspace data?</AlertDialogTitle>
                <AlertDialogDescription>This permanently removes saved leads, lists, follow-ups, comparisons, search history and preferences from this browser. It cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetWorkspace} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Reset data</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Section>

        <Section id="about" title="About" description="LeadPilot AI — B2B lead finder demo. No version number has been published yet." />
      </div>
    </>
  );
}
