/**
 * Mimir API utilities.
 * All requests to Mimir go through here so auth headers and base URL
 * handling stay in one place.
 */

export type ConnectionStatus = 'checking' | 'connected' | 'unreachable';

/**
 * Pings the Mimir /ready endpoint.
 * Returns 'connected' on HTTP 200, 'unreachable' on any error or non-200.
 * Times out after 5 s.
 */
export async function checkMimirHealth(mimirBaseUrl: string): Promise<ConnectionStatus> {
  try {
    const base = mimirBaseUrl.replace(/\/$/, '');
    const url = base ? `${base}/ready` : '/ready';
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return res.ok ? 'connected' : 'unreachable';
  } catch {
    return 'unreachable';
  }
}

export interface Rule {
  name: string;
  type: 'alerting' | 'recording';
  query: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  state?: 'firing' | 'pending' | 'inactive';
  duration?: number;
}

export interface RuleGroup {
  name: string;
  file: string;
  rules: Rule[];
  interval: number;
}

/**
 * Fetches all rule groups for a tenant from the Mimir ruler API.
 * Endpoint: GET /prometheus/config/v1/rules
 */
export async function fetchRuleGroups(
  mimirBaseUrl: string,
  tenantId: string,
): Promise<RuleGroup[]> {
  const base = mimirBaseUrl.replace(/\/$/, '');
  const url = base ? `${base}/prometheus/api/v1/rules` : '/prometheus/api/v1/rules';
  const res = await fetch(url, {
    headers: { 'X-Scope-OrgID': tenantId },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Ruler API ${res.status}`);
  const json = await res.json();
  return json.data?.groups ?? [];
}

export interface ActiveAlert {
  labels: Record<string, string>;
  state: 'firing' | 'pending' | 'inactive';
  activeAt: string;
}

// ── Prometheus query types ────────────────────────────────────────────────────

/** A label set identifying a single time series */
export type Labels = Record<string, string>;

/** One data point: [unix_timestamp_seconds, string_value] */
export type Sample = [number, string];

/** A single series in a range query result */
export interface MatrixSeries {
  metric: Labels;
  values: Sample[];
}

/** A single series in an instant query result */
export interface VectorSample {
  metric: Labels;
  value: Sample;
}

export interface RangeQueryResult {
  resultType: 'matrix';
  result: MatrixSeries[];
}

export interface InstantQueryResult {
  resultType: 'vector';
  result: VectorSample[];
}

export type QueryResult = RangeQueryResult | InstantQueryResult;

export interface ResolvedTimeRange {
  start: number; // unix seconds
  end: number;   // unix seconds
  step: number;  // seconds, targets ~300 data points
}

const TIME_RANGE_SECONDS: Record<string, number> = {
  'Last 5m':  5   * 60,
  'Last 15m': 15  * 60,
  'Last 1h':  60  * 60,
  'Last 3h':  3   * 3600,
  'Last 12h': 12  * 3600,
  'Last 24h': 24  * 3600,
  'Last 7d':  7   * 86400,
};

export function resolveTimeRange(label: string): ResolvedTimeRange {
  const duration = TIME_RANGE_SECONDS[label] ?? 3600;
  const end   = Math.floor(Date.now() / 1000);
  const start = end - duration;
  const step  = Math.max(15, Math.ceil(duration / 300));
  return { start, end, step };
}

export async function fetchRangeQuery(
  mimirBaseUrl: string,
  tenantId: string,
  query: string,
  start: number,
  end: number,
  step: number,
): Promise<RangeQueryResult> {
  const base = mimirBaseUrl.replace(/\/$/, '');
  const url  = base ? `${base}/prometheus/api/v1/query_range` : '/prometheus/api/v1/query_range';
  const params = new URLSearchParams({
    query,
    start: String(start),
    end:   String(end),
    step:  String(step),
  });
  const res = await fetch(`${url}?${params}`, {
    headers: { 'X-Scope-OrgID': tenantId },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Query failed ${res.status}: ${body}`);
  }
  const json = await res.json();
  if (json.status !== 'success') throw new Error(json.error ?? 'Query error');
  return json.data as RangeQueryResult;
}

export async function fetchInstantQuery(
  mimirBaseUrl: string,
  tenantId: string,
  query: string,
): Promise<InstantQueryResult> {
  const base = mimirBaseUrl.replace(/\/$/, '');
  const url  = base ? `${base}/prometheus/api/v1/query` : '/prometheus/api/v1/query';
  const params = new URLSearchParams({
    query,
    time: String(Math.floor(Date.now() / 1000)),
  });
  const res = await fetch(`${url}?${params}`, {
    headers: { 'X-Scope-OrgID': tenantId },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Query failed ${res.status}: ${body}`);
  }
  const json = await res.json();
  if (json.status !== 'success') throw new Error(json.error ?? 'Query error');
  return json.data as InstantQueryResult;
}

/**
 * Fetches all alerting rules (all states) for a tenant from the Mimir ruler API.
 * Uses /prometheus/api/v1/rules and extracts alerting-type rules so that
 * inactive alerts are included alongside firing and pending ones.
 */
export async function fetchAlerts(
  mimirBaseUrl: string,
  tenantId: string,
): Promise<ActiveAlert[]> {
  const groups = await fetchRuleGroups(mimirBaseUrl, tenantId);
  return groups.flatMap(g =>
    g.rules
      .filter(r => r.type === 'alerting')
      .map(r => ({
        labels: { alertname: r.name, ...r.labels },
        state: r.state ?? 'inactive',
        activeAt: '',
      }))
  );
}
