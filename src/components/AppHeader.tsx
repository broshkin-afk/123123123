import { getTelegramUser } from '../telegram';
import React, { useEffect, useState } from 'react';

export default function AppHeader() {
  const user = getTelegramUser();
  const [sol, setSol] = useState<{ price?: number }>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [priceRes] = await Promise.all([
          fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd').then(r => r.json())
        ]);
        if (cancelled) return;
        const price = priceRes?.solana?.usd as number | undefined;
        setSol({ price });
      } catch {}
    }
    load();
    const id = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);
  return (
    <header className="nav">
      <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {user?.photo_url ? (
          <img src={user.photo_url} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
        ) : (
          <div className="icon" style={{ width: 32, height: 32, borderRadius: '50%' }} />
        )}
        <div>{user?.username || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Pump'}</div>
      </div>
      <div className="small" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span>SOL: {sol.price ? `$${sol.price.toFixed(2)}` : '—'}</span>
      </div>
    </header>
  );
} 