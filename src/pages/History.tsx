import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { CopyIcon } from '../components/icons';
import { useToast } from '../components/Toast';

type Item = {
  templateId: string | null;
  type: 'template' | 'adhoc';
  name: string;
  symbol: string;
  mint: string;
  pumpUrl: string;
  solscanUrl: string;
  createSignature: string;
  sellSignature: string;
  spentLamports: number;
  receivedLamports: number;
  pnlLamports: number;
  createdAt: number;
};

export default function History() {
  const { notify } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/history');
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const fmt = useMemo(() => new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Moscow',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }), []);

  return (
    <div className="container">
      <header className="nav">
        <div className="brand">Pump</div>
        <nav>
          <Link to="/">Templates</Link>
          <Link to="/register">Register</Link>
          <Link to="/history">History</Link>
          <Link to="/stats">Stats</Link>
        </nav>
      </header>

      <h1>History</h1>
      {loading ? (
        <div className="card" style={{ minHeight: 120, display: 'grid', placeItems: 'center' }}>
          <div className="spinner lg" />
        </div>
      ) : (
      <div className="grid">
        {items.map(x => (
          <div className="card" key={x.createSignature}>
            <div className="small" style={{ marginBottom: 6 }}>
              {(() => {
                const raw = (x as any).createdAt;
                const n = typeof raw === 'number' ? raw : Number(raw);
                if (!Number.isFinite(n)) return 'Created (MSK): -';
                const ms = n < 1_000_000_000_000 ? n * 1000 : n;
                return `Created (MSK): ${fmt.format(new Date(ms))}`;
              })()}
            </div>
            <div className="template-header">
              <div className="name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => { navigator.clipboard.writeText(x.mint); notify({ type: 'success', message: 'CA copied' }); }}
                  title="Copy CA"
                  style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}
                >
                  <CopyIcon />
                </button>
                {x.name} <span className="symbol">({x.symbol})</span>
              </div>
              <div className={x.pnlLamports >= 0 ? 'green' : 'red'}>{x.pnlLamports}</div>
            </div>
            <div className="row small">
              {(() => {
                const buy = (x as any).spentSol ?? x.spentLamports / 1_000_000_000;
                const sell = (x as any).receivedSol ?? x.receivedLamports / 1_000_000_000;
                return <span>Dev buy: {buy.toFixed(4)} SOL · Dev sell: {sell.toFixed(4)} SOL</span>;
              })()}
            </div>
            <div className="row small" style={{ marginTop: 10 }}>
              <a href={x.pumpUrl} target="_blank" rel="noreferrer">Pump</a>
              <a href={x.solscanUrl} target="_blank" rel="noreferrer">Solscan</a>
              <a href={`https://solscan.io/tx/${x.createSignature}`} target="_blank" rel="noreferrer">Create tx</a>
              <a href={`https://solscan.io/tx/${x.sellSignature}`} target="_blank" rel="noreferrer">Sell tx</a>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
} 