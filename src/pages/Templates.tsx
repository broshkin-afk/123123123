import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import AppHeader from '../components/AppHeader';
import { DotsIcon, TwitterIcon, TelegramIcon, GlobeIcon, PencilIcon } from '../components/icons';
import ImageWithLoader from '../components/ImageWithLoader';
import { useToast } from '../components/Toast';

type Template = {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  imageUrl?: string;
  bannerUrl?: string;
  createdAt: number;
};

export default function Templates() {
  const { notify } = useToast();
  const [list, setList] = useState<Template[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [form, setForm] = useState<Partial<Template>>({});
  const [imagePreview, setImagePreview] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Partial<Template>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/templates');
      const data = (res.data as Template[]).slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setList(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const mapAssetUrl = useCallback((u?: string) => {
    if (!u) return u as any;
    return u.startsWith('/uploads/') ? `/api${u}` : u;
  }, []);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>, key: 'imageUrl' | 'bannerUrl') => {
    const f = e.target.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f);
    try {
      const res = await axios.post('/api/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ ...form, [key]: res.data.url });
      if (key === 'imageUrl') setImagePreview(res.data.url);
      if (key === 'bannerUrl') setBannerPreview(res.data.url);
      notify({ type: 'success', message: 'Файл загружен' });
    } catch (e: any) {
      const msg = e?.response?.data?.error ? JSON.stringify(e.response.data.error) : 'Ошибка загрузки файла';
      notify({ type: 'error', message: msg });
    }
  };

  const submit = async () => {
    try {
      const name = (form.name || '').trim();
      const symbol = ((form.symbol || '').trim()).toUpperCase();
      if (!name || name.length > 40) throw new Error('Название обязательно, до 40 символов');
      if (!/^([A-Z0-9]{1,10})$/.test(symbol)) throw new Error('Тикер: 1-10 символов, только A-Z и 0-9');
      const payload = { ...form, name, symbol };
      await axios.post('/api/templates', payload);
      setForm({});
      setImagePreview('');
      setBannerPreview('');
      await load();
      notify({ type: 'success', message: 'Шаблон сохранён' });
    } catch (e: any) {
      const msg = e?.response?.data?.error ? JSON.stringify(e.response.data.error) : (e?.message || 'Ошибка сохранения шаблона');
      notify({ type: 'error', message: msg });
    }
  };

  const remove = async (id: string) => {
    try {
      await axios.delete(`/api/templates/${id}`);
      setOpenMenuId(null);
      await load();
      notify({ type: 'success', message: 'Шаблон удалён' });
    } catch (e: any) {
      const msg = e?.response?.data?.error ? JSON.stringify(e.response.data.error) : 'Ошибка удаления шаблона';
      notify({ type: 'error', message: msg });
    }
  };

  const removeAll = async () => {
    try {
      await axios.delete('/api/templates');
      await load();
      notify({ type: 'success', message: 'Все шаблоны удалены' });
    } catch (e: any) {
      const msg = e?.response?.data?.error ? JSON.stringify(e.response.data.error) : 'Ошибка удаления';
      notify({ type: 'error', message: msg });
    }
  };

  const startEdit = (t: Template) => {
    setEditId(t.id);
    setEdit({ name: t.name, symbol: t.symbol, description: t.description, twitter: t.twitter, telegram: t.telegram, website: t.website, imageUrl: t.imageUrl, bannerUrl: t.bannerUrl });
    setOpenMenuId(null);
  };

  const saveEdit = async () => {
    try {
      if (!editId) return;
      const base = list.find(x => x.id === editId);
      const next = { ...base, ...edit } as Template;
      const name = (next.name || '').trim();
      const symbol = ((next.symbol || '').trim()).toUpperCase();
      if (!name || name.length > 40) throw new Error('Название обязательно, до 40 символов');
      if (!/^([A-Z0-9]{1,10})$/.test(symbol)) throw new Error('Тикер: 1-10 символов, только A-Z и 0-9');
      await axios.put(`/api/templates/${editId}`, { ...next, name, symbol });
      setEditId(null);
      setEdit({});
      await load();
      notify({ type: 'success', message: 'Шаблон обновлён' });
    } catch (e: any) {
      const msg = e?.response?.data?.error ? JSON.stringify(e.response.data.error) : (e?.message || 'Ошибка обновления');
      notify({ type: 'error', message: msg });
    }
  };

  const ensureHttp = (url?: string) => {
    if (!url) return url;
    if (url.startsWith('/')) return url;
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  };

  return (
    <div className="container board-theme">
      <AppHeader />

      <h1>Create template</h1>
      <div className="card space">
        {loading && (
          <div className="overlay"><div className="spinner lg" /></div>
        )}
        <div className="row space">
          <div className="field" style={{ flex: 1 }}>
            <label>Name</label>
            <input placeholder="Coin name" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} disabled={loading} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Symbol</label>
            <input placeholder="Ticker" value={form.symbol || ''} onChange={e => setForm({ ...form, symbol: e.target.value.toUpperCase() })} disabled={loading} />
          </div>
        </div>
         <div className="field"><label>Description</label><textarea placeholder="Description" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} disabled={loading} /></div>
        <div className="row space">
          <div className="field" style={{ flex: 1 }}><label>Twitter</label><input placeholder="https://twitter.com/..." value={form.twitter || ''} onChange={e => setForm({ ...form, twitter: e.target.value })} disabled={loading} /></div>
          <div className="field" style={{ flex: 1 }}><label>Telegram</label><input placeholder="https://t.me/..." value={form.telegram || ''} onChange={e => setForm({ ...form, telegram: e.target.value })} disabled={loading} /></div>
          <div className="field" style={{ flex: 1 }}><label>Website</label><input placeholder="https://..." value={form.website || ''} onChange={e => setForm({ ...form, website: e.target.value })} disabled={loading} /></div>
        </div>
        <div className="row space">
          <div className="field" style={{ flex: 1 }}>
            <label>Image</label>
            <input type="file" accept="image/*" onChange={e => onFile(e, 'imageUrl')} disabled={loading} />
            {imagePreview ? <ImageWithLoader src={ensureHttp(mapAssetUrl(imagePreview))!} alt="preview" /> : null}
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Banner</label>
            <input type="file" accept="image/*" onChange={e => onFile(e, 'bannerUrl')} disabled={loading} />
            {bannerPreview ? <ImageWithLoader src={ensureHttp(mapAssetUrl(bannerPreview))!} alt="banner" placeholderHeight={220} /> : null}
          </div>
        </div>
        <div className="row space">
          <button onClick={submit} className="primary" disabled={loading}>Save template</button>
          <button onClick={removeAll} className="danger" disabled={loading}>Delete all</button>
        </div>
      </div>

      <h2>Templates</h2>
      {loading ? (
        <div className="card" style={{ minHeight: 120, display: 'grid', placeItems: 'center' }}>
          <div className="spinner lg" />
        </div>
      ) : (
      <div className="grid">
        {list.map(t => (
          <div key={t.id} className="card space">
            {t.imageUrl ? <ImageWithLoader src={ensureHttp(mapAssetUrl(t.imageUrl))!} alt="thumb" /> : null}
            <button className="action-btn" onClick={() => setOpenMenuId(openMenuId === t.id ? null : t.id)} disabled={loading}><DotsIcon /></button>
            {openMenuId === t.id && (
              <div className="action-menu">
                <button onClick={() => startEdit(t)} disabled={loading}><PencilIcon /> Edit</button>
                <button onClick={() => remove(t.id)} disabled={loading}>Delete</button>
              </div>
            )}
            <div className="template-header">
              <div className="name">{t.name} <span className="symbol">({t.symbol})</span></div>
            </div>
            <div className="meta">{t.description}</div>
            <div className="meta small link-row">
              {t.twitter ? <a href={ensureHttp(t.twitter)} target="_blank" rel="noreferrer"><TwitterIcon />Twitter</a> : null}
              {t.telegram ? <a href={ensureHttp(t.telegram)} target="_blank" rel="noreferrer"><TelegramIcon />Telegram</a> : null}
              {t.website ? <a href={ensureHttp(t.website)} target="_blank" rel="noreferrer"><GlobeIcon />Website</a> : null}
            </div>
            {t.bannerUrl ? <ImageWithLoader src={ensureHttp(mapAssetUrl(t.bannerUrl))!} alt="banner" placeholderHeight={220} /> : null}

            {editId === t.id && (
              <div className="card" style={{ marginTop: 12 }}>
                <div className="row space">
                  <div className="field" style={{ flex: 1 }}><label>Название</label><input value={edit.name || ''} onChange={e => setEdit({ ...edit, name: e.target.value })} disabled={loading} /></div>
                  <div className="field" style={{ flex: 1 }}><label>Тикер</label><input value={edit.symbol || ''} onChange={e => setEdit({ ...edit, symbol: e.target.value.toUpperCase() })} disabled={loading} /></div>
                </div>
                <div className="field"><label>Описание</label><textarea value={edit.description || ''} onChange={e => setEdit({ ...edit, description: e.target.value })} disabled={loading} /></div>
                <div className="row space">
                  <div className="field" style={{ flex: 1 }}><label>Twitter</label><input value={edit.twitter || ''} onChange={e => setEdit({ ...edit, twitter: e.target.value })} disabled={loading} /></div>
                  <div className="field" style={{ flex: 1 }}><label>Telegram</label><input value={edit.telegram || ''} onChange={e => setEdit({ ...edit, telegram: e.target.value })} disabled={loading} /></div>
                  <div className="field" style={{ flex: 1 }}><label>Website</label><input value={edit.website || ''} onChange={e => setEdit({ ...edit, website: e.target.value })} disabled={loading} /></div>
                </div>
                <div className="row space">
                  <button className="primary" onClick={saveEdit} disabled={loading}>Save</button>
                  <button onClick={() => { setEditId(null); setEdit({}); }} disabled={loading}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      )}
      <div style={{ height: 80 }} />
    </div>
  );
} 