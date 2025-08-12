import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

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
            <div className="template-header">
              <div className="name">{x.name} <span className="symbol">({x.symbol})</span></div>
              <div className={x.pnlLamports >= 0 ? 'green' : 'red'}>{x.pnlLamports}</div>
            </div>
            <div className="row small">
              <a href={x.pumpUrl} target="_blank">Pump</a>
              <a href={x.solscanUrl} target="_blank">Solscan</a>
              <a href={`https://solscan.io/tx/${x.createSignature}`} target="_blank">Create</a>
              <a href={`https://solscan.io/tx/${x.sellSignature}`} target="_blank">Sell</a>
            </div>
            <div className="row small">
              <div>Spent: {x.spentLamports}</div>
              <div>Received: {x.receivedLamports}</div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
} 