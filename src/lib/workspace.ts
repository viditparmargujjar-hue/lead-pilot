import { companies } from './data';
import { scoreCompany, type Criteria } from './ai';
import type { SavedLead } from './store';

export interface LeadList { id: string; name: string; companyIds: string[] }
export const OUTREACH_STAGES = ['Not contacted', 'Sent', 'Replied', 'Converted'] as const;
export type OutreachStage = typeof OUTREACH_STAGES[number];
export interface FollowUp { id: string; companyId: string; title: string; notes: string; due: string; status: 'Pending' | 'Completed' | 'Overdue'; outreachStage?: OutreachStage }
export function followUpStage(task: FollowUp): OutreachStage {
  return OUTREACH_STAGES.includes(task.outreachStage as OutreachStage) ? task.outreachStage as OutreachStage : 'Not contacted';
}
export function outreachMetrics(tasks: FollowUp[]) {
  const rank: Record<OutreachStage, number> = { 'Not contacted': 0, Sent: 1, Replied: 2, Converted: 3 };
  const current = new Map<string, OutreachStage>();
  tasks.forEach(task => {
    const stage = followUpStage(task);
    if (rank[stage] > rank[current.get(task.companyId) ?? 'Not contacted']) current.set(task.companyId, stage);
  });
  const stages = [...current.values()];
  const sent = stages.filter(stage => stage === 'Sent').length;
  const replied = stages.filter(stage => stage === 'Replied').length;
  const converted = stages.filter(stage => stage === 'Converted').length;
  const contacted = sent + replied + converted;
  return { sent, replied, converted, contacted, conversionRate: contacted ? Math.round(converted / contacted * 100) : null };
}
export interface Preferences { density: 'comfortable' | 'compact'; leadView: 'detailed' | 'compact'; sort: 'high' | 'recent' }
export const defaultPreferences: Preferences = { density: 'comfortable', leadView: 'detailed', sort: 'high' };
export function taskStatus(task: FollowUp, today = new Date().toLocaleDateString('en-CA')): FollowUp['status'] {
  if (task.status === 'Completed') return 'Completed';
  return task.due < today || task.status === 'Overdue' ? 'Overdue' : 'Pending';
}
export function addListMember(list: LeadList, companyId: string): LeadList {
  return { ...list, companyIds: [...new Set([...list.companyIds, companyId])] };
}
export function metrics(saved: SavedLead[], tasks: FollowUp[], criteria: Criteria) {
  const leads = saved.flatMap(s => { const c = companies.find(c => c.id === s.companyId); return c ? [scoreCompany(c, criteria)] : []; });
  return { available: companies.length, saved: leads.length, hot: leads.filter(l => l.label === 'Hot').length, pending: tasks.filter(t => t.status !== 'Completed').length, completed: tasks.filter(t => t.status === 'Completed').length,
    distribution: ['Hot', 'Warm', 'Potential', 'Low Match'].map(label => ({ label, count: leads.filter(l => l.label === label).length })) };
}
export function exportCSV(saved: SavedLead[], criteria: Criteria) {
  const cell = (v: unknown) => { let text = String(v ?? ''); if (/^[=+@\-\t\r]/.test(text)) text = "'" + text; return '"' + text.replaceAll('"', '""') + '"'; };
  const rows: unknown[][] = [['Company name', 'Industry', 'Location', 'Employee count', 'Lead score', 'Lead status', 'Saved date']];
  saved.forEach(s => { const c = companies.find(c => c.id === s.companyId); if (c) rows.push([c.name, c.industry, `${c.city}, ${c.country}`, c.employees, scoreCompany(c, criteria).score, s.status, new Date(s.savedAt).toISOString()]); });
  return rows.map(r => r.map(cell).join(',')).join('\r\n');
}
// RFC-style quoted fields, escaped quotes and embedded newlines; reject broken quoting.
export function parseCSV(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], field = '', quoted = false, closed = false;
  const input = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) { if (ch === '"') { if (input[i + 1] === '"') { field += '"'; i++; } else { quoted = false; closed = true; } } else field += ch; continue; }
    if (ch === '"') { if (field || closed) throw new Error('Unexpected quote in CSV.'); quoted = true; }
    else if (ch === ',' || ch === '\n' || ch === '\r') { row.push(field); field = ''; closed = false; if (ch !== ',') { if (ch === '\r' && input[i + 1] === '\n') i++; if (row.some(v => v.trim())) rows.push(row); row = []; } }
    else { if (closed) throw new Error('Unexpected text after a quoted field.'); field += ch; }
  }
  if (quoted) throw new Error('CSV has an unclosed quoted field.');
  row.push(field); if (row.some(v => v.trim())) rows.push(row);
  if (rows.length < 2) throw new Error('Include a header and at least one company row.');
  const header = rows[0]; if (!header || header.some(h => !h.trim()) || new Set(header).size !== header.length) throw new Error('Headers must be nonempty and unique.');
  if (rows.some(r => r.length !== header.length)) throw new Error('Each row must have the same number of columns as the header.');
  return rows;
}
export function validateImport(rows: string[][], column: number, saved: SavedLead[]) {
  const seen = new Set(saved.map(s => s.companyId)); const ids: string[] = [], errors: string[] = []; let duplicates = 0;
  rows.slice(1).forEach((row, i) => {
    const name = row[column]?.trim(); const company = companies.find(c => c.name.toLowerCase() === name?.toLowerCase());
    if (!company) { errors.push(`Row ${i + 2}: ${name || 'empty company'} is not in the demo catalog.`); return; }
    if (seen.has(company.id)) { duplicates++; return; } seen.add(company.id); ids.push(company.id);
  });
  return { ids, errors, duplicates };
}
