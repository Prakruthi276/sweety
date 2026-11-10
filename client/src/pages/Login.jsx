import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import FormField from '../components/FormField.jsx';
import { parseApiError } from '../lib/errors';

export default function Login() {
  const { user, loading, login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
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
    if (!form.email.trim()) found.email = 'Enter a valid email';
    if (!form.password) found.password = 'Password is required';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
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
        <h1>Sweety</h1>
        <p className="muted">Log in to track your blood glucose.</p>
        {formError && <p className="alert" role="alert">{formError}</p>}

        <FormField id="email" label="Email" error={errors.email}>
          <input id="email" name="email" type="email" autoComplete="email"
                 value={form.email} onChange={change} />
        </FormField>
        <FormField id="password" label="Password" error={errors.password}>
          <input id="password" name="password" type="password" autoComplete="current-password"
                 value={form.password} onChange={change} />
        </FormField>

        <button type="submit" disabled={submitting}>{submitting ? 'Logging in…' : 'Log in'}</button>
        <p className="muted">No account? <Link to="/register">Register</Link></p>
      </form>
    </main>
  );
}
