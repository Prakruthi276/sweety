const {
  firstOfMonth, previousMonthRange, formatDateLabel, formatRangeLabel,
} = require('../src/lib/dates');

describe('previousMonthRange', () => {
  it.each([
    ['2026-10-15', '2026-09-01', '2026-09-30'], // 30-day month
    ['2026-03-31', '2026-02-01', '2026-02-28'], // February, not a leap year
    ['2028-03-10', '2028-02-01', '2028-02-29'], // leap year
    ['2026-05-01', '2026-04-01', '2026-04-30'], // selected on the 1st
    ['2026-01-05', '2025-12-01', '2025-12-31'], // year change
    ['2026-08-20', '2026-07-01', '2026-07-31'], // 31-day month
  ])('for %s returns %s to %s', (date, from, to) => {
    expect(previousMonthRange(date)).toEqual({ from, to });
  });
});

describe('firstOfMonth', () => {
  it('returns the 1st of the same month', () => {
    expect(firstOfMonth('2026-10-15')).toBe('2026-10-01');
    expect(firstOfMonth('2026-10-01')).toBe('2026-10-01');
  });
});

describe('labels', () => {
  it('formats one date', () => {
    expect(formatDateLabel('2026-10-05')).toBe('5 Oct 2026');
  });
  it('formats a single-day range as one date', () => {
    expect(formatRangeLabel('2026-10-15', '2026-10-15')).toBe('15 Oct 2026');
  });
  it('formats a range in one year', () => {
    expect(formatRangeLabel('2026-10-01', '2026-10-15')).toBe('1 Oct \u2013 15 Oct 2026');
    expect(formatRangeLabel('2026-09-01', '2026-09-30')).toBe('1 Sep \u2013 30 Sep 2026');
  });
});
