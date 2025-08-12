import React, { useEffect, useState } from 'react';
import { getTelegramUser } from '../telegram';
import { useToast } from './Toast';

type Props = { children: React.ReactNode };

const allowedIds = new Set<number>([282063428, 432156014]);

export default function TgGate({ children }: Props) {
  const { notify } = useToast();
  // Bypass gate in local dev (vite dev server)
  if (import.meta.env.DEV) {
    return <>{children}</>;
  }
  const [status, setStatus] = useState<'loading' | 'allowed' | 'denied'>('loading');

  useEffect(() => {
    try {
      const user = getTelegramUser();
      if (user && typeof user.id === 'number' && allowedIds.has(user.id)) {
        setStatus('allowed');
      } else {
        setStatus('denied');
        notify({ type: 'error', message: 'Access denied' });
      }
    } catch {
      setStatus('denied');
      notify({ type: 'error', message: 'Access denied' });
    }
  }, [notify]);

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div className="spinner lg" />
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <div>Access denied</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

