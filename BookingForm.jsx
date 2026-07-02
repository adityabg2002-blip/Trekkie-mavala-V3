import { useState } from 'react';
import { X, User, Phone, Calendar, MapPin, CheckCircle, Loader2, ShieldCheck, IndianRupee, Users, Mail, MessageCircle } from 'lucide-react';
import { loadRazorpay } from '../lib/razorpay';

// Beautiful booking form + Razorpay Standard Checkout + Supabase save.
// Props:
//   trek   -> { name_en, name_mr, price }  (the selected trek/tour)
//   isMr   -> language flag
//   onClose, onDone
export default function BookingForm({ trek, isMr, onClose, onDone }) {
  const trekName = (isMr ? trek?.name_mr : trek?.name_en) || trek?.name_en || 'Sahyadri Expedition';
  const amount = Number(trek?.price) || 0;

  const [f, setF] = useState({ full_name: '', mobile: '', email: '', age: '', gender: '', city: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // payment id on success
  const [notify, setNotify] = useState(null); // confirmation links

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const validate = () => {
    if (!f.full_name.trim()) return isMr ? 'पूर्ण नाव आवश्यक आहे.' : 'Full name is required.';
    if (!/^\d{10}$/.test(f.mobile.replace(/\D/g, ''))) return isMr ? 'वैध १०-अंकी मोबाईल नंबर टाका.' : 'Enter a valid 10-digit mobile number.';
    if (!f.age || Number(f.age) < 5 || Number(f.age) > 100) return isMr ? 'वैध वय टाका.' : 'Enter a valid age.';
    if (!f.gender) return isMr ? 'लिंग निवडा.' : 'Please select gender.';
    if (!f.city.trim()) return isMr ? 'शहर आवश्यक आहे.' : 'City is required.';
    return '';
  };

  const payAndBook = async () => {
    const v = validate();
    if (v) { setErr(v); return; }
    setErr(''); setBusy(true);

    try {
      // 1) Load Razorpay checkout script
      const ok = await loadRazorpay();
      if (!ok) throw new Error('Could not load Razorpay. Check your internet connection.');

      // 2) Ask our server to create an order (secret stays on server)
      const notes = {
        'Trek Name': trekName,
        'Full Name': f.full_name,
        'Mobile': f.mobile,
        'Email': f.email || '-',
        'Age': String(f.age),
        'Gender': f.gender,
        'City': f.city,
      };
      const orderRes = await fetch('/api/razorpay-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, notes }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || 'Could not start payment.');

      // 3) Open Razorpay Standard Checkout popup
      const rzp = new window.Razorpay({
        key: order.keyId, // Key ID only (public)
        amount: order.amount,
        currency: order.currency,
        name: 'TREKKIE \u092e\u093e\u0935\u0933\u093e',
        description: trekName,
        order_id: order.orderId,
        prefill: { name: f.full_name, contact: f.mobile, email: f.email || undefined },
        notes, // shows on your Razorpay dashboard
        theme: { color: '#d9531e' },
        handler: async (response) => {
          // 4) Payment succeeded -> verify signature + save to Supabase
          try {
            const verifyRes = await fetch('/api/razorpay-verify', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                booking: { ...f, age: f.age, amount, trek_name: trekName },
                lang: isMr ? 'mr' : 'en',
              }),
            });
            const vr = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(vr.error || 'Verification failed');
            setDone(response.razorpay_payment_id);
            setNotify(vr.notify || null);
            onDone && onDone();
          } catch (e) {
            setErr(e.message);
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => setBusy(false), // user closed popup
        },
      });
      rzp.on('payment.failed', (resp) => {
        setErr(resp.error?.description || 'Payment failed. Please try again.');
        setBusy(false);
      });
      rzp.open();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-start justify-center p-4 bg-charcoal/70 backdrop-blur-sm overflow-y-auto fade-in" onClick={onClose}>
      <div className="w-full max-w-md my-8 bg-cream border border-charcoal/10 relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 bg-charcoal text-cream">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-amber uppercase">{isMr ? 'मोहीम बुकिंग' : 'Expedition Booking'}</div>
            <h3 className={`text-lg mt-0.5 ${isMr ? 'font-marathi' : 'font-serif'}`}>{trekName}</h3>
          </div>
          <button onClick={onClose} className="text-cream/60 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="grid place-items-center w-16 h-16 mx-auto rounded-full bg-emerald-100 mb-4">
              <CheckCircle className="w-9 h-9 text-emerald-600" />
            </div>
            <h4 className={`text-2xl text-charcoal mb-2 ${isMr ? 'font-marathi' : 'font-serif'}`}>{isMr ? 'बुकिंग निश्चित!' : 'Booking Confirmed!'}</h4>
            <p className={`text-charcoal/60 text-sm mb-4 ${isMr ? 'font-marathi' : ''}`}>{isMr ? 'तुमचे पेमेंट यशस्वी झाले आणि तुमची जागा राखीव आहे.' : 'Your payment was successful and your seat is reserved.'}</p>
            <div className="bg-white border border-charcoal/10 px-4 py-3 text-xs text-charcoal/60">
              <div className="uppercase tracking-wide text-[10px] text-charcoal/40 mb-1">{isMr ? 'पेमेंट आयडी' : 'Payment ID'}</div>
              <div className="font-mono font-semibold text-charcoal break-all">{done}</div>
            </div>

            {/* Confirmation status + links */}
            <div className="mt-4 text-left bg-emerald-50 border border-emerald-200 px-4 py-3">
              <p className={`text-xs text-emerald-800 font-semibold mb-2 ${isMr ? 'font-marathi' : ''}`}>
                {(notify?.email?.sent || notify?.whatsapp?.sent)
                  ? (isMr ? 'पुष्टीकरण पाठवले ✓' : 'Confirmation sent ✓')
                  : (isMr ? 'पुष्टीकरण पाठवा:' : 'Send your confirmation:')}
              </p>
              <div className="flex flex-wrap gap-2">
                {notify?.whatsappLink && (
                  <a href={notify.whatsappLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white text-xs font-bold hover:opacity-90">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                )}
                {notify?.mailtoLink && (
                  <a href={notify.mailtoLink} className="flex items-center gap-1.5 px-3 py-1.5 bg-charcoal text-cream text-xs font-bold hover:bg-heritage">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </a>
                )}
              </div>
            </div>

            <button onClick={onClose} className="mt-5 w-full py-3 bg-heritage text-white font-bold uppercase tracking-wide hover:bg-heritage-dark transition-colors">{isMr ? 'बंद करा' : 'Done'}</button>
          </div>
        ) : (
          <div className="p-6">
            {/* price banner */}
            <div className="flex items-center justify-between bg-white border border-charcoal/10 px-4 py-3 mb-5">
              <span className={`text-sm font-semibold text-charcoal/70 ${isMr ? 'font-marathi' : ''}`}>{isMr ? 'प्रति व्यक्ती' : 'Amount per head'}</span>
              <span className="font-serif text-2xl font-bold text-charcoal flex items-center"><IndianRupee className="w-5 h-5" />{amount.toLocaleString('en-IN')}</span>
            </div>

            {err && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 mb-4 fade-in">{err}</div>}

            <div className="space-y-3">
              <Field icon={User} label={isMr ? 'पूर्ण नाव' : 'Full Name'}>
                <input value={f.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder={isMr ? 'तुमचे पूर्ण नाव' : 'Your full name'} className={inputCls} />
              </Field>
              <Field icon={Phone} label={isMr ? 'मोबाईल नंबर' : 'Mobile Number'}>
                <input value={f.mobile} onChange={(e) => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" inputMode="tel" className={inputCls} />
              </Field>
              <Field icon={Mail} label={isMr ? 'ईमेल (पुष्टीकरणासाठी)' : 'Email (for confirmation)'}>
                <input value={f.email} onChange={(e) => set('email', e.target.value)} type="email" placeholder={isMr ? 'you@example.com (पर्यायी)' : 'you@example.com (optional)'} className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field icon={Calendar} label={isMr ? 'वय' : 'Age'}>
                  <input value={f.age} onChange={(e) => set('age', e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="28" inputMode="numeric" className={inputCls} />
                </Field>
                <Field icon={Users} label={isMr ? 'लिंग' : 'Gender'}>
                  <select value={f.gender} onChange={(e) => set('gender', e.target.value)} className={inputCls}>
                    <option value="">{isMr ? 'निवडा' : 'Select'}</option>
                    <option value="Male">{isMr ? 'पुरुष' : 'Male'}</option>
                    <option value="Female">{isMr ? 'स्त्री' : 'Female'}</option>
                    <option value="Other">{isMr ? 'इतर' : 'Other'}</option>
                  </select>
                </Field>
              </div>
              <Field icon={MapPin} label={isMr ? 'शहर' : 'City'}>
                <input value={f.city} onChange={(e) => set('city', e.target.value)} placeholder={isMr ? 'तुमचे शहर' : 'Your city'} className={inputCls} />
              </Field>
            </div>

            <button onClick={payAndBook} disabled={busy}
              className={`btn-sheen w-full mt-6 py-3.5 bg-heritage text-white font-bold uppercase tracking-wide hover:bg-heritage-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${isMr ? 'font-marathi' : ''}`}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {busy ? (isMr ? 'प्रक्रिया सुरू आहे...' : 'Processing...') : (isMr ? `\u20b9${amount.toLocaleString('en-IN')} भरा व बुक करा` : `Pay \u20b9${amount.toLocaleString('en-IN')} & Book`)}
            </button>

            <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-charcoal/40">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              {isMr ? 'Razorpay द्वारे सुरक्षित पेमेंट (टेस्ट मोड)' : 'Secure payment via Razorpay (Test Mode)'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls = 'w-full pl-10 pr-3 py-2.5 bg-white border border-charcoal/15 focus:border-heritage outline-none text-charcoal text-sm transition-colors';

function Field({ icon: Icon, label, children }) {
  return (
    <div>
      <label className="text-[10px] text-charcoal/50 uppercase font-bold tracking-wide">{label}</label>
      <div className="relative mt-1">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/35 z-10" />
        {children}
      </div>
    </div>
  );
}
