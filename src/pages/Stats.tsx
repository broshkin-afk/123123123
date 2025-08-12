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
  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/stats');
      setData(res.data);
      notify({ type: 'info', message: 'Статистика загружена' });
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.error ? JSON.stringify(e.response.data.error) : 'Ошибка загрузки статистики' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const days = useMemo(() => {
    if (!data?.byDay) return [] as Array<{ day: string; count: number }>;
    return Object.entries(data.byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, count]) => ({ day, count }));
  }, [data]);
  const max = useMemo(() => (days.length ? Math.max(...days.map(d => d.count)) : 0), [days]);
  const chartPoints = useMemo(() => days.map(d => ({ label: d.day.slice(5), value: d.count })), [days]);

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
            <div>
              {Object.entries(data?.byTemplate ?? {}).map(([name, v]) => (
                <div className="row" key={name}>{name}: {v}</div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>By day</h3>
            <AreaChart points={chartPoints} />
          </div>

          <div className="card">
            <h3>By day (table)</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th style={{ textAlign: 'right' }}>Count</th>
                </tr>
              </thead>
              <tbody>
                {days.map(d => (
                  <tr key={d.day}>
                    <td>{d.day}</td>
                    <td style={{ textAlign: 'right' }}>{d.count}</td>
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