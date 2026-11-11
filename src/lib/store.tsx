import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_CRITERIA, type Criteria } from "./ai";
import { getCompany, loadLiveCompanies } from "./data";
import { toast } from "sonner";

export type Status = "New" | "Reviewing" | "Contacted";
export interface SavedLead {
  companyId: string;
  status: Status;
  savedAt: number;
}

interface Store {
  loaded: boolean;
  saved: SavedLead[];
  criteria: Criteria;
  query: string;
  setSearch: (query: string, c: Criteria) => void;
  isSaved: (id: string) => boolean;
  toggleSave: (id: string) => boolean;
  setStatus: (id: string, s: Status) => void;
  saveMany: (ids: string[]) => void;
}

const KEY = "leadpilot-demo-v1";

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<SavedLead[]>([]);
  const [criteria, setCriteria] = useState<Criteria>(DEFAULT_CRITERIA);
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadLiveCompanies();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const value = JSON.parse(raw);
        if (!Array.isArray(value)) throw new Error();
        const ids = new Set<string>();
        setSaved(value.filter((s: SavedLead) => {
          if (!s || !getCompany(s.companyId) || ids.has(s.companyId) || !["New", "Reviewing", "Contacted"].includes(s.status) || !Number.isFinite(s.savedAt)) return false;
          ids.add(s.companyId); return true;
        }));
      }
    } catch {
      toast.error("Saved leads could not be read from this browser.");
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { toast.error("Browser storage is unavailable. Changes may not survive refresh."); }
  }, [saved, loaded]);

  const store: Store = {
    loaded,
    saved,
    criteria,
    query,
    setSearch: (q, c) => {
      setQuery(q);
      setCriteria(c);
    },
    isSaved: (id) => saved.some((s) => s.companyId === id),
    toggleSave: (id) => {
      const exists = saved.some((s) => s.companyId === id);
      setSaved((prev) =>
        exists ? prev.filter((s) => s.companyId !== id) : [{ companyId: id, status: "New", savedAt: Date.now() }, ...prev],
      );
      return !exists;
    },
    setStatus: (id, status) =>
      setSaved((prev) => prev.map((s) => (s.companyId === id ? { ...s, status } : s))),
    saveMany: (ids) => setSaved(prev => {
      const existing = new Set(prev.map(s => s.companyId));
      const additions: SavedLead[] = [];
      ids.forEach(id => { if (!existing.has(id) && getCompany(id)) { existing.add(id); additions.push({ companyId: id, status: "New", savedAt: Date.now() }); } });
      return [...additions, ...prev];
    }),
  };
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}
