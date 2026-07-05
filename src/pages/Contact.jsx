import { useState } from 'react';
import { Radio, MapPin, Mail, Phone, Send, CheckCircle } from 'lucide-react';
import { tr } from '../lib/i18n';
import { InlineEdit } from '../components/EditButton';
import { useAdmin } from '../contexts/AdminContext';
import HideWrap from '../components/HideWrap';

export default function Contact({ isMr, settings, content, onEditText }) {
  const { isAdmin } = useAdmin();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { setErr(isMr ? 'सर्व आवश्यक रकाने भरा.' : 'Please fill all required fields.'); return; }
    setErr(''); setBusy(true);
    try {
      const res = await fetch('/api/data?resource=contact-messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { setSent(true); setForm({ name: '', email: '', phone: '', message: '' }); } else setErr('Failed to send. Try again.');
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  };

  const AdminNote = () => isAdmin ? <span className="block text-[10px] text-heritage/70 mt-1">↑ Edit phone/email/address in Command → Site Customizer → Contact & Brand</span> : null;

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-16">
      <div className="text-center mb-10">
        <div className="w-14 h-0.5 bg-heritage mx-auto mb-4" />
        <h1 className={`text-charcoal ${isMr ? 'font-marathi text-3xl' : 'font-serif text-4xl md:text-6xl'}`}>{tr('contactTitle', isMr)}<InlineEdit contentKey="contactTitle" onEdit={onEditText} /></h1>
      </div>

      <HideWrap visKey="vis_emergency_panel">
      <div className="bg-heritage text-white p-6 md:p-8 mb-10 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 opacity-10"><Radio className="w-40 h-40" /></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              <span className={`text-xs font-bold tracking-[0.3em] uppercase ${isMr ? 'font-marathi' : ''}`}>{tr('emergencyPanel', isMr)}<InlineEdit contentKey="emergencyPanel" onEdit={onEditText} /></span>
            </div>
            <p className={`text-white/80 text-sm ${isMr ? 'font-marathi' : ''}`}>{tr('emergencyDesc', isMr)}<InlineEdit contentKey="emergencyDesc" onEdit={onEditText} /></p>
          </div>
          <a href={`tel:${settings?.emergency_phone?.replace(/\s/g, '')}`} className="font-serif text-2xl md:text-3xl font-bold tracking-wide hover:underline whitespace-nowrap">{settings?.emergency_phone}</a>
        </div>
      </div>
      </HideWrap>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="bg-white border border-charcoal/10 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-heritage shrink-0 mt-0.5" />
              <div>
                <div className={`font-bold text-charcoal text-sm uppercase tracking-wide mb-1 ${isMr ? 'font-marathi' : ''}`}>{tr('hqAddress', isMr)}<InlineEdit contentKey="hqAddress" onEdit={onEditText} /></div>
                <div className={`text-charcoal/60 text-sm ${isMr ? 'font-marathi' : ''}`}>{isMr ? settings?.address_mr : settings?.address_en}</div>
              </div>
            </div>
            <a href={`tel:${settings?.phone?.replace(/\s/g, '')}`} className="flex items-center gap-3 hover:text-heritage transition-colors"><Phone className="w-5 h-5 text-heritage" /><span className="text-charcoal/80 font-semibold">{settings?.phone}</span></a>
            <a href={`mailto:${settings?.email}`} className="flex items-center gap-3 hover:text-heritage transition-colors"><Mail className="w-5 h-5 text-heritage" /><span className="text-charcoal/80 font-semibold">{settings?.email}</span></a>
            <AdminNote />
          </div>
          <HideWrap visKey="vis_hq_map">
            <div className="border border-charcoal/10 overflow-hidden h-64">
              {settings?.map_embed && <iframe title="HQ Map" src={settings.map_embed} className="w-full h-full grayscale hover:grayscale-0 transition-all" loading="lazy" />}
            </div>
          </HideWrap>
        </div>

        <div className="bg-charcoal text-cream p-7">
          <h2 className={`text-2xl mb-1 ${isMr ? 'font-marathi' : 'font-serif'}`}>{tr('leaveCourier', isMr)}<InlineEdit contentKey="leaveCourier" onEdit={onEditText} /></h2>
          <div className="w-10 h-0.5 bg-heritage mb-6" />
          {sent ? (
            <div className="flex flex-col items-center justify-center py-12 text-center fade-in">
              <CheckCircle className="w-14 h-14 text-emerald-400 mb-4" />
              <p className={`text-cream/80 ${isMr ? 'font-marathi' : ''}`}>{tr('courierSent', isMr)}</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {err && <div className="bg-red-500/20 border border-red-500/40 text-red-200 text-sm px-3 py-2">{err}</div>}
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={tr('yourName', isMr)} className={`w-full px-4 py-3 bg-white/5 border border-white/15 focus:border-heritage outline-none text-cream placeholder:text-cream/40 ${isMr ? 'font-marathi' : ''}`} />
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" placeholder={tr('yourEmail', isMr)} className={`w-full px-4 py-3 bg-white/5 border border-white/15 focus:border-heritage outline-none text-cream placeholder:text-cream/40 ${isMr ? 'font-marathi' : ''}`} />
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder={tr('yourPhone', isMr)} className={`w-full px-4 py-3 bg-white/5 border border-white/15 focus:border-heritage outline-none text-cream placeholder:text-cream/40 ${isMr ? 'font-marathi' : ''}`} />
              <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4} placeholder={tr('yourMessage', isMr)} className={`w-full px-4 py-3 bg-white/5 border border-white/15 focus:border-heritage outline-none text-cream placeholder:text-cream/40 resize-none ${isMr ? 'font-marathi' : ''}`} />
              <button disabled={busy} className={`w-full flex items-center justify-center gap-2 py-3.5 bg-heritage text-white font-bold uppercase tracking-wide hover:bg-heritage-dark transition-colors disabled:opacity-50 ${isMr ? 'font-marathi' : ''}`}><Send className="w-4 h-4" /> {tr('sendCourier', isMr)}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
