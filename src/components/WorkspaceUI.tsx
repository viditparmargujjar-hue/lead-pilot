import { Inbox, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { getCompany } from '@/lib/data';
import { useStore } from '@/lib/store';
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) { return <div className="flex flex-col items-center gap-3 border-y py-12 text-center"><Inbox className="h-8 w-8 text-muted-foreground" /><p className="font-medium">{title}</p>{children}</div>; }
export const fieldClass = 'h-10 w-full rounded-md border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring';
export function LeadSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) { const { saved } = useStore(); return <select aria-label="Related saved lead" required className={fieldClass} value={value} onChange={e => onChange(e.target.value)}><option value="">Select a saved lead</option>{saved.map(s => { const c = getCompany(s.companyId); return c && <option key={c.id} value={c.id}>{c.name}</option>; })}</select>; }
export function ConfirmDelete({ open, onClose, onConfirm, description }: { open: boolean; onClose: () => void; onConfirm: () => void; description: string }) { return <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}><DialogContent><DialogTitle>Confirm deletion</DialogTitle><DialogDescription>{description}</DialogDescription><div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant="destructive" onClick={() => { onConfirm(); onClose(); }}><Trash2 />Delete</Button></div></DialogContent></Dialog>; }
