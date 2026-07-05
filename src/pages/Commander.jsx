import { useState, useEffect } from 'react';
import { Shield, Lock, User, Smartphone, TrendingUp, Users, Mountain, ClipboardList, Trash2, Plus, LogOut, Image, Settings, MapPinned, Star, Pin, PinOff, KeyRound, Loader2, Pencil, MessageSquare, CreditCard, Download, IndianRupee, RotateCcw, Eye } from 'lucide-react';
import { tr } from '../lib/i18n';
import SiteCustomizer from '../components/SiteCustomizer';
import VisibilityManager from '../components/VisibilityManager';
import BookingLogs from '../components/BookingLogs';
import { useAdmin } from '../contexts/AdminContext';
import supabase from '../lib/supabase';

export default function Commander({ isMr, treks, tours, bookings, gallery, hikers, reviews, content, settings, refresh, onEditEntity }) {
  const { isAdmin, logout } = useAdmin();
  const [payStats, setPayStats] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;
    fetch('/api/data?resource=trek-bookings').then((r) => r.json()).then((d) => setPayStats(d.stats || null)).catch(() => {});
  }, [isAdmin]);
  const [id, setId] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [section, setSection] = useState('payments');

  // Admin login via Supabase Auth. Account must carry app_metadata.role="admin"
  // (set from the Supabase Dashboard). The backend re-verifies this JWT on
  // every write, so a forged client flag is worthless.
  const login = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: id.trim(), password: pass });
      if (error) { setErr(error.message || tr('invalidCreds', isMr)); return; }
      const role = data.user?.app_metadata?.role || data.user?.user_metadata?.role;
      const allow = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
      const admin = role === 'admin' || data.user?.app_metadata?.roles?.includes?.('admin') || (data.user?.email && allow.includes(data.user.email.toLowerCase()));
      if (!admin) {
        await supabase.auth.signOut();
        setErr(isMr ? 'हे खाते प्रशासक नाही.' : 'This account is not an administrator.');
        return;
      }
      setErr(''); // AdminContext promotes the session automatically.
    } catch { setErr('Login failed. Try again.'); } finally { setBusy(false); }
  };

  // Real revenue = confirmed Razorpay payments + existing manual bookings
  const paidRevenue = payStats?.revenue || 0;
  const legacyRevenue = bookings.filter(b => b.status !== 'Cancelled').reduce((s, b) => s + (b.amount || 0), 0);
  const revenue = paidRevenue + legacyRevenue;
  const paidCount = payStats?.paid || 0;

  const delTrek = async (id) => { if (!confirm('Delete this trek?')) return; await fetch('/api/data?resource=treks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); refresh(); };
  const delTour = async (id) => { if (!confirm('Delete this tour?')) return; await fetch('/api/data?resource=tours', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); refresh(); };
  const delGallery = async (id) => { await fetch('/api/data?resource=gallery', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); refresh(); };
  const pinReview = async (r) => { await fetch('/api/data?resource=reviews', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, pinned: !r.pinned }) }); refresh(); };
  const delReview = async (id) => { if (!confirm('Delete this review?')) return; await fetch('/api/data?resource=reviews', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); refresh(); };

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-md bg-charcoal text-cream p-8 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 opacity-5"><Shield className="w-48 h-48" /></div>
          <div className="relative">
            <div className="grid place-items-center w-14 h-14 border-2 border-heritage rotate-45 mb-5"><Shield className="w-6 h-6 text-heritage -rotate-45" /></div>
            <h1 className={`text-3xl mb-1 ${isMr ? 'font-marathi' : 'font-serif'}`}>{tr('cmdTitle', isMr)}</h1>
            <p className={`text-cream/50 text-sm mb-6 ${isMr ? 'font-marathi' : ''}`}>{tr('cmdSub', isMr)}</p>
            {err && <div className="bg-red-500/20 border border-red-500/40 text-red-200 text-sm px-3 py-2 mb-4">{err}</div>}
            <form onSubmit={login} className="space-y-4">
              <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/40" /><input value={id} onChange={e => setId(e.target.value)} type="email" autoComplete="username" placeholder={isMr ? 'प्रशासक ईमेल' : 'Admin email'} className={`w-full pl-10 pr-4 py-3 bg-white/5 border border-white/15 focus:border-heritage outline-none text-cream placeholder:text-cream/40 ${isMr ? 'font-marathi' : ''}`} /></div>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/40" /><input value={pass} onChange={e => setPass(e.target.value)} type="password" autoComplete="current-password" placeholder={tr('passcode', isMr)} className={`w-full pl-10 pr-4 py-3 bg-white/5 border border-white/15 focus:border-heritage outline-none text-cream placeholder:text-cream/40 ${isMr ? 'font-marathi' : ''}`} /></div>
              <button disabled={busy} className={`w-full py-3.5 bg-heritage text-white font-bold uppercase tracking-wide hover:bg-heritage-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${isMr ? 'font-marathi' : ''}`}>{busy && <Loader2 className="w-4 h-4 animate-spin" />}{tr('authenticate', isMr)}</button>
            </form>
            <p className={`mt-4 text-[11px] text-cream/40 ${isMr ? 'font-marathi' : ''}`}>{isMr ? 'प्रशासक खाते Supabase Dashboard मध्ये role: "admin" सह तयार करा.' : 'Admin accounts are created in Supabase and tagged app_metadata role: "admin".'}</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { icon: TrendingUp, label: 'totalRevenue', value: '₹' + revenue.toLocaleString('en-IN') },
    { icon: CreditCard, label: 'totalBookings', value: paidCount, custom: isMr ? 'भरलेले पेमेंट' : 'Paid Payments' },
    { icon: Users, label: 'activeHikers', value: hikers.length },
    { icon: Mountain, label: 'liveExpeditions', value: treks.length },
  ];
  const sections = [
    { key: 'payments', label: 'bookingLogs', icon: CreditCard, custom: isMr ? 'बुकिंग नोंदी' : 'Booking Logs' },
    { key: 'treks', label: 'manageTreks', icon: Mountain },
    { key: 'tours', label: 'manageTours', icon: MapPinned },
    { key: 'reviews', label: 'reviews', icon: MessageSquare, custom: isMr ? 'अभिप्राय' : 'Reviews' },
    { key: 'bookings', label: 'bookingLogs', icon: ClipboardList, custom: isMr ? 'जुन्या बुकिंग' : 'Manual Logs' },
    { key: 'gallery', label: 'galleryManager', icon: Image },
    { key: 'visibility', label: 'visibility', icon: Eye, custom: isMr ? 'दाखवा / लपवा' : 'Show / Hide' },
    { key: 'security', label: 'security', icon: Shield },
    { key: 'customizer', label: 'siteCustomizer', icon: Settings },
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-12">
      <div className="flex items-center justify-between mb-8">
        <div><div className="w-14 h-0.5 bg-heritage mb-3" /><h1 className={`text-charcoal ${isMr ? 'font-marathi text-3xl' : 'font-serif text-4xl'}`}>{tr('adminTitle', isMr)}</h1></div>
        <button onClick={() => logout()} className={`flex items-center gap-2 px-4 py-2 border border-charcoal/20 text-charcoal/70 text-sm font-semibold hover:border-heritage hover:text-heritage transition-colors ${isMr ? 'font-marathi' : ''}`}><LogOut className="w-4 h-4" /> {tr('logout', isMr)}</button>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 mb-6 flex items-center gap-2">
        <Pencil className="w-4 h-4" /> {isMr ? 'तुम्ही आता संपादन मोडमध्ये आहात — साइटवरील कोणत्याही विभागात पेन्सिल चिन्हावर क्लिक करून थेट संपादन करा.' : 'You are in edit mode — pencil/edit icons now appear across the whole site. Click any to edit content live.'}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="bg-white border border-charcoal/10 p-5">
            <s.icon className="w-6 h-6 text-heritage mb-3" />
            <div className="font-serif text-2xl md:text-3xl font-bold text-charcoal">{s.value}</div>
            <div className={`text-xs text-charcoal/50 uppercase tracking-wide mt-1 ${isMr ? 'font-marathi' : ''}`}>{s.custom || tr(s.label, isMr)}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {sections.map(s => (
          <button key={s.key} onClick={() => setSection(s.key)} className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide border-2 transition-all ${isMr ? 'font-marathi' : ''} ${section === s.key ? 'bg-heritage border-heritage text-white' : 'border-charcoal/15 text-charcoal/60 hover:border-heritage'}`}>
            <s.icon className="w-4 h-4" /> {s.custom || tr(s.label, isMr)}
          </button>
        ))}
      </div>

      <div className="bg-white border border-charcoal/10 p-5">
        {section === 'treks' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`font-bold text-charcoal ${isMr ? 'font-marathi' : ''}`}>{tr('manageTreks', isMr)}</h3>
              <button onClick={() => onEditEntity('trek', null)} className={`flex items-center gap-1.5 px-3 py-1.5 bg-charcoal text-cream text-xs font-bold uppercase hover:bg-heritage transition-colors ${isMr ? 'font-marathi' : ''}`}><Plus className="w-3.5 h-3.5" />{tr('addTrek', isMr)}</button>
            </div>
            <div className="space-y-2">
              {treks.map(t => (
                <div key={t.id} className="flex items-center justify-between gap-3 border border-charcoal/10 p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={t.image} className="w-10 h-10 object-cover shrink-0" />
                    <div className="min-w-0">
                      <div className={`font-semibold text-charcoal text-sm truncate ${isMr ? 'font-marathi' : ''}`}>{isMr ? t.name_mr : t.name_en}</div>
                      <div className="text-xs text-charcoal/40">{t.fort} • ₹{t.price?.toLocaleString('en-IN')} • {t.seats} seats{t.date ? ` • ${t.date}` : ''}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => onEditEntity('trek', t)} className="p-2 text-charcoal/60 hover:text-heritage"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => delTrek(t.id)} className="p-2 text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'tours' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`font-bold text-charcoal ${isMr ? 'font-marathi' : ''}`}>{tr('manageTours', isMr)}</h3>
              <button onClick={() => onEditEntity('tour', null)} className={`flex items-center gap-1.5 px-3 py-1.5 bg-charcoal text-cream text-xs font-bold uppercase hover:bg-heritage transition-colors ${isMr ? 'font-marathi' : ''}`}><Plus className="w-3.5 h-3.5" />{isMr ? 'दौरा जोडा' : 'Add Tour'}</button>
            </div>
            <div className="space-y-2">
              {tours.map(t => (
                <div key={t.id} className="flex items-center justify-between gap-3 border border-charcoal/10 p-3">
                  <div className="flex items-center gap-3 min-w-0"><img src={t.image} className="w-10 h-10 object-cover shrink-0" /><div className="min-w-0"><div className={`font-semibold text-charcoal text-sm truncate ${isMr ? 'font-marathi' : ''}`}>{isMr ? t.title_mr : t.title_en}</div><div className="text-xs text-charcoal/40">{t.region} • {t.days}d • ₹{t.price?.toLocaleString('en-IN')}</div></div></div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => onEditEntity('tour', t)} className="p-2 text-charcoal/60 hover:text-heritage"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => delTour(t.id)} className="p-2 text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'reviews' && (
          <div>
            <h3 className={`font-bold text-charcoal mb-1 ${isMr ? 'font-marathi' : ''}`}>{isMr ? 'ग्राहक अभिप्राय' : 'Customer Reviews'}</h3>
            <p className="text-xs text-charcoal/50 mb-4">{isMr ? 'पिन करा किंवा हटवा. गिर्यारोहक त्यांच्या पोर्टलमधून अभिप्राय जोडतात.' : 'Pin important reviews or delete unwanted ones. Hikers submit reviews from their portal.'}</p>
            <div className="space-y-2">
              {reviews.map(r => (
                <div key={r.id} className={`border p-3 ${r.pinned ? 'border-amber bg-amber/5' : 'border-charcoal/10'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-charcoal text-sm">{r.name}</span>
                        <span className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-amber text-amber' : 'text-charcoal/15'}`} />)}</span>
                        {r.trek && <span className="text-[10px] text-heritage font-semibold">{r.trek}</span>}
                      </div>
                      <p className="text-sm text-charcoal/60 line-clamp-2">{r.text_en}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => pinReview(r)} title={r.pinned ? 'Unpin' : 'Pin'} className={`p-2 ${r.pinned ? 'text-amber' : 'text-charcoal/50 hover:text-amber'}`}>{r.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}</button>
                      <button onClick={() => delReview(r.id)} className="p-2 text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
              {!reviews.length && <p className="text-charcoal/40 text-sm">No reviews yet.</p>}
            </div>
          </div>
        )}

        {section === 'payments' && (
          <BookingLogs isMr={isMr} />
        )}

        {section === 'bookings' && (
          <div>
            <h3 className={`font-bold text-charcoal mb-1 ${isMr ? 'font-marathi' : ''}`}>{isMr ? 'जुन्या / मॅन्युअल बुकिंग' : 'Manual / Legacy Bookings'}</h3>
            <p className="text-xs text-charcoal/50 mb-3">{isMr ? 'पेमेंटशिवाय जोडलेल्या जुन्या बुकिंग.' : 'Older bookings added without online payment. For paid Razorpay bookings, see the Payments tab.'}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-charcoal/40 text-xs uppercase tracking-wide border-b border-charcoal/10"><th className="py-2">Hiker</th><th>Trek</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} className="border-b border-charcoal/5">
                      <td className="py-2.5 font-semibold text-charcoal">{b.hiker_name}</td>
                      <td className="text-charcoal/60">{b.trek_name}</td>
                      <td className="text-charcoal/60">{b.date}</td>
                      <td className="text-charcoal/80 font-semibold">₹{b.amount?.toLocaleString('en-IN')}</td>
                      <td><span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${b.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : b.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {section === 'gallery' && (
          <div>
            <h3 className={`font-bold text-charcoal mb-1 ${isMr ? 'font-marathi' : ''}`}>{tr('galleryManager', isMr)}</h3>
            <p className="text-xs text-charcoal/50 mb-3">{isMr ? 'अमर्यादित फोटो व व्हिडिओ जोडण्यासाठी आणि हटवण्यासाठी गॅलरी टॅबवर जा.' : 'Go to the Gallery tab to add unlimited photos & videos and delete them.'} <span className="text-heritage font-semibold">{gallery.length} {isMr ? 'आयटम' : 'items'}</span></p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {gallery.map(g => (
                <div key={g.id} className="relative group aspect-square bg-charcoal/5">
                  {g.media_type === 'video'
                    ? <video src={g.url} muted className="w-full h-full object-cover" preload="metadata" />
                    : <img src={g.url} className="w-full h-full object-cover" />}
                  {g.media_type === 'video' && <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-charcoal/80 text-cream text-[8px] font-bold uppercase">Video</div>}
                  <button onClick={() => delGallery(g.id)} className="absolute inset-0 bg-red-600/70 opacity-0 group-hover:opacity-100 grid place-items-center transition-opacity"><Trash2 className="w-5 h-5 text-white" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'visibility' && <VisibilityManager content={content} refresh={refresh} />}

        {section === 'security' && <SecurityPanel isMr={isMr} />}

        {section === 'customizer' && <SiteCustomizer content={content} settings={settings} refresh={refresh} />}
      </div>
    </div>
  );
}

function SecurityPanel({ isMr }) {
  const { user } = useAdmin();
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // Password changes now go directly through Supabase Auth (updateUser), which
  // re-checks the active session server-side. No plain-text passcodes anywhere.
  const change = async (e) => {
    e.preventDefault();
    setMsg('');
    if (newPass.length < 8) { setMsg(isMr ? 'पासवर्ड किमान ८ अक्षरे हवा.' : 'Password must be at least 8 characters.'); return; }
    if (newPass !== confirmPass) { setMsg(isMr ? 'पासवर्ड जुळत नाहीत.' : 'Passwords do not match.'); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) { setMsg(error.message); return; }
      setMsg(isMr ? '✓ पासवर्ड अद्ययावत केला.' : '✓ Password updated successfully.');
      setNewPass(''); setConfirmPass('');
    } catch { setMsg('Network error'); } finally { setBusy(false); }
  };

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-2 mb-1"><KeyRound className="w-5 h-5 text-heritage" /><h3 className={`font-bold text-charcoal ${isMr ? 'font-marathi' : ''}`}>{isMr ? 'प्रशासक पासवर्ड बदला' : 'Change Admin Password'}</h3></div>
      <p className="text-xs text-charcoal/50 mb-1">{isMr ? 'हे Supabase Auth द्वारे सुरक्षितपणे व्यवस्थापित केले जाते.' : 'Managed securely via Supabase Auth. No passwords are stored in app tables.'}</p>
      {user?.email && <p className="text-xs text-charcoal/40 mb-4">{isMr ? 'खाते' : 'Account'}: <span className="font-semibold text-charcoal/70">{user.email}</span></p>}
      {msg && <div className={`text-sm px-3 py-2 mb-4 ${msg.startsWith('✓') ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>{msg}</div>}
      <form onSubmit={change} className="space-y-3">
        <div><label className="text-[10px] text-charcoal/50 uppercase font-bold">{isMr ? 'नवीन पासवर्ड' : 'New Password'} *</label><input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required autoComplete="new-password" className="w-full px-3 py-2 bg-cream border border-charcoal/15 focus:border-heritage outline-none text-charcoal text-sm" /></div>
        <div><label className="text-[10px] text-charcoal/50 uppercase font-bold">{isMr ? 'पासवर्डची पुष्टी करा' : 'Confirm Password'} *</label><input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required autoComplete="new-password" className="w-full px-3 py-2 bg-cream border border-charcoal/15 focus:border-heritage outline-none text-charcoal text-sm" /></div>
        <button disabled={busy} className="flex items-center gap-2 px-5 py-2.5 bg-charcoal text-cream text-sm font-bold uppercase tracking-wide hover:bg-heritage disabled:opacity-50 transition-colors">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}{isMr ? 'पासवर्ड अद्ययावत करा' : 'Update Password'}</button>
      </form>
      <div className="mt-6 pt-4 border-t border-charcoal/10 text-xs text-charcoal/40">
        <p>{isMr ? 'ओळख: Supabase JWT (role: admin) • शेवटचे लॉगिन' : 'Identity: Supabase JWT (role: admin) • Last login'}: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}
