import { ChevronRight, ShieldCheck, CloudRain, Leaf, Star, Quote, Pin, PinOff, Trash2, ChevronDown } from 'lucide-react';
import { tr, isVisible } from '../lib/i18n';
import Countdown from '../components/Countdown';
import TrekCard from '../components/TrekCard';
import EmptyState from '../components/EmptyState';
import { InlineEdit } from '../components/EditButton';
import { useAdmin } from '../contexts/AdminContext';
import useReveal from '../lib/useReveal';
import HideWrap from '../components/HideWrap';

export default function Home({ isMr, treks, reviews, settings, setActiveTab, onBook, heroType, heroUrl, onEditEntity, onEditText, refresh }) {
  const { isAdmin } = useAdmin();
  useReveal([isMr, treks.length, reviews.length]);

  const pinReview = async (r) => {
    await fetch('/api/reviews', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, pinned: !r.pinned }) });
    refresh && refresh();
  };
  const delReview = async (id) => {
    if (!confirm('Delete this review?')) return;
    await fetch('/api/reviews', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    refresh && refresh();
  };
  const featured = treks.slice(0, 3);
  const trusts = [
    { icon: ShieldCheck, t: 'trust1Title', b: 'trust1Body' },
    { icon: CloudRain, t: 'trust2Title', b: 'trust2Body' },
    { icon: Leaf, t: 'trust3Title', b: 'trust3Body' },
  ];

  return (
    <div>
      {/* HERO */}
      <section className="relative h-[90vh] min-h-[580px] w-full overflow-hidden flex items-center justify-center">
        {heroType === 'image' ? (
          <img key={heroUrl} src={heroUrl || '/videos/hero.mp4'} alt="Sahyadri" className="absolute inset-0 w-full h-full object-cover scale-105" />
        ) : (
          <video key={heroUrl} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover scale-105">
            <source src={heroUrl || '/videos/hero.mp4'} type="video/mp4" />
          </video>
        )}
        <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 via-charcoal/20 to-charcoal/85" />
        {/* subtle vignette frame */}
        <div className="absolute inset-4 md:inset-6 border border-white/10 pointer-events-none" />

        <div className="relative z-10 text-center px-5 max-w-4xl">
          <p className={`text-amber text-xs md:text-sm font-bold tracking-[0.4em] uppercase mb-6 text-shadow-hero rise-in ${isMr ? 'font-marathi tracking-widest' : ''}`} style={{ animationDelay: '0.05s' }}>
            <span className="ornament text-amber/70">{tr('heroKicker', isMr)}</span>
          </p>
          <h1 className={`text-white text-shadow-hero leading-[0.95] rise-in ${isMr ? 'font-marathi text-4xl md:text-6xl' : 'font-serif text-5xl md:text-7xl lg:text-8xl'}`} style={{ animationDelay: '0.15s' }}>
            <span className="block font-medium">{tr('heroTitle1', isMr)}</span>
            <span className="block italic font-semibold text-amber mt-1">{tr('heroTitle2', isMr)}</span>
          </h1>
          <p className={`text-cream/85 max-w-2xl mx-auto mt-7 leading-relaxed text-shadow-hero rise-in ${isMr ? 'font-marathi text-sm md:text-base' : 'text-base md:text-lg font-light'}`} style={{ animationDelay: '0.3s' }}>
            {tr('heroSub', isMr)}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-9 rise-in" style={{ animationDelay: '0.45s' }}>
            <button onClick={() => setActiveTab('treks')} className={`btn-sheen group flex items-center gap-2 px-7 py-3.5 bg-heritage text-white font-bold text-sm tracking-wide uppercase border-2 border-heritage hover:bg-transparent hover:text-heritage transition-all duration-300 shadow-xl shadow-heritage/20 ${isMr ? 'font-marathi' : ''}`}>
              {tr('exploreExpeditions', isMr)} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => setActiveTab('contact')} className={`px-7 py-3.5 glass text-cream font-bold text-sm tracking-wide uppercase hover:bg-white/20 transition-all duration-300 ${isMr ? 'font-marathi' : ''}`}>
              {tr('contactHQ', isMr)}
            </button>
          </div>
        </div>

        {/* scroll cue */}
        <button onClick={() => setActiveTab('treks')} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-cream/60 hover:text-cream transition-colors floaty" aria-label="scroll">
          <ChevronDown className="w-7 h-7" />
        </button>
      </section>

      {/* COUNTDOWN */}
      <HideWrap visKey="vis_countdown">
        <Countdown target={settings?.next_departure} isMr={isMr} />
      </HideWrap>

      {/* FEATURED TREKS */}
      <HideWrap visKey="vis_featured_treks">
      <section className="mx-auto max-w-[1400px] px-5 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 reveal">
          <div>
            <div className="w-14 h-0.5 bg-heritage mb-4" />
            <h2 className={`text-charcoal ${isMr ? 'font-marathi text-3xl' : 'font-serif text-4xl md:text-5xl'}`}>{tr('activeExpeditions', isMr)}<InlineEdit contentKey="activeExpeditions" onEdit={onEditText} /></h2>
            <p className={`text-charcoal/50 mt-2 ${isMr ? 'font-marathi' : 'font-cormorant text-lg italic'}`}>{tr('treksIntro', isMr)}<InlineEdit contentKey="treksIntro" onEdit={onEditText} /></p>
          </div>
          <button onClick={() => setActiveTab('treks')} className={`link-underline text-heritage font-bold text-sm tracking-wide uppercase flex items-center gap-1.5 self-start md:self-auto ${isMr ? 'font-marathi' : ''}`}>
            {tr('treks', isMr)} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {featured.length ? (
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3 reveal stagger">
            {featured.map((t, i) => (
              <div key={t.id} style={{ '--i': i }} className="reveal">
                <TrekCard trek={t} isMr={isMr} onBook={onBook} onEdit={onEditEntity ? () => onEditEntity('trek', t) : undefined} />
              </div>
            ))}
          </div>
        ) : <EmptyState isMr={isMr} />}
      </section>
      </HideWrap>

      {/* TRUST BLOCKS */}
      <HideWrap visKey="vis_trust_blocks">
      <section className="bg-forest text-cream paper-grain relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #e8a13a 0%, transparent 55%)' }} />
        <div className="mx-auto max-w-[1400px] px-5 py-24 relative">
          <div className="text-center mb-16 reveal">
            <div className="w-14 h-0.5 bg-amber mx-auto mb-4" />
            <h2 className={`${isMr ? 'font-marathi text-3xl' : 'font-serif text-4xl md:text-5xl'}`}>{tr('aboutTitle', isMr)}<InlineEdit contentKey="aboutTitle" onEdit={onEditText} /></h2>
          </div>
          <div className="grid gap-10 md:gap-8 md:grid-cols-3 reveal stagger">
            {trusts.map((tb, i) => (
              <div key={i} style={{ '--i': i }} className="reveal text-center px-4 group">
                <div className="grid place-items-center w-16 h-16 mx-auto border-2 border-amber/50 rotate-45 mb-6 group-hover:border-amber group-hover:rotate-[30deg] transition-all duration-500">
                  <tb.icon className="w-7 h-7 text-amber -rotate-45 group-hover:-rotate-[30deg] transition-all duration-500" />
                </div>
                <h3 className={`text-xl mb-3 ${isMr ? 'font-marathi' : 'font-serif'}`}>{tr(tb.t, isMr)}<InlineEdit contentKey={tb.t} onEdit={onEditText} /></h3>
                <p className={`text-cream/70 text-sm leading-relaxed ${isMr ? 'font-marathi' : ''}`}>{tr(tb.b, isMr)}<InlineEdit contentKey={tb.b} onEdit={onEditText} /></p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </HideWrap>

      {/* REVIEWS */}
      <HideWrap visKey="vis_reviews">
      <section className="mx-auto max-w-[1400px] px-5 py-24">
        <div className="text-center mb-14 reveal">
          <div className="w-14 h-0.5 bg-heritage mx-auto mb-4" />
          <h2 className={`text-charcoal ${isMr ? 'font-marathi text-3xl' : 'font-serif text-4xl md:text-5xl'}`}>{tr('ourExplorers', isMr)}<InlineEdit contentKey="ourExplorers" onEdit={onEditText} /></h2>
          <p className="text-charcoal/40 text-sm mt-2">{isMr ? 'गिर्यारोहक त्यांच्या पोर्टलमधून अभिप्राय जोडू शकतात.' : 'Hikers can add reviews from their portal.'}</p>
        </div>
        <div className="grid gap-7 md:grid-cols-3 reveal stagger">
          {reviews.filter(r => r.approved !== false).map((r, i) => (
            <div key={r.id} style={{ '--i': i }} className={`reveal card-lift bg-white border p-7 relative ${r.pinned ? 'border-amber shadow-lg shadow-amber/10' : 'border-charcoal/10'}`}>
              {r.pinned && <div className="absolute -top-2 left-5 px-2 py-0.5 bg-amber text-charcoal text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"><Pin className="w-2.5 h-2.5" />{isMr ? 'पिन केलेले' : 'Pinned'}</div>}
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <button onClick={() => pinReview(r)} title={r.pinned ? 'Unpin' : 'Pin'} className={`grid place-items-center w-7 h-7 ${r.pinned ? 'bg-amber text-charcoal' : 'bg-charcoal/80 text-cream hover:bg-heritage'}`}>{r.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}</button>
                  <button onClick={() => delReview(r.id)} title="Delete" className="grid place-items-center w-7 h-7 bg-red-600/90 text-white hover:bg-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              )}
              <Quote className="w-9 h-9 text-heritage/20 mb-3" />
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className={`w-4 h-4 ${k < r.rating ? 'fill-amber text-amber' : 'text-charcoal/15'}`} />
                ))}
              </div>
              <p className={`text-charcoal/70 leading-relaxed mb-5 ${isMr ? 'font-marathi' : 'font-cormorant text-lg italic'}`}>“{isMr ? (r.text_mr || r.text_en) : r.text_en}”</p>
              <div className="flex items-center justify-between border-t border-charcoal/10 pt-4">
                <span className="font-bold text-charcoal text-sm">{r.name}</span>
                <span className="text-xs text-heritage font-semibold">{r.trek}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      </HideWrap>
    </div>
  );
}
