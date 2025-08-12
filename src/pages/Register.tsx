import { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import AppHeader from '../components/AppHeader';
import ImageWithLoader from '../components/ImageWithLoader';
import { CopyIcon } from '../components/icons';
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
  name: string;
  symbol: string;
  pumpUrl: string;
  solscanUrl: string;
  createSignature: string;
  sellSignature: string;
  pnlLamports: number;
  spentSol?: number;
  receivedSol?: number;
  pnlSol?: number;
  createdAt?: number;
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
  const fmt = useMemo(() => new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Moscow',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }), []);

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
      <h1>Register token</h1>
      <div className="card space">
        {(initialLoading || loading) && (
          <div className="overlay"><div className="spinner lg" /></div>
        )}
        

        <div className="row space">
          <button className={mode === 'template' ? 'primary' : ''} onClick={() => setMode('template')} disabled={initialLoading || loading}>Template</button>
          <button className={mode === 'own' ? 'primary' : ''} onClick={() => setMode('own')} disabled={initialLoading || loading}>Own data</button>
        </div>

        {mode === 'template' ? (
          <>
            <h3>Use template</h3>
            <div className="row space">
              <div className="field" style={{ flex: 1 }}>
                <label>Template</label>
                <select value={templateId} onChange={e => setTemplateId(e.target.value)} disabled={initialLoading || loading}>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.symbol})</option>)}
                </select>
              </div>
              <div className="field" style={{ flex: 1 }}><label>Dev buy (SOL)</label><input type="number" step="0.01" value={devBuySol} onChange={e => setDevBuySol(parseFloat(e.target.value))} disabled={initialLoading || loading} /></div>
              <div className="field" style={{ flex: 1 }}><label>Slippage (%)</label><input type="number" step="1" value={slippage} onChange={e => setSlippage(parseFloat(e.target.value))} disabled={initialLoading || loading} /></div>
              <div className="field" style={{ flex: 1 }}><label>Priority fee (SOL)</label><input type="number" step="0.00001" value={priorityFee} onChange={e => setPriorityFee(parseFloat(e.target.value))} disabled={initialLoading || loading} /></div>
              <div className="field" style={{ flex: 1 }}><label>Sell (%)</label><input value={sellPercentage} onChange={e => setSellPercentage(e.target.value)} disabled={initialLoading || loading} /></div>
            </div>
            {selected?.imageUrl ? <ImageWithLoader alt="preview" src={mapToApi(selected.imageUrl)!} /> : null}
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
              {adhocImagePreview ? <ImageWithLoader alt="preview" src={mapToApi(adhocImagePreview)!} /> : null}
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
                    onClick={() => { navigator.clipboard.writeText((x as any).mint); notify({ type: 'success', message: 'CA copied' }); }}
                    title="Copy CA"
                    style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}
                  >
                    <CopyIcon />
                  </button>
                  {x.name} <span className="symbol">({x.symbol})</span>
                </div>
                <div className={x.pnlSol && x.pnlSol >= 0 ? 'green' : 'red'}>{(x.pnlSol ?? x.pnlLamports/1_000_000_000).toFixed(4)} SOL</div>
              </div>
              <div className="row small" style={{ marginTop: 4 }}>
                {(() => {
                  const buy = (x as any).spentSol ?? x.pnlLamports === undefined ? undefined : (x as any).spentSol;
                  const buyVal = (x as any).spentSol ?? x.pnlLamports === undefined ? 0 : (x as any).spentSol;
                  const buyCalc = (x as any).spentSol ?? (x as any).spentLamports ? ((x as any).spentSol ?? (x as any).spentLamports / 1_000_000_000) : 0;
                  const sellCalc = (x as any).receivedSol ?? (x as any).receivedLamports ? ((x as any).receivedSol ?? (x as any).receivedLamports / 1_000_000_000) : 0;
                  return <span>Dev buy: {buyCalc.toFixed(4)} SOL · Dev sell: {sellCalc.toFixed(4)} SOL</span>;
                })()}
              </div>
              <div className="row small gap" style={{ marginTop: 10 }}>
                <a href={x.pumpUrl} target="_blank" rel="noreferrer">Pump</a>
                <a href={x.solscanUrl} target="_blank" rel="noreferrer">Solscan</a>
                <a href={`https://solscan.io/tx/${x.createSignature}`} target="_blank" rel="noreferrer">Create tx</a>
                <a href={`https://solscan.io/tx/${x.sellSignature}`} target="_blank" rel="noreferrer">Sell tx</a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
} 