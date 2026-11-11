import { describe, expect, it } from 'vitest';
import { resolveTheme } from './theme';

describe('theme resolution', () => {
  it('system follows device dark preference', () => { expect(resolveTheme('system', true)).toBe('dark'); });
  it('system follows device light preference', () => { expect(resolveTheme('system', false)).toBe('light'); });
  it('explicit light ignores a dark device', () => { expect(resolveTheme('light', true)).toBe('light'); });
  it('explicit dark ignores a light device', () => { expect(resolveTheme('dark', false)).toBe('dark'); });
});
