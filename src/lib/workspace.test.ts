import { describe, expect, it } from 'vitest';
import { addListMember, metrics, outreachMetrics, parseCSV, taskStatus, validateImport, type FollowUp } from './workspace';
describe('workspace rules', () => {
  it('counts saved hot leads and outstanding follow-ups, never recommendations', () => {
    const m = metrics([], [{ id: 't', companyId: 'c1', title: 'Call', notes: '', due: '2026-10-20', status: 'Pending' }], {});
    expect(m.saved).toBe(0); expect(m.hot).toBe(0); expect(m.pending).toBe(1);
  });
  it('marks unfinished past tasks overdue', () => expect(taskStatus({ id: 't', companyId: 'c1', title: 'Call', notes: '', due: '2026-10-01', status: 'Pending' }, '2026-10-16')).toBe('Overdue'));
  it('prevents duplicate list members', () => expect(addListMember({ id: 'l', name: 'A', companyIds: ['c1'] }, 'c1').companyIds).toEqual(['c1']));
  it('skips duplicate imports and rejects unknown companies', () => {
    const r = validateImport(parseCSV('Company\nCloudNova Technologies\nUnknown Inc'), 0, [{ companyId: 'c1', status: 'New', savedAt: 1 }]);
    expect(r.duplicates).toBe(1); expect(r.errors).toHaveLength(1);
  });
  it('rejects malformed CSV rows', () => expect(() => parseCSV('Company,Industry\nCloudNova')).toThrow());
  it('calculates conversion from unique contacted leads at their furthest outreach stage', () => {
    const base: FollowUp = { id: 't', companyId: 'c1', title: 'Call', notes: '', due: '2026-11-10', status: 'Pending' };
    const result = outreachMetrics([
      { ...base, id: 'sent-first', outreachStage: 'Sent' },
      { ...base, id: 'converted-later', outreachStage: 'Converted' },
      { ...base, id: 'replied', companyId: 'c2', outreachStage: 'Replied' },
      { ...base, id: 'sent', companyId: 'c3', outreachStage: 'Sent' },
      { ...base, id: 'uncontacted', companyId: 'c4' },
    ]);
    expect(result).toEqual({ sent: 1, replied: 1, converted: 1, contacted: 3, conversionRate: 33 });
  });
  it('shows no conversion rate before any lead is contacted', () => {
    const legacy: FollowUp = { id: 't', companyId: 'c1', title: 'Call', notes: '', due: '2026-11-10', status: 'Pending' };
    expect(outreachMetrics([legacy])).toEqual({ sent: 0, replied: 0, converted: 0, contacted: 0, conversionRate: null });
  });
});
