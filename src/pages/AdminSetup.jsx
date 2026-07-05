import { useState, useEffect } from 'react';
import { Copy, Check, Download, Database, KeyRound, CreditCard, ListChecks, ExternalLink } from 'lucide-react';

// A friendly, self-contained setup page. Visit /admin-setup on your own site.
// It shows the full SQL with a one-click COPY button — no copying from chat needed.
export default function AdminSetup() {
  const [sql, setSql] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/setup/supabase-setup.sql').then((r) => r.text()).then(setSql).catch(() => setSql('-- Could not load SQL file. Open public/setup/supabase-setup.sql directly.'));
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // fallback: select the textarea
      const ta = document.getElementById('sql-box');
      if (ta) { ta.select(); document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2200); }
    }
  };

  const steps = [
    { icon: Database, title: '1. Create your Supabase project', body: 'Go to supabase.com → New Project. Pick a name, password, and the Mumbai region. Wait ~2 min.' },
    { icon: Copy, title: '2. Paste the SQL below', body: 'In Supabase → SQL Editor → New query. Click "Copy SQL" below, paste it, and hit Run. All tables get created.' },
    { icon: KeyRound, title: '3. Copy your Supabase keys', body: 'Supabase → Project Settings → API. Copy the Project URL, anon key, and service_role secret.' },
    { icon: ListChecks, title: '4. Connect your site', body: 'Put those 3 values into your project\u2019s vercel.json (and .env for local). Redeploy.' },
    { icon: CreditCard, title: '5. Razorpay (do this last)', body: 'Keep TEST keys until your site is live. After KYC + activation, swap in your rzp_live_ keys and set the webhook. Regenerate the test secret you shared earlier.' },
  ];

  return (
    <div className="min-h-screen bg-cream paper-grain">
      <div className="mx-auto max-w-4xl px-5 py-14">
        <div className="text-center mb-10">
          <div className="w-14 h-0.5 bg-heritage mx-auto mb-4" />
          <h1 className="font-serif text-4xl md:text-5xl text-charcoal">Go-Live Setup</h1>
          <p className="font-cormorant text-xl italic text-charcoal/50 mt-2">Move your site onto your own Supabase — no copying from chat.</p>
        </div>

        {/* Steps */}
        <div className="grid gap-4 sm:grid-cols-2 mb-10">
          {steps.map((s, i) => (
            <div key={i} className="bg-white border border-charcoal/10 p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="grid place-items-center w-9 h-9 bg-heritage/10 text-heritage"><s.icon className="w-4.5 h-4.5" /></div>
                <h3 className="font-bold text-charcoal text-sm">{s.title}</h3>
              </div>
              <p className="text-sm text-charcoal/60 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap gap-3 mb-8">
          <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-4 py-2 bg-charcoal text-cream text-xs font-bold uppercase tracking-wide hover:bg-heritage transition-colors"><ExternalLink className="w-3.5 h-3.5" />Open Supabase</a>
          <a href="/setup/SETUP-GUIDE.txt" target="_blank" className="flex items-center gap-1.5 px-4 py-2 border-2 border-charcoal/20 text-charcoal text-xs font-bold uppercase tracking-wide hover:border-heritage transition-colors"><Download className="w-3.5 h-3.5" />Full Written Guide</a>
          <a href="/setup/supabase-setup.sql" download className="flex items-center gap-1.5 px-4 py-2 border-2 border-charcoal/20 text-charcoal text-xs font-bold uppercase tracking-wide hover:border-heritage transition-colors"><Download className="w-3.5 h-3.5" />Download .sql File</a>
        </div>

        {/* SQL box with copy */}
        <div className="bg-charcoal text-cream border border-charcoal">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-xs font-bold uppercase tracking-widest text-amber flex items-center gap-2"><Database className="w-4 h-4" />supabase-setup.sql</span>
            <button onClick={copy} className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${copied ? 'bg-emerald-500 text-white' : 'bg-heritage text-white hover:bg-heritage-dark'}`}>
              {copied ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy SQL</>}
            </button>
          </div>
          <textarea id="sql-box" readOnly value={sql}
            className="w-full h-[420px] bg-charcoal text-cream/80 text-[11px] leading-relaxed font-mono p-4 outline-none resize-none" />
        </div>

        <p className="text-center text-charcoal/40 text-xs mt-6">
          Tip: bookmark this page — it always shows the exact SQL for your current database.
        </p>
      </div>
    </div>
  );
}
