import { useState } from 'react';
import { X, Save, Loader2, RotateCcw } from 'lucide-react';
import { getDefault } from '../lib/i18n';

// Edits a single site_content key (EN + MR) in a small modal.
export default function QuickTextEditor({ contentKey, content, onClose, onSaved }) {
  const existing = content.find((c) => c.content_key === contentKey);
  const def = getDefault(contentKey);
  const [en, setEn] = useState(existing?.value_en ?? def.en ?? '');
  const [mr, setMr] = useState(existing?.value_mr ?? def.mr ?? '');
  const [busy, setBusy] = useState(false);
  const long = (def.en || '').length > 60 || (existing?.value_en || '').length > 60;

  const save = async () => {
    setBusy(true);
    try {
      await fetch('/api/data?resource=site-content', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_key: contentKey, value_en: en, value_mr: mr, content_type: 'text' }),
      });
      await onSaved();
      onClose();
    } finally { setBusy(false); }
  };

  const reset = async () => {
    setBusy(true);
    try {
      await fetch('/api/data?resource=site-content', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content_key: contentKey }) });
      await onSaved();
      onClose();
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-charcoal/70 backdrop-blur-sm fade-in" onClick={onClose}>
      <div className="w-full max-w-lg bg-cream border border-charcoal/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 bg-charcoal text-cream">
          <h3 className="font-serif text-lg">Edit Text</h3>
          <button onClick={onClose} className="text-cream/60 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <code className="text-[11px] text-heritage font-bold">{contentKey}</code>
          <div>
            <label className="text-[10px] text-charcoal/50 uppercase font-bold">English</label>
            {long ? <textarea rows={4} value={en} onChange={(e) => setEn(e.target.value)} className="w-full px-3 py-2 bg-white border border-charcoal/15 focus:border-heritage outline-none text-charcoal text-sm resize-none" />
              : <input value={en} onChange={(e) => setEn(e.target.value)} className="w-full px-3 py-2 bg-white border border-charcoal/15 focus:border-heritage outline-none text-charcoal text-sm" />}
          </div>
          <div>
            <label className="text-[10px] text-charcoal/50 uppercase font-bold">मराठी</label>
            {long ? <textarea rows={4} value={mr} onChange={(e) => setMr(e.target.value)} className="w-full px-3 py-2 bg-white border border-charcoal/15 focus:border-heritage outline-none text-charcoal text-sm resize-none font-marathi" />
              : <input value={mr} onChange={(e) => setMr(e.target.value)} className="w-full px-3 py-2 bg-white border border-charcoal/15 focus:border-heritage outline-none text-charcoal text-sm font-marathi" />}
          </div>
        </div>
        <div className="flex justify-between px-5 py-4 bg-cream-dark/60 border-t border-charcoal/10">
          <button onClick={reset} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase text-charcoal/50 border border-charcoal/15 hover:border-charcoal disabled:opacity-40">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button onClick={save} disabled={busy} className="flex items-center gap-2 px-5 py-2 bg-heritage text-white text-sm font-bold uppercase hover:bg-heritage-dark disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}
