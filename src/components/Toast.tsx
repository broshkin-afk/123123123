import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type Toast = { id: string; type: 'success' | 'error' | 'info'; message: string; duration?: number };

type ToastContextValue = {
  notify: (input: Omit<Toast, 'id'>) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idSeq = useRef(0);

  const notify = useCallback((input: Omit<Toast, 'id'>) => {
    const id = `t${++idSeq.current}`;
    const t: Toast = { id, ...input };
    setToasts(prev => [...prev, t]);
    const ms = input.duration ?? 3000;
    if (ms > 0) setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), ms);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}


