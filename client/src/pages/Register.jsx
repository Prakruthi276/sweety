import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import FormField from '../components/FormField.jsx';
import { parseApiError } from '../lib/errors';

export default function Register() {
  const { user, loading, register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <p className="center">Loading…</p>;
  if (user) return <Navigate to="/" replace />;

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    const found = {};
    if (form.name.trim().length < 2) found.name = 'Name must be at least 2 characters';
    if (!form.email.trim()) found.email = 'Enter a valid email';
    if (!form.password) found.password = 'Password is required';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
    } catch (err) {
      const { message, fields } = parseApiError(err);
      setErrors(fields);
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth">
      <form className="card" onSubmit={submit} noValidate>
        <h1>Create your account</h1>
        {formError && <p className="alert" role="alert">{formError}</p>}

        <FormField id="name" label="Name" error={errors.name}>
          <input id="name" name="name" autoComplete="name" value={form.name} onChange={change} />
        </FormField>
        <FormField id="email" label="Email" error={errors.email}>
          <input id="email" name="email" type="email" autoComplete="email"
                 value={form.email} onChange={change} />
        </FormField>
        <FormField id="password" label="Password" error={errors.password}>
          <input id="password" name="password" type="password" autoComplete="new-password"
                 value={form.password} onChange={change} />
        </FormField>
        <p className="muted small">At least 8 characters, with a letter and a number.</p>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Register'}
        </button>
        <p className="muted">Already registered? <Link to="/login">Log in</Link></p>
      </form>
    </main>
  );
}
