import { useEffect, useState } from 'react';
import api from '../api/client';
import ReadingForm from '../components/ReadingForm.jsx';
import { parseApiError } from '../lib/errors';
import { formatDate } from '../lib/dates';

const LIMIT = 10;

export default function ReadingsPage() {
  const [readings, setReadings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    api
      .get('/readings', { params: { page, limit: LIMIT } })
      .then(({ data }) => {
        if (ignore) return;
        if (data.data.length === 0 && page > 1) {
          setPage(page - 1);
          return;
        }
        setReadings(data.data);
        setPagination(data.pagination);
        setError('');
      })
      .catch((err) => { if (!ignore) setError(parseApiError(err).message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [page, reloadKey]);

  const refresh = () => { setLoading(true); setReloadKey((k) => k + 1); };
  const goToPage = (p) => { setLoading(true); setPage(p); };

  const save = async (values) => {
    if (editing) await api.put(`/readings/${editing.id}`, values);
    else await api.post('/readings', values);
    setEditing(null);
    refresh();
  };

  const remove = async (reading) => {
    if (!window.confirm(`Delete the ${reading.slotLabel} reading for ${formatDate(reading.date)}?`)) return;
    try {
      await api.delete(`/readings/${reading.id}`);
      if (editing?.id === reading.id) setEditing(null);
      refresh();
    } catch (err) {
      setError(parseApiError(err).message);
    }
  };

  return (
    <>
      <ReadingForm key={editing?.id ?? 'new'} initial={editing} onSubmit={save}
                   onCancel={() => setEditing(null)} />

      <section className="card">
        <h2>Your readings</h2>
        {error && <p className="alert" role="alert">{error}</p>}

        {loading ? (
          <p className="muted">Loading…</p>
        ) : readings.length === 0 ? (
          <p className="empty">No readings yet. Add your first one above.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Time slot</th><th>Value (mg/dl)</th><th></th></tr>
              </thead>
              <tbody>
                {readings.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDate(r.date)}</td>
                    <td>{r.slotLabel}</td>
                    <td>{r.value}</td>
                    <td className="row-actions">
                      <button type="button" className="link" onClick={() => setEditing(r)}>Edit</button>
                      <button type="button" className="link danger" onClick={() => remove(r)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="pager">
            <button type="button" className="secondary" disabled={page <= 1}
                    onClick={() => goToPage(page - 1)}>Previous</button>
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <button type="button" className="secondary" disabled={page >= pagination.totalPages}
                    onClick={() => goToPage(page + 1)}>Next</button>
          </div>
        )}
      </section>
    </>
  );
}
