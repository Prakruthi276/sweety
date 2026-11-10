import { describe, it, expect } from 'vitest';
import { toDateString, formatDate } from './dates';

describe('dates', () => {
  it('builds YYYY-MM-DD from local parts', () => {
    expect(toDateString(new Date(2026, 9, 5))).toBe('2026-10-05');
    expect(toDateString(new Date(2026, 0, 31))).toBe('2026-01-31');
  });

  it('formats a date for display', () => {
    expect(formatDate('2026-10-05')).toBe('5 Oct 2026');
    expect(formatDate('2026-01-31')).toBe('31 Jan 2026');
  });
});
