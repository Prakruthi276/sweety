import { useState } from 'react';
import FormField from './FormField.jsx';
import { SLOTS, validateReading } from '../lib/validateReading';
import { parseApiError } from '../lib/errors';
import { todayLocal } from '../lib/dates';

// `initial` is a reading when editing, or null/undefined when adding.
// `onSubmit(values)` must return a promise; a rejection shows the server's message.
export default function ReadingForm({ initial, onSubmit, onCancel }) {
  const editing = Boolean(initial?.id);
  const [values, setValues] = useState({
    date: initial?.date ?? todayLocal(),
    slot: initial?.slot ?? 'MORNING_FASTING',
    value: initial?.value ?? '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const change = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');

    const found = validateReading(values, todayLocal());
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await onSubmit({ date: values.date, slot: values.slot, value: Number(values.value) });
      if (!editing) setValues((v) => ({ ...v, value: '' })); // keep date and slot, clear the value
    } catch (err) {
      const { message, fields } = parseApiError(err);
      setErrors(fields);
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card" onSubmit={submit} noValidate>
      <h2>{editing ? 'Edit reading' : 'Add a reading'}</h2>
      {formError && <p className="alert" role="alert">{formError}</p>}

      <FormField id="date" label="Date" error={errors.date}>
        <input id="date" name="date" type="date" value={values.date} max={todayLocal()}
               onChange={change} aria-invalid={Boolean(errors.date)} />
      </FormField>

      <FormField id="slot" label="Time slot" error={errors.slot}>
        <select id="slot" name="slot" value={values.slot} onChange={change}>
          {SLOTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </FormField>

      <FormField id="value" label="Glucose value (mg/dl)" error={errors.value}>
        <input id="value" name="value" type="number" inputMode="numeric" placeholder="e.g. 110"
               value={values.value} onChange={change} aria-invalid={Boolean(errors.value)} />
      </FormField>

      <div className="actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Add reading'}
        </button>
        {editing && (
          <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}
