import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import AreaChart from '../components/AreaChart';
import AppHeader from '../components/AppHeader';
import { useToast } from '../components/Toast';

type StatsData = { total: number; byTemplate: Record<string, number>; byDay?: Record<string, number> };

export default function Stats() {
  const { notify } = useToast();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [history, setHistory] = useState<Array<{ createdAt?: number; pnlLamports?: number }>>([]);
  const load = async () => {
    setLoading(true);
    try {
      const [resStats, resHist] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/history')
      ]);
      setData(resStats.data);
      setHistory(resHist.data || []);
      notify({ type: 'info', message: 'Статистика загружена' });
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.error ? JSON.stringify(e.response.data.error) : 'Ошибка загрузки статистики' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const byDayProfit = useMemo(() => {
    const map: Record<string, number> = {};
    for (const h of history) {
      const raw = typeof h.createdAt === 'number' ? h.createdAt : 0;
      if (!raw) continue;
      const ms = raw < 1_000_000_000_000 ? raw * 1000 : raw;
      const key = new Date(ms).toISOString().slice(0, 10);
      const pnlLamports = typeof h.pnlLamports === 'number' ? h.pnlLamports : 0;
      map[key] = (map[key] || 0) + pnlLamports / 1_000_000_000;
    }
    return map;
  }, [history]);

  const days = useMemo(() => {
    const baseEntries = Object.entries(data?.byDay || {} as Record<string, number>);
    const uniqueDays = new Set(baseEntries.map(([d]) => d));
    // include days present only in profit map
    Object.keys(byDayProfit).forEach(d => uniqueDays.add(d));
    const merged = Array.from(uniqueDays).map(day => ({ day, count: data?.byDay?.[day] ?? 0, profit: byDayProfit[day] ?? 0 }));
    return merged.sort((a, b) => a.day.localeCompare(b.day));
  }, [data, byDayProfit]);

  const [range, setRange] = useState<'7d' | '30d' | 'all'>('all');
  const [metric, setMetric] = useState<'count' | 'profit'>('count');
  const filteredDays = useMemo(() => {
    if (range === 'all') return days;
    const keep = range === '7d' ? 7 : 30;
    return days.slice(-keep);
  }, [days, range]);
  const filteredChart = useMemo(() => filteredDays.map(d => ({ label: d.day.slice(5), value: metric === 'count' ? d.count : Number(d.profit?.toFixed(4)) })), [filteredDays, metric]);

  return (
    <div className="container">
      <AppHeader />

      <h1>Stats</h1>
      {loading ? (
        <div className="card" style={{ minHeight: 120, display: 'grid', placeItems: 'center' }}>
          <div className="spinner lg" />
        </div>
      ) : (
        <>
          <div className="card">
            <div className="row">Total tokens: {data?.total ?? 0}</div>
          </div>

          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>By day</h3>
              <div className="row small">
                <label>Metric</label>
                <select value={metric} onChange={e => setMetric(e.target.value as any)}>
                  <option value="count">Count</option>
                  <option value="profit">Profit (SOL)</option>
                </select>
                <label>Date range</label>
                <select value={range} onChange={e => setRange(e.target.value as any)}>
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>
            <AreaChart points={filteredChart} />
          </div>

          <div className="card">
            <h3>By day (table)</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th style={{ textAlign: 'right' }}>Count</th>
                  <th style={{ textAlign: 'right' }}>Profit (SOL)</th>
                </tr>
              </thead>
              <tbody>
                {filteredDays.map(d => (
                  <tr key={d.day}>
                    <td>{d.day}</td>
                    <td style={{ textAlign: 'right' }}>{d.count}</td>
                    <td style={{ textAlign: 'right' }}>{(d.profit ?? 0).toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3>By template (table)</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Template</th>
                  <th style={{ textAlign: 'right' }}>Count</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data?.byTemplate ?? {}).map(([name, v]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td style={{ textAlign: 'right' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
} 