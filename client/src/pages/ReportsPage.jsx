import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { parseApiError } from '../lib/errors';
import { formatDate, todayLocal } from '../lib/dates';

const TABS = [
  { id: 'daily', label: 'Daily' },
  { id: 'month-to-date', label: 'Month to date' },
  { id: 'monthly', label: 'Previous month' },
];

function Stat({ label, value, unit }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">
        {value}
        {unit && <small> {unit}</small>}
      </strong>
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState('daily');
  const [date, setDate] = useState(todayLocal());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!date) return;
    let ignore = false;
    api
      .get(`/reports/${tab}`, { params: { date } })
      .then(({ data }) => {
        if (ignore) return;
        setReport(data.report);
        setError('');
      })
      .catch((err) => {
        if (ignore) return;
        const { message, fields } = parseApiError(err);
        setReport(null);
        setError(message || fields.date || 'Something went wrong. Please try again.');
      })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [tab, date]);

  const changeTab = (id) => { setLoading(true); setTab(id); };
  const changeDate = (e) => {
    const value = e.target.value;
    setDate(value);
    setLoading(Boolean(value));
  };

  return (
    <>
      <section className="card">
        <h2>Reports</h2>
        <div className="field">
          <label htmlFor="report-date">Selected date</label>
          <input id="report-date" type="date" value={date} max={todayLocal()} onChange={changeDate} />
        </div>
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id}
                    className={tab === t.id ? 'tab active' : 'tab'} onClick={() => changeTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {!date && <p className="muted center">Please select a date.</p>}
      {date && loading && <p className="muted center">Loading…</p>}
      {date && !loading && error && <p className="alert" role="alert">{error}</p>}

      {date && !loading && report && (
        <section className="card">
          <h3>{report.title}</h3>
          <p className="muted">{report.label}</p>

          {report.empty ? (
            <div className="empty">
              <p>No readings for this period yet.</p>
              <Link to="/">Add a reading</Link>
            </div>
          ) : (
            <div className="stats">
              <Stat label="Highest" value={report.stats.highest} unit="mg/dl" />
              <Stat label="Lowest" value={report.stats.lowest} unit="mg/dl" />
              <Stat label="Average" value={report.stats.average.toFixed(1)} unit="mg/dl" />
              <Stat label="Readings" value={report.stats.count} />
            </div>
          )}

          {report.readings && report.readings.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Time slot</th><th>Value (mg/dl)</th></tr>
                </thead>
                <tbody>
                  {report.readings.map((r) => (
                    <tr key={r.id}>
                      <td>{r.slotLabel}</td>
                      <td>{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="muted small">Readings on {formatDate(report.selectedDate)}</p>
            </div>
          )}
        </section>
      )}
    </>
  );
}
