import { useEffect, useState } from 'react';
import axios from 'axios';
import AppHeader from '../components/AppHeader';
import { useToast } from '../components/Toast';

export default function Settings() {
  const { notify } = useToast();
  const [settings, setSettings] = useState<{ RPC_URL?: string; DEV_PRIVATE_KEY_BASE58?: string }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get('/api/settings');
      setSettings(r.data || {});
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  const save = async () => {
    try {
      const r = await axios.post('/api/settings', settings);
      setSettings(r.data);
      notify({ type: 'success', message: 'Saved' });
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.error ? JSON.stringify(e.response.data.error) : 'Ошибка сохранения настроек' });
    }
  };

  return (
    <div className="container board-theme">
      <AppHeader />

      <div className="card space" style={{ maxWidth: 640 }}>
        {loading ? (
          <div style={{ minHeight: 80, display: 'grid', placeItems: 'center' }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            <div className="field"><label>RPC URL</label><input value={settings.RPC_URL || ''} onChange={e => setSettings({ ...settings, RPC_URL: e.target.value })} disabled={loading} /></div>
            <div className="field"><label>Dev private key (base58)</label><input value={settings.DEV_PRIVATE_KEY_BASE58 || ''} onChange={e => setSettings({ ...settings, DEV_PRIVATE_KEY_BASE58: e.target.value })} disabled={loading} /></div>
            <button onClick={save} className="primary" disabled={loading}>Сохранить</button>
          </>
        )}
      </div>
    </div>
  );
} 