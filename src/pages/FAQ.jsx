import { useState } from 'react';
import { Search, Plus, Minus, ShieldCheck, CreditCard, Backpack, Coffee, Pencil, Trash2, Loader2, X } from 'lucide-react';
import { tr } from '../lib/i18n';
import { AddButton, InlineEdit } from '../components/EditButton';
import { useAdmin } from '../contexts/AdminContext';

const CATS = [
  { key: 'Safety', label: 'safety', icon: ShieldCheck },
  { key: 'Bookings', label: 'bookings', icon: CreditCard },
  { key: 'Rentals', label: 'rentals', icon: Backpack },
  { key: 'Hospitality', label: 'hospitality', icon: Coffee },
];

export default function FAQ({ isMr, faqs, onEditText, refresh }) {
  const { isAdmin } = useAdmin();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const [editing, setEditing] = useState(null); // faq object or 'new'

  const match = (f) => {
    const s = q.toLowerCase();
    return !s || (isMr ? f.question_mr : f.question_en).toLowerCase().includes(s) || (isMr ? f.answer_mr : f.answer_en).toLowerCase().includes(s);
  };
  const filtered = faqs.filter(match);

  const del = async (id) => {
    if (!confirm('Delete this FAQ?')) return;
    await fetch('/api/data?resource=faqs', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    refresh();
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <div className="text-center mb-8">
        <div className="w-14 h-0.5 bg-heritage mx-auto mb-4" />
        <h1 className={`text-charcoal ${isMr ? 'font-marathi text-3xl' : 'font-serif text-4xl md:text-6xl'}`}>{tr('faqTitle', isMr)}<InlineEdit contentKey="faqTitle" onEdit={onEditText} /></h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={tr('faqSearch', isMr)}
          className={`w-full pl-12 pr-4 py-3.5 bg-white border border-charcoal/15 focus:border-heritage outline-none text-charcoal ${isMr ? 'font-marathi' : ''}`} />
      </div>

      {isAdmin && <div className="mb-8 flex justify-center"><AddButton onClick={() => setEditing('new')} label={isMr ? 'प्रश्न जोडा' : 'Add FAQ'} /></div>}

      {CATS.map(cat => {
        const catFaqs = filtered.filter(f => f.category === cat.key);
        if (!catFaqs.length) return null;
        return (
          <div key={cat.key} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <cat.icon className="w-5 h-5 text-heritage" />
              <h2 className={`text-lg font-bold text-charcoal tracking-wide uppercase ${isMr ? 'font-marathi' : ''}`}>{tr(cat.label, isMr)}</h2>
            </div>
            <div className="space-y-2">
              {catFaqs.map(f => {
                const isO = open === f.id;
                return (
                  <div key={f.id} className="bg-white border border-charcoal/10">
                    <div className="w-full flex items-center justify-between gap-2 px-5 py-4">
                      <button onClick={() => setOpen(isO ? null : f.id)} className="flex-1 flex items-center justify-between gap-3 text-left">
                        <span className={`font-semibold text-charcoal ${isMr ? 'font-marathi' : ''}`}>{isMr ? f.question_mr : f.question_en}</span>
                        {isO ? <Minus className="w-5 h-5 text-heritage shrink-0" /> : <Plus className="w-5 h-5 text-heritage shrink-0" />}
                      </button>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <button onClick={() => setEditing(f)} className="p-1.5 text-charcoal/50 hover:text-heritage"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => del(f.id)} className="p-1.5 text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                    {isO && <div className={`px-5 pb-4 text-charcoal/65 leading-relaxed fade-in ${isMr ? 'font-marathi' : ''}`}>{isMr ? f.answer_mr : f.answer_en}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {!filtered.length && <p className={`text-center text-charcoal/50 py-10 ${isMr ? 'font-marathi' : 'font-cormorant text-lg italic'}`}>{tr('noFaqs', isMr)}</p>}

      {editing && <FaqEditor faq={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={refresh} />}
    </div>
  );
}

function FaqEditor({ faq, onClose, onSaved }) {
  const [f, setF] = useState(faq || { category: 'Safety', question_en: '', question_mr: '', answer_en: '', answer_mr: '' });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const save = async () => {
    if (!f.question_en?.trim()) { alert('Question required'); return; }
    setBusy(true);
    const method = f.id ? 'PUT' : 'POST';
    await fetch('/api/data?resource=faqs', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
    setBusy(false); await onSaved(); onClose();
  };
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-charcoal/70 backdrop-blur-sm fade-in" onClick={onClose}>
      <div className="w-full max-w-lg bg-cream border border-charcoal/10 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 bg-charcoal text-cream sticky top-0"><h3 className="font-serif text-lg">{f.id ? 'Edit' : 'Add'} FAQ</h3><button onClick={onClose}><X className="w-5 h-5 text-cream/60 hover:text-white" /></button></div>
        <div className="p-5 space-y-3">
          <div><label className="text-[10px] text-charcoal/50 uppercase font-bold">Category</label>
            <select value={f.category} onChange={e => set('category', e.target.value)} className="w-full px-3 py-2 bg-white border border-charcoal/15 text-sm">{CATS.map(c => <option key={c.key} value={c.key}>{c.key}</option>)}</select></div>
          <div><label className="text-[10px] text-charcoal/50 uppercase font-bold">Question (EN)</label><input value={f.question_en} onChange={e => set('question_en', e.target.value)} className="w-full px-3 py-2 bg-white border border-charcoal/15 text-sm outline-none focus:border-heritage" /></div>
          <div><label className="text-[10px] text-charcoal/50 uppercase font-bold">Question (मराठी)</label><input value={f.question_mr} onChange={e => set('question_mr', e.target.value)} className="w-full px-3 py-2 bg-white border border-charcoal/15 text-sm outline-none focus:border-heritage font-marathi" /></div>
          <div><label className="text-[10px] text-charcoal/50 uppercase font-bold">Answer (EN)</label><textarea rows={3} value={f.answer_en} onChange={e => set('answer_en', e.target.value)} className="w-full px-3 py-2 bg-white border border-charcoal/15 text-sm outline-none focus:border-heritage resize-none" /></div>
          <div><label className="text-[10px] text-charcoal/50 uppercase font-bold">Answer (मराठी)</label><textarea rows={3} value={f.answer_mr} onChange={e => set('answer_mr', e.target.value)} className="w-full px-3 py-2 bg-white border border-charcoal/15 text-sm outline-none focus:border-heritage resize-none font-marathi" /></div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 bg-cream-dark/60 border-t border-charcoal/10">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase text-charcoal/60 border border-charcoal/20">Cancel</button>
          <button onClick={save} disabled={busy} className="flex items-center gap-1.5 px-4 py-2 bg-heritage text-white text-xs font-bold uppercase disabled:opacity-50">{busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}Save</button>
        </div>
      </div>
    </div>
  );
}
