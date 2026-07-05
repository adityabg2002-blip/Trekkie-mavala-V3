import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { tr } from '../lib/i18n';

export default function BookingModal({ trek, isMr, onClose, onDone }) {
  const [name, setName] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const book = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setErr(isMr ? 'नाव आवश्यक आहे.' : 'Name is required.'); return; }
    setErr(''); setBusy(true);
    try {
      const res = await fetch('/api/data?resource=bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hiker_name: name, trek_name: isMr ? trek.name_mr : trek.name_en,
          date: trek.date || '2025-09-30', amount: trek.price, status: 'Confirmed',
        }),
      });
      if (res.ok) { setDone(true); onDone && onDone(); }
      else setErr('Booking failed.');
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-5 bg-charcoal/70 backdrop-blur-sm fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-cream border border-charcoal/10 p-7 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-charcoal/40 hover:text-heritage"><X className="w-5 h-5" /></button>
        {done ? (
          <div className="text-center py-8">
            <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
            <h3 className={`text-2xl text-charcoal mb-2 ${isMr ? 'font-marathi' : 'font-serif'}`}>{isMr ? 'बुकिंग निश्चित!' : 'Booking Confirmed!'}</h3>
            <p className={`text-charcoal/60 text-sm ${isMr ? 'font-marathi' : ''}`}>{isMr ? 'तुमची जागा राखीव. पोर्टलमध्ये तपशील पहा.' : 'Your seat is reserved. View details in the Hiker Portal.'}</p>
          </div>
        ) : (
          <>
            <div className="w-10 h-0.5 bg-heritage mb-4" />
            <h3 className={`text-2xl text-charcoal mb-1 ${isMr ? 'font-marathi' : 'font-serif'}`}>{isMr ? trek.name_mr : trek.name_en}</h3>
            <p className="text-charcoal/50 text-sm mb-5">₹{trek.price?.toLocaleString('en-IN')} {trek.date && `• ${trek.date}`}</p>
            {err && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 mb-4">{err}</div>}
            <form onSubmit={book} className="space-y-4">
              <input value={name} onChange={e => setName(e.target.value)} placeholder={tr('yourName', isMr)} className={`w-full px-4 py-3 bg-white border border-charcoal/15 focus:border-heritage outline-none text-charcoal ${isMr ? 'font-marathi' : ''}`} />
              <button disabled={busy} className={`w-full py-3.5 bg-heritage text-white font-bold uppercase tracking-wide hover:bg-heritage-dark transition-colors disabled:opacity-50 ${isMr ? 'font-marathi' : ''}`}>{tr('bookNow', isMr)}</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
