import { useState } from 'react';
import { Fingerprint, Mail, Smartphone, KeyRound, User, Phone, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { tr } from '../lib/i18n';
import supabase from '../lib/supabase';
import { signInWithGoogle } from '../lib/googleAuth';

const METHODS = [
  { key: 'email', label: 'withEmail', icon: Mail },
  { key: 'mobilePass', label: 'withMobilePass', icon: KeyRound },
  { key: 'otp', label: 'withOtp', icon: Smartphone },
];

export default function HikerAuth({ isMr, onAfterAuth }) {
  const [mode, setMode] = useState('signin'); // signin | signup
  const [method, setMethod] = useState('email');
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  // shared fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  // otp state
  const [otpStage, setOtpStage] = useState('enter'); // enter | verify
  const [otp, setOtp] = useState('');
  const [demoCode, setDemoCode] = useState('');

  const reset = () => { setErr(''); setNote(''); };

  const finish = async () => {
    // ensure profile syncs then let parent refresh
    onAfterAuth && (await onAfterAuth());
  };

  // ---- EMAIL ----
  const emailSubmit = async (e) => {
    e.preventDefault(); reset(); setBusy(true);
    try {
      if (mode === 'signup') {
        if (!name.trim()) throw new Error(isMr ? 'नाव आवश्यक आहे.' : 'Name is required.');
        if (!mobile.trim() || mobile.replace(/\D/g, '').length < 10) throw new Error(isMr ? 'वैध मोबाईल नंबर टाका.' : 'Enter a valid mobile number.');
        const { data, error } = await supabase.auth.signUp({
          email, password: pass,
          options: { data: { name, mobile: mobile.replace(/\D/g, ''), contact_email: email } },
        });
        if (error) throw error;
        // create hiker profile linked to this email
        await fetch('/api/data?resource=hikers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, mobile, email, auth_email: email }) });
        if (!data.session) { setNote(isMr ? 'खाते तयार झाले! कृपया साइन इन करा.' : 'Account created! You can now sign in.'); setMode('signin'); }
        else await finish();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        await finish();
      }
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  // ---- MOBILE + PASSWORD ----
  const mobilePassSubmit = async (e) => {
    e.preventDefault(); reset(); setBusy(true);
    try {
      const digits = mobile.replace(/\D/g, '');
      if (mode === 'signup') {
        if (!name.trim()) throw new Error(isMr ? 'नाव आवश्यक आहे.' : 'Name is required.');
        if (digits.length < 10) throw new Error(isMr ? 'वैध मोबाईल नंबर टाका.' : 'Enter a valid mobile number.');
        if (pass.length < 6) throw new Error(isMr ? 'पासवर्ड किमान ६ अक्षरे.' : 'Password must be at least 6 characters.');
        const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'register', mobile: digits, password: pass, name, email: email || null }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Signup failed');
        const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: pass });
        if (error) throw error;
        await finish();
      } else {
        const r = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resolve', mobile: digits }) });
        const { email: internalEmail } = await r.json();
        const { error } = await supabase.auth.signInWithPassword({ email: internalEmail, password: pass });
        if (error) throw new Error(isMr ? 'चुकीचा मोबाईल किंवा पासवर्ड.' : 'Incorrect mobile or password.');
        await finish();
      }
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  // ---- OTP ----
  const sendOtp = async (e) => {
    e && e.preventDefault(); reset(); setBusy(true);
    try {
      const digits = mobile.replace(/\D/g, '');
      if (mode === 'signup' && !name.trim()) throw new Error(isMr ? 'नाव आवश्यक आहे.' : 'Name is required.');
      if (digits.length < 10) throw new Error(isMr ? 'वैध मोबाईल नंबर टाका.' : 'Enter a valid mobile number.');
      const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send', mobile: digits }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setDemoCode(data.demoCode || '');
      setOtpStage('verify');
      setNote(tr('otpSent', isMr));
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const verifyOtp = async (e) => {
    e.preventDefault(); reset(); setBusy(true);
    try {
      const digits = mobile.replace(/\D/g, '');
      const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify', mobile: digits, code: otp, name: name || null, email: email || null }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
      if (error) throw error;
      await finish();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const inputCls = `w-full px-4 py-3 bg-cream border border-charcoal/15 focus:border-heritage outline-none text-charcoal transition-colors ${isMr ? 'font-marathi' : ''}`;
  const iconInput = 'relative';
  const Field = ({ icon: Icon, children }) => (
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/35 z-10" />
      {children}
    </div>
  );

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-md bg-white border border-charcoal/10 p-8 rise-in shadow-xl shadow-charcoal/5">
        <div className="grid place-items-center w-14 h-14 border-2 border-heritage rotate-45 mb-5">
          <Fingerprint className="w-6 h-6 text-heritage -rotate-45" />
        </div>
        <h1 className={`text-3xl mb-1 text-charcoal ${isMr ? 'font-marathi' : 'font-serif'}`}>{tr('portalTitle', isMr)}</h1>
        <p className={`text-charcoal/50 text-sm mb-5 ${isMr ? 'font-marathi' : ''}`}>{mode === 'signup' ? tr('createAccount', isMr) : tr('welcomeBack', isMr)}</p>

        {/* signin / signup toggle */}
        <div className="flex gap-2 mb-5">
          <button onClick={() => { setMode('signin'); reset(); setOtpStage('enter'); }} className={`flex-1 py-2 text-sm font-bold uppercase border-2 transition-colors ${isMr ? 'font-marathi' : ''} ${mode === 'signin' ? 'bg-heritage border-heritage text-white' : 'border-charcoal/15 text-charcoal/60 hover:border-heritage'}`}>{tr('signIn', isMr)}</button>
          <button onClick={() => { setMode('signup'); reset(); setOtpStage('enter'); }} className={`flex-1 py-2 text-sm font-bold uppercase border-2 transition-colors ${isMr ? 'font-marathi' : ''} ${mode === 'signup' ? 'bg-heritage border-heritage text-white' : 'border-charcoal/15 text-charcoal/60 hover:border-heritage'}`}>{tr('signUp', isMr)}</button>
        </div>

        {/* method tabs */}
        <div className="grid grid-cols-3 gap-1.5 mb-5">
          {METHODS.map((m) => (
            <button key={m.key} onClick={() => { setMethod(m.key); reset(); setOtpStage('enter'); }}
              className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold uppercase tracking-wide border transition-colors ${isMr ? 'font-marathi' : ''} ${method === m.key ? 'border-heritage bg-heritage/5 text-heritage' : 'border-charcoal/12 text-charcoal/50 hover:border-charcoal/30'}`}>
              <m.icon className="w-4 h-4" />
              {tr(m.label, isMr)}
            </button>
          ))}
        </div>

        {err && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 mb-4 fade-in">{err}</div>}
        {note && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2 mb-4 fade-in">{note}</div>}

        {/* ---- EMAIL METHOD ---- */}
        {method === 'email' && (
          <form onSubmit={emailSubmit} className="space-y-3">
            {mode === 'signup' && (
              <>
                <Field icon={User}><input value={name} onChange={(e) => setName(e.target.value)} placeholder={tr('fullName', isMr)} className={`${inputCls} pl-10`} /></Field>
                <Field icon={Phone}><input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder={tr('mobileNumber', isMr)} className={`${inputCls} pl-10`} inputMode="tel" /></Field>
              </>
            )}
            <Field icon={Mail}><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder={mode === 'signup' ? tr('yourEmail', isMr) : tr('yourEmail', isMr)} className={`${inputCls} pl-10`} /></Field>
            <Field icon={KeyRound}><input value={pass} onChange={(e) => setPass(e.target.value)} type="password" required placeholder={tr('password', isMr)} className={`${inputCls} pl-10`} /></Field>
            <SubmitBtn busy={busy} isMr={isMr} label={mode === 'signup' ? tr('signUp', isMr) : tr('signIn', isMr)} />
          </form>
        )}

        {/* ---- MOBILE + PASSWORD METHOD ---- */}
        {method === 'mobilePass' && (
          <form onSubmit={mobilePassSubmit} className="space-y-3">
            {mode === 'signup' && (
              <>
                <Field icon={User}><input value={name} onChange={(e) => setName(e.target.value)} placeholder={tr('fullName', isMr)} className={`${inputCls} pl-10`} /></Field>
                <Field icon={Mail}><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder={tr('emailOptional', isMr)} className={`${inputCls} pl-10`} /></Field>
              </>
            )}
            <Field icon={Phone}><input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder={tr('mobileNumber', isMr)} className={`${inputCls} pl-10`} inputMode="tel" /></Field>
            <Field icon={KeyRound}><input value={pass} onChange={(e) => setPass(e.target.value)} type="password" placeholder={tr('password', isMr)} className={`${inputCls} pl-10`} /></Field>
            <SubmitBtn busy={busy} isMr={isMr} label={mode === 'signup' ? tr('signUp', isMr) : tr('signIn', isMr)} />
          </form>
        )}

        {/* ---- MOBILE OTP METHOD ---- */}
        {method === 'otp' && (
          <>
            {otpStage === 'enter' ? (
              <form onSubmit={sendOtp} className="space-y-3">
                {mode === 'signup' && (
                  <>
                    <Field icon={User}><input value={name} onChange={(e) => setName(e.target.value)} placeholder={tr('fullName', isMr)} className={`${inputCls} pl-10`} /></Field>
                    <Field icon={Mail}><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder={tr('emailOptional', isMr)} className={`${inputCls} pl-10`} /></Field>
                  </>
                )}
                <Field icon={Phone}><input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder={tr('mobileNumber', isMr)} className={`${inputCls} pl-10`} inputMode="tel" /></Field>
                <SubmitBtn busy={busy} isMr={isMr} label={tr('sendOtp', isMr)} />
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="space-y-3">
                <div className="flex items-center justify-between text-xs text-charcoal/50">
                  <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-heritage" />+91 {mobile}</span>
                  <button type="button" onClick={() => { setOtpStage('enter'); reset(); }} className="text-heritage font-semibold hover:underline">{tr('changeNumber', isMr)}</button>
                </div>
                <Field icon={ShieldCheck}><input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={tr('enterOtp', isMr)} className={`${inputCls} pl-10 tracking-[0.5em] font-bold text-center`} inputMode="numeric" /></Field>
                {demoCode && <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2">{isMr ? 'डेमो ओटीपी' : 'Demo OTP'}: <span className="font-bold tracking-widest">{demoCode}</span> <span className="text-charcoal/40">({isMr ? 'एसएमएस गेटवे कॉन्फिगर केल्यावर हे लपवले जाईल' : 'shown here since no SMS gateway is connected'})</span></p>}
                <SubmitBtn busy={busy} isMr={isMr} label={tr('verifyOtp', isMr)} />
                <button type="button" onClick={sendOtp} disabled={busy} className={`w-full text-xs text-heritage font-semibold hover:underline disabled:opacity-50 ${isMr ? 'font-marathi' : ''}`}>{tr('resendOtp', isMr)}</button>
              </form>
            )}
          </>
        )}

        <div className={`text-center text-charcoal/40 text-xs my-4 ${isMr ? 'font-marathi' : ''}`}>{tr('or', isMr)}</div>
        <button onClick={() => signInWithGoogle('TREKKIE Mavala')} className={`w-full py-3 border-2 border-charcoal/15 text-charcoal font-bold hover:border-heritage transition-colors flex items-center justify-center gap-2 ${isMr ? 'font-marathi' : ''}`}>
          <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 6.68 9.14 4.75 12 4.75z"/></svg>
          {tr('signInGoogle', isMr)}
        </button>
        <p className="text-[11px] text-charcoal/30 mt-4 text-center">Demo — demo@example.com / password123</p>
      </div>
    </div>
  );
}

function SubmitBtn({ busy, isMr, label }) {
  return (
    <button disabled={busy} className={`btn-sheen w-full py-3.5 bg-charcoal text-cream font-bold uppercase tracking-wide hover:bg-heritage transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${isMr ? 'font-marathi' : ''}`}>
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}{label}
    </button>
  );
}
