import { useState } from 'react';
import { Save, Loader2, RotateCcw, Search, Film, Image as ImageIcon, Type, Phone, ChevronDown } from 'lucide-react';
import { CONTENT_GROUPS, getDefault } from '../lib/i18n';
import Uploader from './Uploader';

/**
 * SiteCustomizer — lets the admin edit EVERY label (EN + Marathi),
 * the hero background (video or image), and business/contact details.
 * All changes persist to the DB via /api/site-content, /api/upload,
 * /api/business-settings and reflect live on the site.
 */
export default function SiteCustomizer({ content, settings, refresh }) {
  const [tab, setTab] = useState('text');
  const [drafts, setDrafts] = useState({}); // key -> {en, mr}
  const [saving, setSaving] = useState('');
  const [q, setQ] = useState('');
  const [openGroup, setOpenGroup] = useState(CONTENT_GROUPS[0].label);

  // map of existing overrides for quick lookup
  const cmap = {};
  content.forEach((c) => { cmap[c.content_key] = c; });

  const currentVal = (key, lang) => {
    if (drafts[key] && drafts[key][lang] !== undefined) return drafts[key][lang];
    const c = cmap[key];
    if (c) return (lang === 'en' ? c.value_en : c.value_mr) ?? '';
    return getDefault(key)[lang] ?? '';
  };

  const setDraft = (key, lang, val) => {
    setDrafts((d) => ({ ...d, [key]: { ...d[key], [lang]: val } }));
  };

  const saveKey = async (key) => {
    setSaving(key);
    try {
      await fetch('/api/data?resource=site-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_key: key,
          value_en: currentVal(key, 'en'),
          value_mr: currentVal(key, 'mr'),
          content_type: 'text',
        }),
      });
      await refresh();
      setDrafts((d) => { const n = { ...d }; delete n[key]; return n; });
    } finally { setSaving(''); }
  };

  const resetKey = async (key) => {
    setSaving(key);
    try {
      await fetch('/api/data?resource=site-content', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_key: key }),
      });
      await refresh();
      setDrafts((d) => { const n = { ...d }; delete n[key]; return n; });
    } finally { setSaving(''); }
  };

  // ---- Hero media ----
  const heroType = cmap['hero_media_type']?.value_en || 'video';
  const heroUrl = cmap['hero_media_url']?.value_en || '/videos/hero.mp4';

  const saveHero = async (type, url) => {
    await fetch('/api/data?resource=site-content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content_key: 'hero_media_type', value_en: type, value_mr: type, content_type: 'config' }) });
    await fetch('/api/data?resource=site-content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content_key: 'hero_media_url', value_en: url, value_mr: url, content_type: 'media' }) });
    await refresh();
  };

  // ---- Business settings ----
  const [biz, setBiz] = useState(null);
  const b = biz || settings || {};
  const setB = (patch) => setBiz({ ...b, ...patch });
  const saveBiz = async () => {
    setSaving('biz');
    try {
      await fetch('/api/data?resource=business-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
      await refresh();
      setBiz(null);
    } finally { setSaving(''); }
  };

  const tabs = [
    { key: 'text', label: 'Text & Labels', icon: Type },
    { key: 'hero', label: 'Hero Background', icon: Film },
    { key: 'contact', label: 'Contact & Brand', icon: Phone },
  ];

  const filterGroup = (grp) => {
    if (!q) return grp.keys;
    const s = q.toLowerCase();
    return grp.keys.filter((k) => k.toLowerCase().includes(s) || getDefault(k).en.toLowerCase().includes(s) || (getDefault(k).mr || '').includes(q));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide border-2 transition-all ${tab === t.key ? 'bg-heritage border-heritage text-white' : 'border-charcoal/15 text-charcoal/60 hover:border-heritage'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ---------- TEXT EDITOR ---------- */}
      {tab === 'text' && (
        <div>
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search any label to edit..."
              className="w-full pl-10 pr-4 py-2.5 bg-cream border border-charcoal/15 focus:border-heritage outline-none text-charcoal text-sm" />
          </div>

          <div className="space-y-3">
            {CONTENT_GROUPS.map((grp) => {
              const keys = filterGroup(grp);
              if (!keys.length) return null;
              const open = q ? true : openGroup === grp.label;
              return (
                <div key={grp.label} className="border border-charcoal/10">
                  <button onClick={() => setOpenGroup(open ? '' : grp.label)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-cream-dark/40">
                    <span className="font-bold text-charcoal text-sm uppercase tracking-wide">{grp.label}</span>
                    <ChevronDown className={`w-4 h-4 text-charcoal/50 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <div className="p-4 space-y-4">
                      {keys.map((key) => {
                        const dirty = !!drafts[key];
                        const overridden = !!cmap[key];
                        const isLong = (getDefault(key).en || '').length > 60;
                        return (
                          <div key={key} className="border-b border-charcoal/5 pb-4 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between mb-2">
                              <code className="text-[11px] text-heritage font-bold">{key}{overridden && <span className="ml-2 text-emerald-600">● edited</span>}</code>
                              <div className="flex gap-1.5">
                                {overridden && (
                                  <button onClick={() => resetKey(key)} title="Reset to default"
                                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase text-charcoal/50 border border-charcoal/15 hover:border-charcoal">
                                    <RotateCcw className="w-3 h-3" /> Reset
                                  </button>
                                )}
                                <button onClick={() => saveKey(key)} disabled={!dirty || saving === key}
                                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase text-white bg-charcoal hover:bg-heritage disabled:opacity-40 transition-colors">
                                  {saving === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                                </button>
                              </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-charcoal/40 uppercase font-bold">English</label>
                                {isLong ? (
                                  <textarea rows={2} value={currentVal(key, 'en')} onChange={(e) => setDraft(key, 'en', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-charcoal/15 focus:border-heritage outline-none text-charcoal text-sm resize-none" />
                                ) : (
                                  <input value={currentVal(key, 'en')} onChange={(e) => setDraft(key, 'en', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-charcoal/15 focus:border-heritage outline-none text-charcoal text-sm" />
                                )}
                              </div>
                              <div>
                                <label className="text-[10px] text-charcoal/40 uppercase font-bold">मराठी</label>
                                {isLong ? (
                                  <textarea rows={2} value={currentVal(key, 'mr')} onChange={(e) => setDraft(key, 'mr', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-charcoal/15 focus:border-heritage outline-none text-charcoal text-sm resize-none font-marathi" />
                                ) : (
                                  <input value={currentVal(key, 'mr')} onChange={(e) => setDraft(key, 'mr', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-charcoal/15 focus:border-heritage outline-none text-charcoal text-sm font-marathi" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------- HERO BACKGROUND ---------- */}
      {tab === 'hero' && (
        <div className="space-y-6">
          <div className="border border-charcoal/10 p-5">
            <h3 className="font-bold text-charcoal mb-1">Hero Background Preview</h3>
            <p className="text-xs text-charcoal/50 mb-4">This is what visitors see behind the homepage headline.</p>
            <div className="relative h-56 bg-charcoal overflow-hidden">
              {heroType === 'video' ? (
                <video key={heroUrl} src={heroUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={heroUrl} alt="hero" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-[2px] grid place-items-center">
                <span className="font-serif text-cream text-2xl italic">Climb the forts.</span>
              </div>
            </div>
            <p className="text-[11px] text-charcoal/40 mt-2 break-all">Current: {heroUrl}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-charcoal/10 p-5">
              <div className="flex items-center gap-2 mb-3"><Film className="w-5 h-5 text-heritage" /><h4 className="font-bold text-charcoal">Upload a Video</h4></div>
              <p className="text-xs text-charcoal/50 mb-4">MP4 or WebM, up to 50MB. Plays muted & looping.</p>
              <Uploader accept="video/mp4,video/webm" label="Choose Video" onUploaded={(url) => saveHero('video', url)} />
            </div>
            <div className="border border-charcoal/10 p-5">
              <div className="flex items-center gap-2 mb-3"><ImageIcon className="w-5 h-5 text-heritage" /><h4 className="font-bold text-charcoal">Upload an Image</h4></div>
              <p className="text-xs text-charcoal/50 mb-4">JPG, PNG or WebP. Used as a static hero background.</p>
              <Uploader accept="image/*" label="Choose Image" onUploaded={(url) => saveHero('image', url)} />
            </div>
          </div>

          <div className="border border-charcoal/10 p-5">
            <h4 className="font-bold text-charcoal mb-2">Or paste a media URL</h4>
            <HeroUrlForm currentType={heroType} currentUrl={heroUrl} onSave={saveHero} />
          </div>
        </div>
      )}

      {/* ---------- CONTACT & BRAND ---------- */}
      {tab === 'contact' && (
        <div className="border border-charcoal/10 p-5 space-y-4 max-w-2xl">
          <h3 className="font-bold text-charcoal mb-2">Business & Contact Details</h3>
          {[
            ['phone', 'Primary Phone'], ['emergency_phone', 'Emergency Phone'], ['email', 'Email'],
            ['whatsapp', 'WhatsApp Number (digits only, e.g. 919822044561)'], ['instagram', 'Instagram Handle'],
            ['next_departure', 'Next Departure (YYYY-MM-DDTHH:MM:SS)'], ['map_embed', 'HQ Map Embed URL'],
          ].map(([field, label]) => (
            <div key={field}>
              <label className="text-[10px] text-charcoal/40 uppercase font-bold">{label}</label>
              <input value={b[field] ?? ''} onChange={(e) => setB({ [field]: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-charcoal/15 focus:border-heritage outline-none text-charcoal text-sm" />
            </div>
          ))}
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-charcoal/40 uppercase font-bold">HQ Address (EN)</label>
              <textarea rows={2} value={b.address_en ?? ''} onChange={(e) => setB({ address_en: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-charcoal/15 focus:border-heritage outline-none text-charcoal text-sm resize-none" />
            </div>
            <div>
              <label className="text-[10px] text-charcoal/40 uppercase font-bold">HQ Address (मराठी)</label>
              <textarea rows={2} value={b.address_mr ?? ''} onChange={(e) => setB({ address_mr: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-charcoal/15 focus:border-heritage outline-none text-charcoal text-sm resize-none font-marathi" />
            </div>
          </div>
          <button onClick={saveBiz} disabled={!biz || saving === 'biz'}
            className="flex items-center gap-2 px-5 py-2.5 bg-charcoal text-cream text-sm font-bold uppercase tracking-wide hover:bg-heritage disabled:opacity-40 transition-colors">
            {saving === 'biz' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Details
          </button>
        </div>
      )}
    </div>
  );
}

function HeroUrlForm({ currentType, currentUrl, onSave }) {
  const [url, setUrl] = useState(currentUrl);
  const [type, setType] = useState(currentType);
  return (
    <div className="flex flex-wrap gap-2 items-end">
      <div className="flex-1 min-w-[200px]">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..."
          className="w-full px-3 py-2 bg-white border border-charcoal/15 focus:border-heritage outline-none text-charcoal text-sm" />
      </div>
      <select value={type} onChange={(e) => setType(e.target.value)}
        className="px-3 py-2 bg-white border border-charcoal/15 text-charcoal text-sm">
        <option value="video">Video</option>
        <option value="image">Image</option>
      </select>
      <button onClick={() => onSave(type, url)}
        className="px-4 py-2 bg-charcoal text-cream text-xs font-bold uppercase hover:bg-heritage transition-colors">Apply</button>
    </div>
  );
}
