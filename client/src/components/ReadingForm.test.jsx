import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReadingForm from './ReadingForm.jsx';
import { toDateString } from '../lib/dates';

const setup = (props = {}) => {
  const onSubmit = props.onSubmit ?? vi.fn().mockResolvedValue();
  render(<ReadingForm onSubmit={onSubmit} onCancel={vi.fn()} {...props} />);
  return { onSubmit, user: userEvent.setup() };
};

const valueInput = () => screen.getByLabelText(/glucose value/i);
const addButton = () => screen.getByRole('button', { name: /add reading/i });

describe('ReadingForm', () => {
  it('shows an error and does not submit when the value is empty', async () => {
    const { user, onSubmit } = setup();
    await user.click(addButton());
    expect(await screen.findByText('Please enter a glucose value.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each(['39', '601', '100.5', '0'])('rejects the value %s', async (text) => {
    const { user, onSubmit } = setup();
    await user.type(valueInput(), text);
    await user.click(addButton());
    expect(await screen.findByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each([['40', 40], ['600', 600]])('accepts the boundary value %s', async (text, expected) => {
    const { user, onSubmit } = setup();
    await user.type(valueInput(), text);
    await user.click(addButton());
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        date: toDateString(),
        slot: 'MORNING_FASTING',
        value: expected,
      })
    );
  });

  it('rejects a future date', async () => {
    const { user, onSubmit } = setup();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: toDateString(tomorrow) } });
    await user.type(valueInput(), '100');
    await user.click(addButton());
    expect(await screen.findByText('Date cannot be in the future.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the duplicate-slot message returned by the server', async () => {
    const onSubmit = vi.fn().mockRejectedValue({
      response: { status: 409, data: { message: 'You already have an After lunch reading for this date.' } },
    });
    const { user } = setup({ onSubmit });
    await user.type(valueInput(), '120');
    await user.click(addButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You already have an After lunch reading for this date.'
    );
  });

  it('shows field errors returned by the server', async () => {
    const onSubmit = vi.fn().mockRejectedValue({
      response: {
        status: 400,
        data: {
          message: 'Validation failed',
          errors: [{ field: 'value', message: 'Value must be between 40 and 600 mg/dl.' }],
        },
      },
    });
    const { user } = setup({ onSubmit });
    await user.type(valueInput(), '120');
    await user.click(addButton());
    expect(await screen.findByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
  });

  it('is prefilled when editing and can be cancelled', async () => {
    const onCancel = vi.fn();
    const { user } = setup({
      initial: { id: 7, date: '2026-10-15', slot: 'AFTER_LUNCH', value: 130 },
      onCancel,
    });
    expect(screen.getByLabelText('Date')).toHaveValue('2026-10-15');
    expect(screen.getByLabelText(/time slot/i)).toHaveValue('AFTER_LUNCH');
    expect(valueInput()).toHaveValue(130);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
