import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const MAX_COMPARE = 5;
const KEY = "leadpilot-compare-v1";

interface CompareStore {
  ids: string[];
  has: (id: string) => boolean;
  /** Returns false when the limit is reached. */
  toggle: (id: string) => "added" | "removed" | "full";
  remove: (id: string) => void;
  clear: () => void;
}

const Ctx = createContext<CompareStore | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const value: unknown = JSON.parse(raw); if (Array.isArray(value)) setIds([...new Set(value.filter((id): id is string => typeof id === "string" && id.startsWith("live:")))].slice(0, MAX_COMPARE)); }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(ids));
  }, [ids, loaded]);

  const store: CompareStore = {
    ids,
    has: (id) => ids.includes(id),
    toggle: (id) => {
      if (ids.includes(id)) {
        setIds((p) => p.filter((x) => x !== id));
        return "removed";
      }
      if (!id.startsWith("live:") || ids.length >= MAX_COMPARE) return "full";
      setIds((p) => [...p, id]);
      return "added";
    },
    remove: (id) => setIds((p) => p.filter((x) => x !== id)),
    clear: () => setIds([]),
  };
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useCompare() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useCompare outside provider");
  return s;
}
