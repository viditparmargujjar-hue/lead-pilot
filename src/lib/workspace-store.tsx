import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useStore } from './store';
import { defaultPreferences, type FollowUp, type LeadList, type Preferences } from './workspace';
interface Workspace { lists: LeadList[]; tasks: FollowUp[]; preferences: Preferences }
const initial: Workspace = { lists: [], tasks: [], preferences: defaultPreferences };
const Ctx = createContext<{ data: Workspace; update: (fn: (previous: Workspace) => Workspace) => void } | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, update] = useState(initial); const [loaded, setLoaded] = useState(false); const { saved, loaded: leadsLoaded } = useStore();
  useEffect(() => { try { const raw = localStorage.getItem('leadpilot-workspace-v1'); if (raw) { const parsed = JSON.parse(raw); if (!Array.isArray(parsed.lists) || !Array.isArray(parsed.tasks)) throw new Error(); update({ ...initial, ...parsed, preferences: { ...defaultPreferences, ...parsed.preferences } }); } } catch { toast.error('Workspace data could not be read. A fresh workspace is available.'); } setLoaded(true); }, []);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem('leadpilot-workspace-v1', JSON.stringify(data)); } catch { toast.error('Browser storage is unavailable. Changes may not survive refresh.'); } }, [data, loaded]);
  useEffect(() => { if (!loaded || !leadsLoaded) return; const ids = new Set(saved.map(s => s.companyId)); update(prev => ({ ...prev, lists: prev.lists.map(l => ({ ...l, companyIds: l.companyIds.filter(id => ids.has(id)) })), tasks: prev.tasks.filter(t => ids.has(t.companyId)) })); }, [saved, loaded, leadsLoaded]);
  return <Ctx.Provider value={{ data, update }}>{children}</Ctx.Provider>;
}
export function useWorkspace() { const value = useContext(Ctx); if (!value) throw new Error('Workspace provider missing'); return { ...value.data, update: value.update }; }
