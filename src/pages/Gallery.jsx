import { useState } from 'react';
import { Plus, Loader2, Trash2, X, CheckSquare, Square, Film, Play } from 'lucide-react';
import { tr } from '../lib/i18n';
import EmptyState from '../components/EmptyState';
import { EditBadge, InlineEdit } from '../components/EditButton';
import { useAdmin } from '../contexts/AdminContext';
import MultiUploader from '../components/MultiUploader';

const FILTERS = ['all', 'photos', 'videos', 'forts', 'monsoon', 'canyons', 'campsites'];
const CAT_MAP = { forts: 'Forts', monsoon: 'Monsoon', canyons: 'Canyons', campsites: 'Campsites' };
const CATS = ['Forts', 'Monsoon', 'Canyons', 'Campsites'];

export default function Gallery({ isMr, items, onEditText, refresh }) {
  const { isAdmin } = useAdmin();
  const [f, setF] = useState('all');
  const [managing, setManaging] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  // Default metadata applied to freshly uploaded files
  const [meta, setMeta] = useState({ category: 'Forts', title_en: '', title_mr: '', span: 'normal' });

  const filtered = items.filter((i) => {
    if (f === 'all') return true;
    if (f === 'photos') return i.media_type !== 'video';
    if (f === 'videos') return i.media_type === 'video';
    return i.category === CAT_MAP[f];
  });

  const del = async (id) => {
    if (!confirm('Delete this item?')) return;
    await fetch('/api/gallery', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    refresh();
  };

  const bulkDelete = async () => {
    if (!selected.length) return;
    if (!confirm(`Delete ${selected.length} selected item(s)?`)) return;
    setBusy(true);
    await fetch('/api/gallery', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selected }) });
    setBusy(false); setSelected([]); refresh();
  };

  const toggleSel = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  // Called per uploaded file — immediately persists to DB with current meta
  const handleUploaded = async (item) => {
    await fetch('/api/gallery', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: item.url,
        media_type: item.media_type,
        category: meta.category,
        title_en: meta.title_en,
        title_mr: meta.title_mr,
        span: item.media_type === 'video' ? 'wide' : meta.span,
      }),
    });
  };

  const spanClass = (item) => item.media_type === 'video' ? 'aspect-video' : (item.span === 'tall' ? 'aspect-[3/4]' : item.span === 'wide' ? 'aspect-[4/3]' : 'aspect-square');

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-16">
      <div className="text-center mb-6">
        <div className="w-14 h-0.5 bg-heritage mx-auto mb-4" />
        <h1 className={`text-charcoal ${isMr ? 'font-marathi text-3xl' : 'font-serif text-4xl md:text-6xl'}`}>{tr('galleryTitle', isMr)}<InlineEdit contentKey="galleryTitle" onEdit={onEditText} /></h1>
        <p className={`text-charcoal/50 mt-3 ${isMr ? 'font-marathi' : 'font-cormorant text-xl italic'}`}>{tr('galleryIntro', isMr)}<InlineEdit contentKey="galleryIntro" onEdit={onEditText} /></p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {FILTERS.map((x) => (
          <button key={x} onClick={() => setF(x)}
            className={`px-4 py-2 text-xs font-bold tracking-wide uppercase border-2 transition-all flex items-center gap-1.5 ${isMr ? 'font-marathi' : ''} ${f === x ? 'bg-heritage border-heritage text-white' : 'border-charcoal/20 text-charcoal/60 hover:border-heritage'}`}>
            {x === 'videos' && <Film className="w-3.5 h-3.5" />}
            {x === 'photos' ? (isMr ? 'फोटो' : 'Photos') : x === 'videos' ? (isMr ? 'व्हिडिओ' : 'Videos') : tr(x, isMr)}
          </button>
        ))}
      </div>

      {/* Admin controls */}
      {isAdmin && (
        <div className="mb-8 border border-charcoal/15 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-charcoal/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-charcoal/60">{isMr ? 'दालन व्यवस्थापक' : 'Gallery Manager'}</span>
              <span className="text-[11px] text-charcoal/40">{items.length} {isMr ? 'आयटम' : 'items'}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setUploadOpen(!uploadOpen); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-heritage text-white text-xs font-bold uppercase hover:bg-heritage-dark transition-colors"><Plus className="w-3.5 h-3.5" />{isMr ? 'मीडिया जोडा' : 'Add Media'}</button>
              <button onClick={() => { setManaging(!managing); setSelected([]); }} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase border-2 transition-colors ${managing ? 'bg-charcoal text-cream border-charcoal' : 'border-charcoal/20 text-charcoal/60 hover:border-heritage'}`}>{managing ? (isMr ? 'पूर्ण' : 'Done') : (isMr ? 'निवडा व हटवा' : 'Select & Delete')}</button>
            </div>
          </div>

          {uploadOpen && (
            <div className="p-4 space-y-4">
              <div className="grid md:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-charcoal/50 uppercase font-bold">Category</label>
                  <select value={meta.category} onChange={(e) => setMeta((m) => ({ ...m, category: e.target.value }))} className="w-full px-3 py-2 bg-cream border border-charcoal/15 text-sm">{CATS.map((c) => <option key={c}>{c}</option>)}</select>
                </div>
                <div>
                  <label className="text-[10px] text-charcoal/50 uppercase font-bold">Photo Shape</label>
                  <select value={meta.span} onChange={(e) => setMeta((m) => ({ ...m, span: e.target.value }))} className="w-full px-3 py-2 bg-cream border border-charcoal/15 text-sm"><option value="normal">Square</option><option value="tall">Tall</option><option value="wide">Wide</option></select>
                </div>
                <div>
                  <label className="text-[10px] text-charcoal/50 uppercase font-bold">Caption (EN)</label>
                  <input value={meta.title_en} onChange={(e) => setMeta((m) => ({ ...m, title_en: e.target.value }))} placeholder="optional" className="w-full px-3 py-2 bg-cream border border-charcoal/15 text-sm outline-none focus:border-heritage" />
                </div>
                <div>
                  <label className="text-[10px] text-charcoal/50 uppercase font-bold">Caption (मराठी)</label>
                  <input value={meta.title_mr} onChange={(e) => setMeta((m) => ({ ...m, title_mr: e.target.value }))} placeholder="optional" className="w-full px-3 py-2 bg-cream border border-charcoal/15 text-sm outline-none focus:border-heritage font-marathi" />
                </div>
              </div>
              <p className="text-[11px] text-charcoal/40">{isMr ? 'खालील बॉक्समध्ये एकाच वेळी अनेक फोटो/व्हिडिओ निवडा. वरील श्रेणी व मथळा प्रत्येक अपलोडला लागू होईल.' : 'Select multiple photos/videos at once below. The category & caption above apply to this batch. Videos upload up to 50MB each.'}</p>
              <MultiUploader onUploaded={handleUploaded} onAllDone={refresh} />
            </div>
          )}

          {managing && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-cream-dark/40 border-t border-charcoal/10">
              <span className="text-xs text-charcoal/60">{selected.length} {isMr ? 'निवडले' : 'selected'}</span>
              <div className="flex gap-2">
                <button onClick={() => setSelected(filtered.map((i) => i.id))} className="text-xs font-bold uppercase text-charcoal/60 hover:text-heritage">{isMr ? 'सर्व निवडा' : 'Select All'}</button>
                <button onClick={bulkDelete} disabled={!selected.length || busy} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-bold uppercase hover:bg-red-700 disabled:opacity-40 transition-colors">{busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}{isMr ? 'निवडलेले हटवा' : 'Delete Selected'}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {filtered.length ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {filtered.map((item) => (
            <div key={item.id} className={`group relative overflow-hidden break-inside-avoid ${spanClass(item)} ${managing && selected.includes(item.id) ? 'ring-4 ring-heritage' : ''}`}>
              {managing && (
                <button onClick={() => toggleSel(item.id)} className="absolute top-2 left-2 z-30 grid place-items-center w-8 h-8 bg-charcoal/80 text-white">
                  {selected.includes(item.id) ? <CheckSquare className="w-5 h-5 text-heritage" /> : <Square className="w-5 h-5" />}
                </button>
              )}
              {!managing && <EditBadge onDelete={() => del(item.id)} />}

              {item.media_type === 'video' ? (
                <div className="relative w-full h-full bg-charcoal cursor-pointer" onClick={() => setLightbox(item)}>
                  <video src={item.url} className="w-full h-full object-cover" muted preload="metadata" playsInline poster={item.poster || undefined} />
                  <div className="absolute inset-0 grid place-items-center bg-charcoal/20 group-hover:bg-charcoal/40 transition-colors">
                    <div className="grid place-items-center w-14 h-14 rounded-full bg-heritage/90 group-hover:scale-110 transition-transform"><Play className="w-6 h-6 text-white fill-white ml-0.5" /></div>
                  </div>
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-charcoal/80 text-cream text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"><Film className="w-3 h-3" />Video</div>
                </div>
              ) : (
                <img src={item.url} alt={item.title_en} onClick={() => setLightbox(item)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 cursor-pointer" />
              )}

              {(item.title_en || item.title_mr) && (
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 pointer-events-none">
                  <div>
                    <div className="text-amber text-[10px] font-bold tracking-widest uppercase mb-1">{item.category}</div>
                    <div className={`text-cream font-semibold ${isMr ? 'font-marathi' : 'font-serif text-lg'}`}>{isMr ? item.title_mr : item.title_en}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : <EmptyState isMr={isMr} />}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[1200] bg-charcoal/90 backdrop-blur-sm flex items-center justify-center p-4 fade-in" onClick={() => setLightbox(null)}>
          <button className="absolute top-5 right-5 text-cream/70 hover:text-white z-10" onClick={() => setLightbox(null)}><X className="w-8 h-8" /></button>
          <div className="max-w-5xl w-full max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            {lightbox.media_type === 'video' ? (
              <video src={lightbox.url} controls autoPlay className="w-full max-h-[85vh] object-contain" />
            ) : (
              <img src={lightbox.url} alt={lightbox.title_en} className="w-full max-h-[85vh] object-contain" />
            )}
            {(lightbox.title_en || lightbox.title_mr) && (
              <div className="text-center mt-4">
                <div className="text-amber text-[10px] font-bold tracking-widest uppercase">{lightbox.category}</div>
                <div className={`text-cream ${isMr ? 'font-marathi' : 'font-serif text-lg'}`}>{isMr ? lightbox.title_mr : lightbox.title_en}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
