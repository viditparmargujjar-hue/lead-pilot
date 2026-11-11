import { Link, useRouterState } from '@tanstack/react-router';
import { Home, Search, Bookmark, Sparkles, Menu, Compass, History, GitCompareArrows, FolderOpen, CalendarClock, Send, ChartNoAxesCombined, ArrowDownUp, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from './ui/sheet';
import { useWorkspace } from '@/lib/workspace-store';
import { useSystemThemeListener } from '@/lib/theme';

const groups = [
  { label: 'Workspace', items: [{ to: '/', label: 'Home', icon: Home }, { to: '/find', label: 'Find Leads', icon: Search }, { to: '/leads', label: 'My Leads', icon: Bookmark }, { to: '/lists', label: 'Lead Lists', icon: FolderOpen }, { to: '/compare', label: 'Compare Leads', icon: GitCompareArrows }] },
  { label: 'Productivity', items: [{ to: '/tasks', label: 'Tasks & Follow-ups', icon: CalendarClock }, { to: '/outreach', label: 'Outreach Planner', icon: Send }, { to: '/history', label: 'Search History', icon: History }] },
  { label: 'Intelligence', items: [{ to: '/research', label: 'AI Research', icon: Sparkles }, { to: '/reports', label: 'Reports & Analytics', icon: ChartNoAxesCombined }] },
  { label: 'Tools', items: [{ to: '/import-export', label: 'Import & Export', icon: ArrowDownUp }, { to: '/settings', label: 'Settings', icon: Settings }] },
] as const;

const COLLAPSE_KEY = 'leadpilot-sidebar-collapsed';

function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3" aria-label="LeadPilot AI home">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"><Compass className="h-5 w-5" /></span>
      {!collapsed && <span className="font-display text-lg font-semibold text-sidebar-foreground">LeadPilot <span className="text-sidebar-primary">AI</span></span>}
    </Link>
  );
}

function NavLinks({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) {
  const path = useRouterState({ select: s => s.location.pathname });
  return (
    <nav className="space-y-6" aria-label="Primary">
      {groups.map(group => (
        <div key={group.label}>
          {!collapsed && <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">{group.label}</p>}
          <div className="space-y-0.5">
            {group.items.map(n => {
              const active = path === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  title={collapsed ? n.label : undefined}
                  className={`relative flex min-h-9 items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${collapsed ? 'justify-center px-0' : ''} ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'}`}
                >
                  {active && !collapsed && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-primary" aria-hidden />}
                  <n.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {!collapsed && n.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function DemoNote({ collapsed }: { collapsed?: boolean }) {
  if (collapsed) return null;
  return (
    <div className="mt-5 border-t border-sidebar-border pt-4 text-[11px] leading-relaxed text-sidebar-foreground/50">
      <span className="font-semibold text-sidebar-foreground/80">Demo workspace</span><br />
      Fictional companies. Unverified data.<br />
      Saved on this device.
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);
  const { preferences } = useWorkspace();
  useSystemThemeListener();
  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1'); } catch { /* storage unavailable */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); } catch { /* storage unavailable */ }
  }, [collapsed, ready]);

  return (
    <div data-density={preferences.density} className="flex min-h-screen w-full">
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col overflow-y-auto bg-sidebar p-4 transition-[width] duration-200 lg:flex ${collapsed ? 'w-[4.5rem]' : 'w-60'}`}>
        <div className={`mb-6 border-b border-sidebar-border pb-6 pt-1 ${collapsed ? 'flex justify-center' : 'px-1'}`}><Logo collapsed={collapsed} /></div>
        <NavLinks collapsed={collapsed} />
        <div className="mt-auto space-y-3 pt-4">
          <DemoNote collapsed={collapsed} />
          <Button variant="ghost"
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={collapsed}
            className={`flex min-h-8 w-full items-center gap-2 rounded-md px-3 py-1.5 text-[12px] font-medium text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${collapsed ? 'justify-center px-0' : ''}`}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" />Collapse</>}
          </Button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 lg:hidden">
          <Logo />
          <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setOpen(true)} className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"><Menu /></Button>
        </header>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-72 overflow-y-auto border-sidebar-border bg-sidebar p-5">
            <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
            <SheetDescription className="sr-only">LeadPilot pages</SheetDescription>
            <div className="mb-8"><Logo /></div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <DemoNote />
          </SheetContent>
        </Sheet>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}
