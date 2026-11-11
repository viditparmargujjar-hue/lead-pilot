import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Criteria } from "./ai";

export interface HistoryItem {
  id: string;
  query: string;
  at: number;
  count?: number;
  criteria: Criteria;
  saved: boolean;
}

interface HistoryStore {
  items: HistoryItem[];
  add: (item: Omit<HistoryItem, "id" | "at" | "saved">) => void;
  toggleSaved: (id: string) => void;
  remove: (id: string) => void;
}

// Only the search text, time, result count and detected criteria are stored — no personal data.
const KEY = "leadpilot-search-history-v1";
const Ctx = createContext<HistoryStore | null>(null);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, loaded]);

  const store: HistoryStore = {
    items,
    add: (item) =>
      setItems((prev) => {
        const q = item.query.trim();
        const existing = prev.find((p) => p.query.trim().toLowerCase() === q.toLowerCase());
        const rest = prev.filter((p) => p !== existing);
        return [
          { ...item, query: q, id: existing?.id ?? crypto.randomUUID(), at: Date.now(), saved: existing?.saved ?? false },
          ...rest,
        ].slice(0, 100);
      }),
    toggleSaved: (id) => setItems((prev) => prev.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p))),
    remove: (id) => setItems((prev) => prev.filter((p) => p.id !== id)),
  };
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useHistory() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useHistory outside provider");
  return s;
}
