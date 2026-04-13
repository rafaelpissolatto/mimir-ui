import { useState } from 'react';
import {
  Search, Play, X, Clock, ChevronDown, BarChart2, Table2, AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { loadConfig } from '../../config/config';
import {
  fetchRangeQuery, fetchInstantQuery, resolveTimeRange,
} from '../../lib/mimir';
import type { QueryResult, MatrixSeries, Labels } from '../../lib/mimir';

// ── Constants ────────────────────────────────────────────────────────────────

const TIME_RANGES = ['Last 5m', 'Last 15m', 'Last 1h', 'Last 3h', 'Last 12h', 'Last 24h', 'Last 7d'];

const SERIES_COLORS = [
  '#f59e0b', // amber
  '#38bdf8', // sky
  '#22c55e', // green
  '#ef4444', // red
  '#a78bfa', // violet
  '#fb923c', // orange
  '#34d399', // emerald
  '#f472b6', // pink
];

// ── Pure module-level helpers ────────────────────────────────────────────────

function formatSeriesLabel(metric: Labels): string {
  const { __name__, ...rest } = metric;
  const pairs = Object.entries(rest).map(([k, v]) => `${k}="${v}"`).join(', ');
  if (__name__) return pairs ? `${__name__}{${pairs}}` : __name__;
  return `{${pairs}}`;
}

function buildChartData(series: MatrixSeries[]): {
  data: Record<string, number | string>[];
  keys: string[];
} {
  const keys = series.map(s => formatSeriesLabel(s.metric));
  const tsSet = new Set<number>();
  series.forEach(s => s.values.forEach(([ts]) => tsSet.add(ts)));
  const timestamps = Array.from(tsSet).sort((a, b) => a - b);
  const data = timestamps.map(ts => {
    const row: Record<string, number | string> = { ts };
    series.forEach((s, i) => {
      const point = s.values.find(([t]) => t === ts);
      if (point !== undefined) row[keys[i]] = parseFloat(point[1]);
    });
    return row;
  });
  return { data, keys };
}

function xAxisFormatter(ts: number, timeRange: string): string {
  const date = new Date(ts * 1000);
  const shortRange = ['Last 5m', 'Last 15m', 'Last 1h', 'Last 3h'].includes(timeRange);
  if (shortRange) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return (
    date.toLocaleDateString([], { month: '2-digit', day: '2-digit' }) +
    ' ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
}

function getLabelColumns(result: QueryResult): string[] {
  const metrics =
    result.resultType === 'matrix'
      ? result.result.map(s => s.metric)
      : result.result.map(s => s.metric);
  const keySet = new Set<string>();
  metrics.forEach(m => Object.keys(m).forEach(k => keySet.add(k)));
  return Array.from(keySet).sort();
}

function formatValue(raw: string): string {
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return raw;
  return n.toPrecision(6).replace(/\.?0+$/, '');
}

// ── Component ────────────────────────────────────────────────────────────────

type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

export function ExplorePage() {
  const [query, setQuery]           = useState('');
  const [queryType, setQueryType]   = useState<'range' | 'instant'>('range');
  const [timeRange, setTimeRange]   = useState('Last 1h');
  const [resultView, setResultView] = useState<'graph' | 'table'>('graph');
  const [timeDropOpen, setTimeDropOpen] = useState(false);

  const [status, setStatus]     = useState<QueryStatus>('idle');
  const [result, setResult]     = useState<QueryResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleExecute() {
    if (!query.trim()) return;
    setStatus('loading');
    setErrorMsg(null);
    setResult(null);
    try {
      const cfg = await loadConfig();
      if (queryType === 'instant') {
        const data = await fetchInstantQuery(cfg.mimirBaseUrl, cfg.defaultTenantId, query.trim());
        setResult(data);
        setResultView('table');
      } else {
        const { start, end, step } = resolveTimeRange(timeRange);
        const data = await fetchRangeQuery(
          cfg.mimirBaseUrl, cfg.defaultTenantId, query.trim(), start, end, step,
        );
        setResult(data);
      }
      setStatus('success');
    } catch (e) {
      setErrorMsg(String(e));
      setStatus('error');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleExecute();
    }
  }

  return (
    <div className="forge-page" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1200px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <Search style={{ width: '17px', height: '17px', color: 'var(--amber)', flexShrink: 0 }} />
          <h1 style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '18px',
            color: 'var(--text)',
            letterSpacing: '-0.02em',
          }}>
            Explore
          </h1>
        </div>

        <div className="seg-ctrl">
          <button className={`seg-btn${queryType === 'range' ? ' active' : ''}`} onClick={() => setQueryType('range')}>
            Range
          </button>
          <button className={`seg-btn${queryType === 'instant' ? ' active' : ''}`} onClick={() => setQueryType('instant')}>
            Instant
          </button>
        </div>
      </div>

      {/* Query editor card — overflow:hidden stays intact, no action bar inside */}
      <div className="forge-card">
        <div className="forge-card-header">
          <span className="forge-card-title">PromQL</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
            <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '3px 8px' }}>
              <Clock style={{ width: '11px', height: '11px' }} />
              History
            </button>
          </div>
        </div>

        <textarea
          className="promql-editor"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a PromQL expression…   e.g.  rate(http_requests_total[5m])"
          spellCheck={false}
          rows={4}
        />
      </div>

      {/* Toolbar — outside forge-card so the dropdown isn't clipped by overflow:hidden */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        flexWrap: 'wrap',
      }}>
        {/* Time range picker */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn"
            onClick={() => setTimeDropOpen(v => !v)}
            style={{ fontSize: '12px' }}
          >
            <Clock style={{ width: '12px', height: '12px', color: 'var(--text-3)' }} />
            {timeRange}
            <ChevronDown style={{
              width: '11px', height: '11px', color: 'var(--text-3)',
              transform: timeDropOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s',
            }} />
          </button>

          {timeDropOpen && (
            <div style={{
              position: 'absolute', left: 0, top: 'calc(100% + 4px)',
              background: 'var(--elevated)',
              border: '1px solid var(--border)',
              borderRadius: '7px',
              padding: '3px',
              zIndex: 50,
              boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
              minWidth: '130px',
            }}>
              {TIME_RANGES.map(r => (
                <button
                  key={r}
                  onClick={() => { setTimeRange(r); setTimeDropOpen(false); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '6px 10px',
                    border: 'none',
                    borderRadius: '4px',
                    background: r === timeRange ? 'var(--amber-dim)' : 'transparent',
                    color: r === timeRange ? 'var(--amber-bright)' : 'var(--text-2)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: r === timeRange ? 500 : 400,
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Execute / Clear */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {query && (
            <button className="btn" onClick={() => setQuery('')}>
              <X style={{ width: '11px', height: '11px' }} />
              Clear
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleExecute}
            disabled={status === 'loading' || !query.trim()}
          >
            {status === 'loading'
              ? <><div className="spinner" style={{ width: '11px', height: '11px', borderWidth: '1.5px' }} /> Running…</>
              : <><Play style={{ width: '11px', height: '11px' }} /> Execute</>
            }
          </button>
        </div>
      </div>

      {/* Results card */}
      <div className="forge-card" style={{ flex: 1, minHeight: '320px' }}>
        <div className="forge-card-header">
          <span className="forge-card-title">Results</span>
          <div style={{ marginLeft: 'auto' }}>
            <div className="seg-ctrl">
              <button
                className={`seg-btn${resultView === 'graph' ? ' active' : ''}`}
                onClick={() => setResultView('graph')}
              >
                <BarChart2 style={{ width: '11px', height: '11px', display: 'inline', marginRight: '4px' }} />
                Graph
              </button>
              <button
                className={`seg-btn${resultView === 'table' ? ' active' : ''}`}
                onClick={() => setResultView('table')}
              >
                <Table2 style={{ width: '11px', height: '11px', display: 'inline', marginRight: '4px' }} />
                Table
              </button>
            </div>
          </div>
        </div>

        {/* ── idle ── */}
        {status === 'idle' && (
          <div className="empty-state">
            <div className="empty-icon">
              <Search style={{ width: '18px', height: '18px', color: 'var(--text-3)' }} />
            </div>
            <div>
              <div className="empty-label">No query executed</div>
              <div className="empty-hint">Enter a PromQL expression above and press Execute or Ctrl+Enter</div>
            </div>
          </div>
        )}

        {/* ── loading ── */}
        {status === 'loading' && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '56px 40px', gap: '10px',
          }}>
            <div className="spinner" />
            <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>Executing query…</span>
          </div>
        )}

        {/* ── error ── */}
        {status === 'error' && (
          <div style={{
            margin: '16px',
            padding: '12px 14px',
            background: 'var(--red-dim)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '6px',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
          }}>
            <AlertTriangle style={{ width: '14px', height: '14px', color: 'var(--red)', flexShrink: 0, marginTop: '1px' }} />
            <span style={{ fontSize: '13px', color: '#fca5a5', fontFamily: 'var(--font-mono)', wordBreak: 'break-word' }}>
              {errorMsg}
            </span>
          </div>
        )}

        {/* ── success ── */}
        {status === 'success' && result && (() => {
          if (result.result.length === 0) {
            return (
              <div className="empty-state">
                <div className="empty-icon">
                  <Search style={{ width: '18px', height: '18px', color: 'var(--text-3)' }} />
                </div>
                <div>
                  <div className="empty-label">No series returned</div>
                  <div className="empty-hint">The query matched no data in the selected time range</div>
                </div>
              </div>
            );
          }

          if (resultView === 'graph') {
            if (result.resultType !== 'matrix') {
              return (
                <div className="empty-state">
                  <div className="empty-icon">
                    <BarChart2 style={{ width: '18px', height: '18px', color: 'var(--text-3)' }} />
                  </div>
                  <div>
                    <div className="empty-label">Graph not available for instant queries</div>
                    <div className="empty-hint">Switch to Table view to see the result</div>
                  </div>
                </div>
              );
            }

            const { data, keys } = buildChartData(result.result);
            const longRange = ['Last 12h', 'Last 24h', 'Last 7d'].includes(timeRange);
            const tickInterval = Math.max(0, Math.ceil(data.length / 6) - 1);
            return (
              <div style={{ padding: '16px 0 8px 0' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: longRange ? 32 : 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="ts"
                      interval={tickInterval}
                      tickFormatter={ts => xAxisFormatter(ts as number, timeRange)}
                      tick={{
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        fill: 'var(--text-3)',
                        ...(longRange ? { dy: 6 } : {}),
                      }}
                      angle={longRange ? -35 : 0}
                      textAnchor={longRange ? 'end' : 'middle'}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={false}
                      height={longRange ? 72 : 30}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--text-3)' }}
                      axisLine={false}
                      tickLine={false}
                      width={56}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text)',
                      }}
                      labelFormatter={ts => new Date((ts as number) * 1000).toLocaleString()}
                    />
                    <Legend
                      verticalAlign="bottom"
                      wrapperStyle={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-3)',
                        paddingTop: '8px',
                      }}
                    />
                    {keys.map((key, i) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{ r: 3, strokeWidth: 0 }}
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            );
          }

          // Table view
          const labelCols = getLabelColumns(result);
          const rows =
            result.resultType === 'matrix'
              ? result.result
                  .slice()
                  .sort((a, b) => (a.metric.__name__ ?? '').localeCompare(b.metric.__name__ ?? ''))
                  .map((s, i) => ({
                    key: i,
                    metric: s.metric,
                    value: formatValue(s.values[s.values.length - 1]?.[1] ?? ''),
                  }))
              : result.result
                  .slice()
                  .sort((a, b) => (a.metric.__name__ ?? '').localeCompare(b.metric.__name__ ?? ''))
                  .map((s, i) => ({
                    key: i,
                    metric: s.metric,
                    value: formatValue(s.value[1]),
                  }));

          return (
            <div style={{ overflowX: 'auto' }}>
              <table className="forge-table">
                <thead>
                  <tr>
                    {labelCols.map(col => <th key={col}>{col}</th>)}
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.key}>
                      {labelCols.map(col => (
                        <td key={col} className="mono">{row.metric[col] ?? '—'}</td>
                      ))}
                      <td className="mono" style={{ color: 'var(--amber-bright)' }}>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
