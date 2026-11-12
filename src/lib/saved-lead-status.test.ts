import { describe, expect, it } from 'vitest';
import { isSavedLeadStatus } from './store';

describe('saved lead status compatibility', () => {
  it('accepts the existing and requested saved lead statuses', () => {
    for (const status of ['New', 'Reviewing', 'Contacted', 'Interested', 'Not Interested']) {
      expect(isSavedLeadStatus(status)).toBe(true);
    }
  });

  it('rejects unknown saved lead statuses instead of loading invalid records', () => {
    expect(isSavedLeadStatus('Archived')).toBe(false);
    expect(isSavedLeadStatus(null)).toBe(false);
  });
});