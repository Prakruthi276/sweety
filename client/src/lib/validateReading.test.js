import { describe, it, expect } from 'vitest';
import { validateReading } from './validateReading';

const today = '2026-11-10';
const ok = { date: '2026-11-09', slot: 'AFTER_LUNCH', value: '110' };

describe('validateReading', () => {
  it('accepts a valid reading', () => {
    expect(validateReading(ok, today)).toEqual({});
  });

  it.each([[''], ['   '], [null], [undefined]])('requires a value (%p)', (value) => {
    expect(validateReading({ ...ok, value }, today).value).toBe('Please enter a glucose value.');
  });

  it.each([['39'], ['601'], ['0'], ['-5'], ['100.5'], ['abc']])('rejects value %s', (value) => {
    expect(validateReading({ ...ok, value }, today).value).toBe('Value must be between 40 and 600 mg/dl.');
  });

  it.each([['40'], ['600'], [40], [600]])('accepts the boundary value %p', (value) => {
    expect(validateReading({ ...ok, value }, today).value).toBeUndefined();
  });

  it('rejects a future date but accepts today', () => {
    expect(validateReading({ ...ok, date: '2026-11-11' }, today).date).toBe('Date cannot be in the future.');
    expect(validateReading({ ...ok, date: today }, today).date).toBeUndefined();
  });

  it('requires a date and a slot', () => {
    const errors = validateReading({ date: '', slot: '', value: '110' }, today);
    expect(errors.date).toBe('Please select a date.');
    expect(errors.slot).toBe('Please choose a time slot.');
  });
});
