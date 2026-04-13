import { useState, useEffect, useCallback } from 'react';
import { Bell, RefreshCw, Search } from 'lucide-react';
import { loadConfig } from '../../config/config';
import { fetchAlerts } from '../../lib/mimir';
import type { ActiveAlert } from '../../lib/mimir';

type AlertState = 'all' | 'firing' | 'pending' | 'inactive';

const STATE_FILTERS: { value: AlertState; label: string }[] = [
  { value: 'all',      label: 'All' },
  { value: 'firing',   label: 'Firing' },
  { value: 'pending',  label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
];

export function AlertsPage() {
  const [stateFilter, setStateFilter] = useState<AlertState>('all');
  const [search, setSearch]           = useState('');
  const [alerts, setAlerts]           = useState<ActiveAlert[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    loadConfig().then(cfg =>
      fetchAlerts(cfg.mimirBaseUrl, cfg.defaultTenantId)
        .then(setAlerts)
        .catch(e => setError(String(e)))
        .finally(() => setLoading(false))
    );
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = alerts.filter(a => {
    if (stateFilter !== 'all' && a.state !== stateFilter) return false;
    const name = a.labels.alertname ?? '';
    if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const firingCount  = alerts.filter(a => a.state === 'firing').length;
  const pendingCount = alerts.filter(a => a.state === 'pending').length;
  const connected    = !loading && !error;

  return (
    <div className="forge-page" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1200px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <Bell style={{ width: '17px', height: '17px', color: 'var(--amber)', flexShrink: 0 }} />
          <h1 style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '18px',
            color: 'var(--text)',
            letterSpacing: '-0.02em',
          }}>
            Alerts
          </h1>
        </div>

        {/* Summary badges */}
        {connected && (firingCount > 0 || pendingCount > 0) && (
          <div style={{ display: 'flex', gap: '6px' }}>
            {firingCount  > 0 && <span className="badge badge-firing">{firingCount} firing</span>}
            {pendingCount > 0 && <span className="badge badge-pending">{pendingCount} pending</span>}
          </div>
        )}
      </div>

      {/* State filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div className="seg-ctrl">
          {STATE_FILTERS.map(f => (
            <button
              key={f.value}
              className={`seg-btn${stateFilter === f.value ? ' active' : ''}`}
              onClick={() => setStateFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{
              position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
              width: '12px', height: '12px', color: 'var(--text-3)', pointerEvents: 'none',
            }} />
            <input
              className="forge-input"
              style={{ paddingLeft: '28px', width: '200px', fontSize: '12px' }}
              placeholder="Filter alerts…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-ghost" style={{ padding: '5px 8px' }} onClick={load} disabled={loading}>
            <RefreshCw style={{ width: '12px', height: '12px' }} />
          </button>
        </div>
      </div>

      {/* Alerts table card */}
      <div className="forge-card">
        <div className="forge-card-header">
          <span className="forge-card-title">Active Alerts</span>
          {connected && (
            <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-3)' }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {connected && alerts.length > 0 ? (
          <table className="forge-table">
            <thead>
              <tr>
                <th>Alert</th>
                <th>State</th>
                <th>Labels</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const { alertname, ...restLabels } = a.labels;
                return (
                  <tr key={`${alertname}-${i}`}>
                    <td className="mono" style={{ color: 'var(--text)', fontWeight: 500 }}>{alertname ?? '—'}</td>
                    <td>
                      <span className={`badge badge-${a.state}`}>{a.state}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {Object.entries(restLabels).map(([k, v]) => (
                          <span key={k} style={{
                            padding: '1px 6px',
                            borderRadius: '3px',
                            background: 'var(--elevated)',
                            border: '1px solid var(--border)',
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-2)',
                          }}>
                            {k}=<span style={{ color: 'var(--amber-bright)' }}>{v}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <>
            <table className="forge-table">
              <thead>
                <tr>
                  <th>Alert</th>
                  <th>State</th>
                  <th>Labels</th>
                </tr>
              </thead>
            </table>

            <div className="empty-state">
              <div className="empty-icon">
                <Bell style={{ width: '18px', height: '18px', color: 'var(--text-3)' }} />
              </div>
              <div>
                {loading ? (
                  <div className="empty-label">Loading alerts…</div>
                ) : error ? (
                  <>
                    <div className="empty-label">Failed to load alerts</div>
                    <div className="empty-hint">{error}</div>
                  </>
                ) : (
                  <>
                    <div className="empty-label">No alerts found</div>
                    <div className="empty-hint">Alerts will be loaded from the Mimir Alertmanager API</div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
