export const MIN_VALUE = 40;
export const MAX_VALUE = 600;

export const SLOTS = [
  { value: 'MORNING_FASTING', label: 'Morning (fasting)' },
  { value: 'AFTER_BREAKFAST', label: 'After breakfast' },
  { value: 'AFTER_LUNCH', label: 'After lunch' },
  { value: 'AFTER_DINNER', label: 'After dinner' },
];

// Same rules and messages as the API. The server stays the authority
export function validateReading({ date, slot, value }, today) {
  const errors = {};

  if (!date) errors.date = 'Please select a date.';
  else if (date > today) errors.date = 'Date cannot be in the future.'; // YYYY-MM-DD compares correctly as text

  if (!slot) errors.slot = 'Please choose a time slot.';

  const raw = String(value ?? '').trim();
  if (raw === '') {
    errors.value = 'Please enter a glucose value.';
  } else {
    const n = Number(raw);
    if (!Number.isInteger(n) || n < MIN_VALUE || n > MAX_VALUE) {
      errors.value = `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`;
    }
  }
  return errors;
}
