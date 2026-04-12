import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Search, RefreshCw } from 'lucide-react';
import { loadConfig } from '../../config/config';
import { fetchRuleGroups } from '../../lib/mimir';
import type { RuleGroup } from '../../lib/mimir';

type RuleFilter = 'all' | 'alerting' | 'recording';

const FILTERS: { value: RuleFilter; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'alerting',  label: 'Alerting' },
  { value: 'recording', label: 'Recording' },
];

export function RulesPage() {
  const [filter, setFilter]   = useState<RuleFilter>('all');
  const [search, setSearch]   = useState('');
  const [groups, setGroups]   = useState<RuleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    loadConfig().then(cfg =>
      fetchRuleGroups(cfg.mimirBaseUrl, cfg.defaultTenantId)
        .then(setGroups)
        .catch(e => setError(String(e)))
        .finally(() => setLoading(false))
    );
  }, []);

  useEffect(() => { load(); }, [load]);

  const allRows = groups.flatMap(g =>
    g.rules.map(r => ({
      name:  r.name,
      group: g.name,
      type:  r.type,
      state: r.state ?? 'inactive' as const,
    }))
  );

  const filtered = allRows.filter(r => {
    if (filter !== 'all' && r.type !== filter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const connected = !loading && !error && groups.length > 0;

  return (
    <div className="forge-page" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1200px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <BookOpen style={{ width: '17px', height: '17px', color: 'var(--amber)', flexShrink: 0 }} />
          <h1 style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '18px',
            color: 'var(--text)',
            letterSpacing: '-0.02em',
          }}>
            Rules
          </h1>
        </div>

        <div className="seg-ctrl">
          {FILTERS.map(f => (
            <button
              key={f.value}
              className={`seg-btn${filter === f.value ? ' active' : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rules card */}
      <div className="forge-card">
        <div className="forge-card-header">
          <span className="forge-card-title">
            {filter === 'all' ? 'All Rules' : filter === 'alerting' ? 'Alerting Rules' : 'Recording Rules'}
          </span>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{
                position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                width: '12px', height: '12px', color: 'var(--text-3)', pointerEvents: 'none',
              }} />
              <input
                className="forge-input"
                style={{ paddingLeft: '28px', width: '200px', fontSize: '12px' }}
                placeholder="Filter rules…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="btn btn-ghost" style={{ padding: '5px 8px' }} onClick={load} disabled={loading}>
              <RefreshCw style={{ width: '12px', height: '12px' }} />
            </button>
          </div>
        </div>

        {connected ? (
          <table className="forge-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Group</th>
                <th>Type</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={`${r.group}-${r.name}-${i}`}>
                  <td className="mono" style={{ color: 'var(--text)' }}>{r.name}</td>
                  <td className="mono">{r.group}</td>
                  <td>
                    <span className={`badge badge-${r.type}`}>{r.type}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${r.state}`}>{r.state}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <>
            {/* Ghost table header to give structure context */}
            <table className="forge-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Group</th>
                  <th>Type</th>
                  <th>State</th>
                </tr>
              </thead>
            </table>

            <div className="empty-state">
              <div className="empty-icon">
                <BookOpen style={{ width: '18px', height: '18px', color: 'var(--text-3)' }} />
              </div>
              <div>
                {loading ? (
                  <div className="empty-label">Loading rules…</div>
                ) : error ? (
                  <>
                    <div className="empty-label">Failed to load rules</div>
                    <div className="empty-hint">{error}</div>
                  </>
                ) : (
                  <>
                    <div className="empty-label">No rules loaded</div>
                    <div className="empty-hint">Rules will be fetched from the Mimir ruler API</div>
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
