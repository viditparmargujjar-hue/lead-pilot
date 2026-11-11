import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { CalendarClock, Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ConfirmDelete, EmptyState, fieldClass, LeadSelect } from '@/components/WorkspaceUI';
import { getCompany } from '@/lib/data';
import { useStore } from '@/lib/store';
import { useWorkspace } from '@/lib/workspace-store';
import { followUpStage, OUTREACH_STAGES, outreachMetrics, taskStatus, type FollowUp, type OutreachStage } from '@/lib/workspace';
import { pageMeta } from '@/lib/page-meta';

export const Route = createFileRoute('/tasks')({
  head: () => pageMeta('Tasks & Follow-ups', 'Manage saved-lead follow-ups, due dates, outreach stages and lead conversion.'),
  component: Tasks,
});

const blank = (): FollowUp => ({ id: '', companyId: '', title: '', notes: '', due: '', status: 'Pending', outreachStage: 'Not contacted' });
const stageStyle: Record<OutreachStage, string> = {
  'Not contacted': 'bg-muted text-muted-foreground',
  Sent: 'bg-potential-soft text-potential',
  Replied: 'bg-warm-soft text-warm',
  Converted: 'bg-insight-soft text-insight',
};

function Tasks() {
  const { tasks, update } = useWorkspace();
  const { saved } = useStore();
  const [draft, setDraft] = useState<FollowUp | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');
  const rows = tasks.filter(t => filter === 'All' || taskStatus(t) === filter).sort((a, b) => a.due.localeCompare(b.due));
  const pipeline = outreachMetrics(tasks);

  const setStage = (id: string, outreachStage: OutreachStage) => {
    update(previous => ({ ...previous, tasks: previous.tasks.map(task => task.id === id ? { ...task, outreachStage } : task) }));
    toast.success(`Outreach stage set to ${outreachStage}`);
  };

  return (
    <>
      <PageHeader title="Tasks & Follow-ups" description="Track conversations from first outreach to conversion, organized by due date.">
        <Button disabled={!saved.length} onClick={() => setDraft(blank())}><Plus />Create follow-up</Button>
      </PageHeader>

      <section aria-labelledby="pipeline-title" className="card-surface mb-6 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="pipeline-title" className="text-base font-semibold">Outreach pipeline</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Each lead appears at the furthest stage across their follow-ups.</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-medium text-muted-foreground">Lead conversion rate</p>
            <p className="mt-1 text-3xl font-semibold tabular" aria-live="polite">{pipeline.conversionRate == null ? '—' : `${pipeline.conversionRate}%`}</p>
            <p className="mt-1 text-xs text-muted-foreground">{pipeline.contacted ? `${pipeline.converted} converted of ${pipeline.contacted} contacted leads` : 'No contacted leads yet'}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          {(['Sent', 'Replied', 'Converted'] as const).map(stage => (
            <div key={stage} className={`rounded-lg px-3 py-3 ${stageStyle[stage]}`}>
              <p className="text-xs font-medium">{stage}</p>
              <p className="mt-1 text-2xl font-semibold tabular">{pipeline[stage.toLowerCase() as 'sent' | 'replied' | 'converted']}</p>
              <p className="mt-0.5 hidden text-[11px] opacity-75 sm:block">current leads</p>
            </div>
          ))}
        </div>
        <progress aria-label="Lead conversion rate" value={pipeline.converted} max={pipeline.contacted || 1} className="mt-4 h-2 w-full accent-primary" />
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">Conversion = converted leads ÷ contacted leads. Multiple follow-ups for the same lead count once.</p>
      </section>

      <div className="mb-6 flex flex-wrap gap-2">
        {['All', 'Pending', 'Overdue', 'Completed'].map(status => (
          <Button key={status} variant={filter === status ? 'default' : 'outline'} onClick={() => setFilter(status)}>
            {status}<span className="opacity-70">{tasks.filter(t => status === 'All' || taskStatus(t) === status).length}</span>
          </Button>
        ))}
      </div>

      {!rows.length ? (
        <EmptyState title={saved.length ? 'No follow-ups in this view' : 'Save a lead to create your first follow-up'} />
      ) : (
        <div className="divide-y border-y">
          {rows.map(task => {
            const companyName = getCompany(task.companyId)?.name ?? 'Saved lead';
            const stage = followUpStage(task);
            return (
              <div key={task.id} className="flex flex-wrap items-center gap-4 py-5">
                <CalendarClock className="h-5 w-5 text-primary" />
                <div className="min-w-0 flex-1 basis-[calc(100%-3rem)] sm:basis-0">
                  <h2 className="break-words text-base font-semibold">{task.title}</h2>
                  <p className="text-sm text-muted-foreground">{companyName} · {task.due}</p>
                  {task.notes && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{task.notes}</p>}
                </div>
                <span className={`rounded-md px-2 py-1 text-xs font-medium ${taskStatus(task) === 'Overdue' ? 'bg-hot-soft text-hot' : taskStatus(task) === 'Completed' ? 'bg-insight-soft text-insight' : 'bg-potential-soft text-potential'}`}>{taskStatus(task)}</span>
                <select
                  aria-label={`Outreach stage for ${companyName}`}
                  value={stage}
                  onChange={event => setStage(task.id, event.target.value as OutreachStage)}
                  className={`h-9 rounded-lg border-0 px-3 text-sm font-semibold ${stageStyle[stage]}`}
                >
                  {OUTREACH_STAGES.map(option => <option key={option}>{option}</option>)}
                </select>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" title="Mark completed" aria-label="Mark completed" disabled={task.status === 'Completed'} onClick={() => update(previous => ({ ...previous, tasks: previous.tasks.map(item => item.id === task.id ? { ...item, status: 'Completed' } : item) }))}><Check /></Button>
                  <Button variant="ghost" size="icon" title="Edit task" aria-label="Edit task" onClick={() => setDraft(task)}><Pencil /></Button>
                  <Button variant="ghost" size="icon" title="Delete task" aria-label="Delete task" onClick={() => setDeleting(task.id)}><Trash2 /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(draft)} onOpenChange={open => { if (!open) setDraft(null); }}>
        <DialogContent>
          <DialogTitle>{draft?.id ? 'Edit follow-up' : 'Create follow-up'}</DialogTitle>
          <DialogDescription>Saved locally. No email or calendar reminders are sent.</DialogDescription>
          {draft && (
            <form className="space-y-4" onSubmit={event => {
              event.preventDefault();
              if (!draft.title.trim() || !saved.some(s => s.companyId === draft.companyId)) return;
              const task: FollowUp = { ...draft, outreachStage: followUpStage(draft), title: draft.title.trim(), id: draft.id || crypto.randomUUID() };
              update(previous => ({ ...previous, tasks: draft.id ? previous.tasks.map(item => item.id === task.id ? task : item) : [...previous.tasks, task] }));
              setDraft(null);
              toast.success('Follow-up saved');
            }}>
              <label className="block space-y-1 text-sm">Related lead<LeadSelect value={draft.companyId} onChange={companyId => setDraft({ ...draft, companyId })} /></label>
              <label className="block space-y-1 text-sm">Task title<input required maxLength={160} className={fieldClass} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /></label>
              <label className="block space-y-1 text-sm">Notes<textarea className={`${fieldClass} h-24 py-2`} value={draft.notes} onChange={event => setDraft({ ...draft, notes: event.target.value })} /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 text-sm">Due date<input required type="date" className={fieldClass} value={draft.due} onChange={event => setDraft({ ...draft, due: event.target.value })} /></label>
                <label className="space-y-1 text-sm">Status<select className={fieldClass} value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value as FollowUp['status'] })}>{['Pending', 'Completed', 'Overdue'].map(status => <option key={status}>{status}</option>)}</select></label>
              </div>
              <label className="block space-y-1 text-sm">Outreach stage
                <select aria-label="Outreach stage" className={fieldClass} value={followUpStage(draft)} onChange={event => setDraft({ ...draft, outreachStage: event.target.value as OutreachStage })}>
                  {OUTREACH_STAGES.map(stage => <option key={stage}>{stage}</option>)}
                </select>
              </label>
              <div className="flex justify-end"><Button type="submit">Save follow-up</Button></div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDelete open={Boolean(deleting)} onClose={() => setDeleting(null)} description="Delete this follow-up? This cannot be undone." onConfirm={() => update(previous => ({ ...previous, tasks: previous.tasks.filter(task => task.id !== deleting) }))} />
    </>
  );
}
