import { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import AppHeader from '../components/AppHeader';
import { useToast } from '../components/Toast';

type Template = { id: string; name: string; symbol: string; imageUrl?: string };

type Result = {
  mint: string;
  pumpUrl: string;
  solscanUrl: string;
  createSignature: string;
  sellSignature: string;
  spentLamports: number;
  receivedLamports: number;
  pnlLamports: number;
};

type HistoryItem = {
  name: string; symbol: string; pumpUrl: string; solscanUrl: string; createSignature: string; sellSignature: string; pnlLamports: number; spentSol?: number; receivedSol?: number; pnlSol?: number;
};

export default function Register() {
  const { notify } = useToast();
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState<string>('');
  const [devBuySol, setDevBuySol] = useState<number>(1);
  const [slippage, setSlippage] = useState<number>(10);
  const [priorityFee, setPriorityFee] = useState<number>(0.0001);
  const [sellPercentage, setSellPercentage] = useState<string>('100%');
  const [adhoc, setAdhoc] = useState({ name: '', symbol: '', description: '', twitter: '', telegram: '', website: '', imageUrl: '' });
  const [adhocImagePreview, setAdhocImagePreview] = useState<string>('');
  const [mode, setMode] = useState<'template' | 'own'>('template');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const selected = useMemo(() => templates.find(t => t.id === templateId), [templates, templateId]);

  const mapToApi = useCallback((u?: string) => {
    if (!u) return u as any;
    return u.startsWith('/uploads/') ? `/api${u}` : u;
  }, []);

  const load = async () => {
    setInitialLoading(true);
    try {
      const [tpl, hist] = await Promise.all([
        axios.get('/api/templates'),
        axios.get('/api/history')
      ]);
      const sorted = (tpl.data as Template[]).slice().sort((a, b) => (b as any).createdAt - (a as any).createdAt);
      setTemplates(sorted);
      if (!templateId && sorted.length) setTemplateId(sorted[0].id);
      setHistory(hist.data);
    } finally {
      setInitialLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const submitTemplate = async () => {
    setLoading(true);
    try {
      if (!templateId) throw new Error('Не выбран шаблон');
      if (!Number.isFinite(devBuySol) || devBuySol <= 0) throw new Error('Dev buy SOL должен быть > 0');
      if (!Number.isFinite(slippage) || slippage < 0 || slippage > 100) throw new Error('Slippage должен быть в диапазоне 0-100');
      if (!Number.isFinite(priorityFee) || priorityFee < 0) throw new Error('Priority fee должен быть ≥ 0');
      const res = await axios.post('/api/register/from-template', { templateId, devBuySol, slippage, priorityFee, sellPercentage });
      setResult(res.data);
      const h = await axios.get('/api/history');
      setHistory(h.data);
      notify({ type: 'success', message: 'Токен создан из шаблона' });
    } catch (e: any) {
      const msg = e?.response?.data?.error ? JSON.stringify(e.response.data.error) : (e?.message || 'Ошибка создания токена из шаблона');
      notify({ type: 'error', message: msg });
    } finally { setLoading(false); }
  };

  const submitAdhoc = async () => {
    setLoading(true);
    try {
      // simple client-side validation
      const symbol = (adhoc.symbol || '').trim();
      const name = (adhoc.name || '').trim();
      if (!name || !symbol) throw new Error('Name и Symbol обязательны');
      if (!/^([A-Z0-9]{1,10})$/.test(symbol)) throw new Error('Symbol: 1-10 символов, только A-Z и 0-9');
      if (!Number.isFinite(devBuySol) || devBuySol <= 0) throw new Error('Dev buy SOL должен быть > 0');
      if (!Number.isFinite(slippage) || slippage < 0 || slippage > 100) throw new Error('Slippage должен быть в диапазоне 0-100');
      if (!Number.isFinite(priorityFee) || priorityFee < 0) throw new Error('Priority fee должен быть ≥ 0');
      const res = await axios.post('/api/register/adhoc', { ...adhoc, devBuySol, slippage, priorityFee, sellPercentage });
      setResult(res.data);
      const h = await axios.get('/api/history');
      setHistory(h.data);
      notify({ type: 'success', message: 'Ad-hoc токен создан' });
    } catch (e: any) {
      const msg = e?.response?.data?.error ? JSON.stringify(e.response.data.error) : (e?.message || 'Ошибка создания токена');
      notify({ type: 'error', message: msg });
    } finally { setLoading(false); }
  };

  const onAdhocFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f);
    try {
      const res = await axios.post('/api/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAdhoc({ ...adhoc, imageUrl: res.data.url });
      setAdhocImagePreview(res.data.url);
      notify({ type: 'success', message: 'Изображение загружено' });
    } catch (e: any) {
      const msg = e?.response?.data?.error ? JSON.stringify(e.response.data.error) : 'Ошибка загрузки изображения';
      notify({ type: 'error', message: msg });
    }
  };

  return (
    <div className="container board-theme">
      <AppHeader />

      <div className="card space">
        {(initialLoading || loading) && (
          <div className="overlay"><div className="spinner lg" /></div>
        )}
        <h2>Регистрация токена</h2>

        <div className="row space">
          <button className={mode === 'template' ? 'primary' : ''} onClick={() => setMode('template')} disabled={initialLoading || loading}>Template</button>
          <button className={mode === 'own' ? 'primary' : ''} onClick={() => setMode('own')} disabled={initialLoading || loading}>Own data</button>
        </div>

        {mode === 'template' ? (
          <>
            <h3>Use template</h3>
            <div className="row space">
              <div className="field" style={{ flex: 1 }}>
                <label>Шаблон</label>
                <select value={templateId} onChange={e => setTemplateId(e.target.value)} disabled={initialLoading || loading}>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.symbol})</option>)}
                </select>
              </div>
              <div className="field" style={{ flex: 1 }}><label>Dev buy (SOL)</label><input type="number" step="0.01" value={devBuySol} onChange={e => setDevBuySol(parseFloat(e.target.value))} disabled={initialLoading || loading} /></div>
              <div className="field" style={{ flex: 1 }}><label>Slippage (%)</label><input type="number" step="1" value={slippage} onChange={e => setSlippage(parseFloat(e.target.value))} disabled={initialLoading || loading} /></div>
              <div className="field" style={{ flex: 1 }}><label>Priority fee (SOL)</label><input type="number" step="0.00001" value={priorityFee} onChange={e => setPriorityFee(parseFloat(e.target.value))} disabled={initialLoading || loading} /></div>
              <div className="field" style={{ flex: 1 }}><label>Sell (%)</label><input value={sellPercentage} onChange={e => setSellPercentage(e.target.value)} disabled={initialLoading || loading} /></div>
            </div>
            {selected?.imageUrl ? <img alt="preview" src={mapToApi(selected.imageUrl)} className="preview" /> : null}
            <div style={{ position: 'relative' }}>
              <button onClick={submitTemplate} className="primary" disabled={initialLoading || loading}>{loading ? 'Processing...' : 'Create from template'}</button>
              {loading && (
                <div className="overlay"><div className="spinner" /></div>
              )}
            </div>
          </>
        ) : (
          <>
            <h3>Own data</h3>
            <div className="row space">
              <div className="field" style={{ flex: 1 }}><label>Name</label><input value={adhoc.name} onChange={e => setAdhoc({ ...adhoc, name: e.target.value })} disabled={initialLoading || loading} /></div>
              <div className="field" style={{ flex: 1 }}><label>Symbol</label><input value={adhoc.symbol} onChange={e => setAdhoc({ ...adhoc, symbol: e.target.value.toUpperCase() })} disabled={initialLoading || loading} /></div>
            </div>
            <div className="field"><label>Description</label><textarea value={adhoc.description} onChange={e => setAdhoc({ ...adhoc, description: e.target.value })} /></div>
            <div className="row space">
              <div className="field" style={{ flex: 1 }}><label>Twitter</label><input value={adhoc.twitter} onChange={e => setAdhoc({ ...adhoc, twitter: e.target.value })} /></div>
              <div className="field" style={{ flex: 1 }}><label>Telegram</label><input value={adhoc.telegram} onChange={e => setAdhoc({ ...adhoc, telegram: e.target.value })} /></div>
              <div className="field" style={{ flex: 1 }}><label>Website</label><input value={adhoc.website} onChange={e => setAdhoc({ ...adhoc, website: e.target.value })} /></div>
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Image</label>
              <input type="file" accept="image/*" onChange={onAdhocFile} disabled={initialLoading || loading} />
              {adhocImagePreview ? <img alt="preview" src={mapToApi(adhocImagePreview)} className="preview" /> : null}
            </div>
            <div className="row space">
              <div className="field" style={{ flex: 1 }}><label>Dev buy (SOL)</label><input type="number" step="0.01" value={devBuySol} onChange={e => setDevBuySol(parseFloat(e.target.value))} disabled={initialLoading || loading} /></div>
              <div className="field" style={{ flex: 1 }}><label>Slippage (%)</label><input type="number" step="1" value={slippage} onChange={e => setSlippage(parseFloat(e.target.value))} disabled={initialLoading || loading} /></div>
              <div className="field" style={{ flex: 1 }}><label>Priority fee (SOL)</label><input type="number" step="0.00001" value={priorityFee} onChange={e => setPriorityFee(parseFloat(e.target.value))} disabled={initialLoading || loading} /></div>
              <div className="field" style={{ flex: 1 }}><label>Sell (%)</label><input value={sellPercentage} onChange={e => setSellPercentage(e.target.value)} disabled={initialLoading || loading} /></div>
            </div>
            <div style={{ position: 'relative' }}>
              <button onClick={submitAdhoc} disabled={initialLoading || loading}>{loading ? 'Processing...' : 'Create ad-hoc'}</button>
              {(initialLoading || loading) && (
                <div className="overlay"><div className="spinner" /></div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="card space">
        <h2>History</h2>
        <div className="grid">
          {history.map((x, i) => (
            <div className="card" key={x.createSignature + i}>
              <div className="template-header">
                <div className="name">{x.name} <span className="symbol">({x.symbol})</span></div>
                <div className={x.pnlSol && x.pnlSol >= 0 ? 'green' : 'red'}>{(x.pnlSol ?? x.pnlLamports/1_000_000_000).toFixed(4)} SOL</div>
              </div>
              <div className="row small gap link-row">
                <a href={x.pumpUrl} target="_blank" rel="noreferrer"><span className="icon link" />Pump</a>
                <a href={x.solscanUrl} target="_blank" rel="noreferrer"><span className="icon link" />Solscan</a>
                <a href={`https://solscan.io/tx/${x.createSignature}`} target="_blank" rel="noreferrer"><span className="icon link" />Create tx</a>
                <a href={`https://solscan.io/tx/${x.sellSignature}`} target="_blank" rel="noreferrer"><span className="icon link" />Sell tx</a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
} 