import { useState } from 'react';
import { Mountain, Droplet, Phone, Award, Fingerprint, XCircle, LogOut, Star, Send, CheckCircle, Loader2, Mail, Smartphone } from 'lucide-react';
import { tr } from '../lib/i18n';
import supabase from '../lib/supabase';
import HikerAuth from '../components/HikerAuth';

export default function Portal({ isMr, user, hikers, bookings, treks, tours, refresh }) {
  if (!user) {
    return <HikerAuth isMr={isMr} onAfterAuth={refresh} />;
  }

  // Match the profile for this user: by auth email, then metadata mobile, then fallback
  const meta = user.user_metadata || {};
  const metaMobile = meta.mobile ? String(meta.mobile).replace(/\D/g, '') : null;
  const hiker = hikers.find((h) => h.auth_email && h.auth_email === user.email)
    || (metaMobile && hikers.find((h) => h.mobile === metaMobile))
    || hikers.find((h) => h.email && h.email === user.email)
    || {
      name: meta.name || user.email?.split('@')[0],
      mobile: metaMobile || '',
      email: meta.contact_email || (user.email?.includes('mavala-hiker') ? '' : user.email),
      passport_id: 'MVL-PENDING',
      blood_group: '—',
      emergency_contact: '—',
      treks_completed: 0,
      stamps: [],
    };
  const myBookings = bookings.filter(b => b.status !== 'Cancelled');

  const cancel = async (id) => {
    await fetch('/api/bookings', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id, status: 'Cancelled' }) });
    refresh();
  };

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-12">
      <div className="flex items-center justify-between mb-8">
        <div><div className="w-14 h-0.5 bg-heritage mb-3" /><h1 className={`text-charcoal ${isMr ? 'font-marathi text-3xl' : 'font-serif text-4xl'}`}>{tr('portalTitle', isMr)}</h1></div>
        <button onClick={() => supabase.auth.signOut()} className={`flex items-center gap-2 px-4 py-2 border border-charcoal/20 text-charcoal/70 text-sm font-semibold hover:border-heritage hover:text-heritage ${isMr ? 'font-marathi' : ''}`}><LogOut className="w-4 h-4" />{tr('logout', isMr)}</button>
      </div>

      {/* Passport card */}
      <div className="bg-gradient-to-br from-charcoal to-forest text-cream p-7 mb-8 relative overflow-hidden max-w-2xl">
        <div className="absolute -right-10 -bottom-10 opacity-10"><Mountain className="w-56 h-56" /></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2"><div className="grid place-items-center w-9 h-9 border-2 border-amber rotate-45"><Mountain className="w-4 h-4 text-amber -rotate-45" /></div><span className="font-serif font-bold">MAVALA PASSPORT</span></div>
            <span className="text-[10px] tracking-[0.3em] text-amber uppercase">Sahyadri</span>
          </div>
          <div className={`font-serif text-2xl font-bold mb-4 ${isMr ? 'font-marathi' : ''}`}>{hiker.name}</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><div className={`text-cream/40 text-[10px] uppercase tracking-wide flex items-center gap-1 ${isMr ? 'font-marathi' : ''}`}><Fingerprint className="w-3 h-3" />{tr('passportId', isMr)}</div><div className="font-mono font-semibold mt-0.5">{hiker.passport_id}</div></div>
            <div><div className={`text-cream/40 text-[10px] uppercase tracking-wide flex items-center gap-1 ${isMr ? 'font-marathi' : ''}`}><Droplet className="w-3 h-3" />{tr('bloodGroup', isMr)}</div><div className="font-semibold mt-0.5">{hiker.blood_group}</div></div>
            {hiker.mobile && <div><div className={`text-cream/40 text-[10px] uppercase tracking-wide flex items-center gap-1 ${isMr ? 'font-marathi' : ''}`}><Smartphone className="w-3 h-3" />{tr('mobileNumber', isMr)}</div><div className="font-semibold mt-0.5">+91 {hiker.mobile}</div></div>}
            {hiker.email && <div><div className={`text-cream/40 text-[10px] uppercase tracking-wide flex items-center gap-1 ${isMr ? 'font-marathi' : ''}`}><Mail className="w-3 h-3" />{tr('withEmail', isMr)}</div><div className="font-semibold mt-0.5 truncate">{hiker.email}</div></div>}
            <div className="col-span-2"><div className={`text-cream/40 text-[10px] uppercase tracking-wide flex items-center gap-1 ${isMr ? 'font-marathi' : ''}`}><Phone className="w-3 h-3" />{tr('emergencyContact', isMr)}</div><div className="font-semibold mt-0.5">{hiker.emergency_contact}</div></div>
            <div><div className={`text-cream/40 text-[10px] uppercase tracking-wide flex items-center gap-1 ${isMr ? 'font-marathi' : ''}`}><Award className="w-3 h-3" />{tr('treksCompleted', isMr)}</div><div className="font-serif text-xl font-bold mt-0.5">{hiker.treks_completed}</div></div>
          </div>
        </div>
      </div>

      {/* Stamps */}
      <h2 className={`text-xl font-bold text-charcoal mb-4 flex items-center gap-2 ${isMr ? 'font-marathi' : ''}`}><Award className="w-5 h-5 text-heritage" />{tr('passportStamps', isMr)}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {(hiker.stamps || []).map((s, i) => (
          <div key={i} className="border-2 border-dashed border-heritage/40 bg-cream-dark/40 p-4 text-center relative rotate-[-1deg] hover:rotate-0 transition-transform">
            <div className="grid place-items-center w-12 h-12 mx-auto rounded-full border-2 border-heritage/60 mb-2"><Mountain className="w-6 h-6 text-heritage/70" /></div>
            <div className={`font-bold text-charcoal text-sm ${isMr ? 'font-marathi' : 'font-serif'}`}>{s.fort}</div>
            <div className="text-[10px] text-charcoal/40 mt-0.5">{s.date}</div>
            <div className="text-[9px] text-heritage font-bold uppercase tracking-wider mt-1">{s.grade}</div>
          </div>
        ))}
        {(!hiker.stamps || !hiker.stamps.length) && <p className="text-charcoal/40 text-sm col-span-full">{isMr ? 'अजून शिक्के नाहीत.' : 'No stamps yet. Complete a trek to earn one!'}</p>}
      </div>

      {/* Bookings */}
      <h2 className={`text-xl font-bold text-charcoal mb-4 ${isMr ? 'font-marathi' : ''}`}>{tr('myBookings', isMr)}</h2>
      <div className="space-y-3">
        {myBookings.map(b => (
          <div key={b.id} className="bg-white border border-charcoal/10 p-4 flex items-center justify-between gap-3">
            <div>
              <div className={`font-semibold text-charcoal ${isMr ? 'font-marathi' : ''}`}>{b.trek_name}</div>
              <div className="text-xs text-charcoal/50 mt-0.5">{b.date} • ₹{b.amount?.toLocaleString('en-IN')} • <span className="text-heritage font-semibold">{b.status}</span></div>
            </div>
            <button onClick={() => cancel(b.id)} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-colors ${isMr ? 'font-marathi' : ''}`}><XCircle className="w-4 h-4" />{tr('cancelBooking', isMr)}</button>
          </div>
        ))}
        {!myBookings.length && <p className="text-charcoal/40 text-sm">{isMr ? 'सक्रिय बुकिंग नाहीत.' : 'No active bookings.'}</p>}
      </div>

      {/* Leave a review */}
      <div className="mt-10">
        <ReviewForm isMr={isMr} hiker={hiker} treks={treks} tours={tours} refresh={refresh} />
      </div>
    </div>
  );
}

function ReviewForm({ isMr, hiker, treks = [], tours = [], refresh }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [trek, setTrek] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const options = [
    ...treks.map(t => (isMr ? t.name_mr : t.name_en)),
    ...tours.map(t => (isMr ? t.title_mr : t.title_en)),
  ].filter(Boolean);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) { setErr(isMr ? 'कृपया तुमचा अभिप्राय लिहा.' : 'Please write your review.'); return; }
    setErr(''); setBusy(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: hiker.name, hiker_email: hiker.emergency_contact ? undefined : undefined, rating, text_en: text, text_mr: text, trek: trek || options[0] || 'Sahyadri' }),
      });
      if (res.ok) { setDone(true); setText(''); refresh && refresh(); }
      else setErr('Failed to submit.');
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  };

  return (
    <div className="bg-white border border-charcoal/10 p-6">
      <h2 className={`text-xl font-bold text-charcoal mb-1 flex items-center gap-2 ${isMr ? 'font-marathi' : ''}`}><Star className="w-5 h-5 text-heritage" />{isMr ? 'तुमचा अभिप्राय द्या' : 'Leave a Review'}</h2>
      <p className="text-xs text-charcoal/50 mb-4">{isMr ? 'तुमचा अभिप्राय आमच्या मुख्यपृष्ठावर दर्शविला जाईल.' : 'Your review will be showcased on our homepage.'}</p>
      {done ? (
        <div className="flex items-center gap-3 py-6 text-emerald-600"><CheckCircle className="w-8 h-8" /><p className={`${isMr ? 'font-marathi' : ''}`}>{isMr ? 'धन्यवाद! तुमचा अभिप्राय प्रकाशित झाला.' : 'Thank you! Your review is now live on the site.'}</p></div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {err && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2">{err}</div>}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button key={i} type="button" onClick={() => setRating(i + 1)}><Star className={`w-7 h-7 transition-colors ${i < rating ? 'fill-amber text-amber' : 'text-charcoal/20'}`} /></button>
            ))}
          </div>
          {options.length > 0 && (
            <select value={trek} onChange={e => setTrek(e.target.value)} className="w-full px-3 py-2.5 bg-cream border border-charcoal/15 focus:border-heritage outline-none text-charcoal text-sm">
              <option value="">{isMr ? 'ट्रेक / दौरा निवडा' : 'Select trek / tour'}</option>
              {options.map((o, i) => <option key={i} value={o}>{o}</option>)}
            </select>
          )}
          <textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder={isMr ? 'तुमचा अनुभव सांगा...' : 'Share your experience...'} className={`w-full px-4 py-3 bg-cream border border-charcoal/15 focus:border-heritage outline-none text-charcoal resize-none ${isMr ? 'font-marathi' : ''}`} />
          <button disabled={busy} className={`flex items-center gap-2 px-5 py-2.5 bg-heritage text-white text-sm font-bold uppercase tracking-wide hover:bg-heritage-dark disabled:opacity-50 transition-colors ${isMr ? 'font-marathi' : ''}`}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}{isMr ? 'अभिप्राय पाठवा' : 'Submit Review'}</button>
        </form>
      )}
    </div>
  );
}
