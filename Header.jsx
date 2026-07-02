import { useState } from 'react';
import { Mountain, Menu, X, Wifi, Pencil, EyeOff } from 'lucide-react';
import { tr, isVisible } from '../lib/i18n';
import { useAdmin } from '../contexts/AdminContext';
import Uploader from './Uploader';

const NAV = ['home', 'treks', 'tours', 'gallery', 'about', 'faq', 'contact', 'commanderLogin', 'hikerPortal'];
const TAB_MAP = {
  home: 'home', treks: 'treks', tours: 'tours', gallery: 'gallery', about: 'about',
  faq: 'faq', contact: 'contact', commanderLogin: 'commander', hikerPortal: 'portal'
};
// nav item -> visibility key (only the hideable ones)
const NAV_VIS = { tours: 'vis_nav_tours', gallery: 'vis_nav_gallery', about: 'vis_nav_about', faq: 'vis_nav_faq' };

export default function Header({ activeTab, setActiveTab, isMr, setIsMr, content, onEditText }) {
  const [open, setOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const { isAdmin } = useAdmin();

  const cval = (k) => content?.find(c => c.content_key === k)?.value_en;
  const cvalL = (k, mr) => { const r = content?.find(c => c.content_key === k); return r ? ((mr ? r.value_mr : r.value_en) || r.value_en) : ''; };
  const logoUrl = cval('logo_url');
  const brandName = cvalL('brand_name', isMr) || 'TREKKIE';
  const brandAccent = cvalL('brand_name_accent', isMr) || 'मावळा';
  const brandTagline = cvalL('brand_tagline', isMr) || 'Sahyadri Expedition Desk';

  const saveLogo = async (url) => {
    await fetch('/api/site-content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content_key: 'logo_url', value_en: url, value_mr: url, content_type: 'media' }) });
    window.location.reload();
  };

  const go = (tab) => { setActiveTab(TAB_MAP[tab]); setOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <header className="sticky top-0 z-[500] w-full">
      {/* Marquee — hidden from visitors when admin turns it off; admins still see it dimmed */}
      {(isVisible('vis_marquee') || isAdmin) && (
      <div className={`bg-heritage overflow-hidden border-b border-heritage-dark relative ${!isVisible('vis_marquee') ? 'opacity-40' : ''}`}>
        <div className="flex whitespace-nowrap py-1.5">
          <div className="animate-marquee flex whitespace-nowrap">
            {[0,1].map(i => (
              <span key={i} className="mx-8 text-[11px] font-bold tracking-[0.2em] text-white uppercase">
                {tr('marquee', isMr)}
              </span>
            ))}
          </div>
        </div>
        {isAdmin && !isVisible('vis_marquee') && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 bg-charcoal/60 text-white text-[9px] font-bold uppercase tracking-wide"><EyeOff className="w-3 h-3" />Hidden from visitors</span>
        )}
        {isAdmin && (
          <button onClick={() => onEditText && onEditText('marquee')} title="Edit marquee warning"
            className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-6 h-6 bg-charcoal/40 text-white hover:bg-charcoal">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      )}

      {/* Main bar */}
      <div className="bg-charcoal/95 backdrop-blur-md border-b border-white/10">
        <div className="mx-auto max-w-[1400px] px-5 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <button onClick={() => go('home')} className="flex items-center gap-3 group">
              {logoUrl ? (
                <img src={logoUrl} alt="logo" className="w-10 h-10 object-contain" />
              ) : (
                <div className="grid place-items-center w-10 h-10 border-2 border-heritage rotate-45 group-hover:rotate-0 transition-transform duration-500">
                  <Mountain className="w-5 h-5 text-heritage -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
                </div>
              )}
              <div className="leading-none text-left">
                <div className={`font-serif text-lg font-bold text-cream tracking-wide ${isMr ? 'font-marathi' : ''}`}>{brandName} <span className="font-marathi text-heritage">{brandAccent}</span></div>
                <div className={`text-[9px] tracking-[0.35em] text-cream/50 uppercase mt-0.5 ${isMr ? 'font-marathi' : ''}`}>{brandTagline}</div>
              </div>
            </button>
            {isAdmin && (
              <button onClick={() => setBrandOpen(!brandOpen)} title="Edit brand & logo" className="grid place-items-center w-7 h-7 bg-heritage/20 text-heritage hover:bg-heritage hover:text-white transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <nav className="hidden xl:flex items-center gap-1">
            {NAV.map(item => {
              const active = activeTab === TAB_MAP[item];
              const isAuth = item === 'commanderLogin' || item === 'hikerPortal';
              const visKey = NAV_VIS[item];
              if (visKey && !isVisible(visKey) && !isAdmin) return null; // hidden from visitors
              const navHidden = visKey && !isVisible(visKey);
              return (
                <button key={item} onClick={() => go(item)}
                  className={`px-3 py-2 text-[12px] font-semibold tracking-wide transition-colors ${!isAuth ? 'link-underline' : ''} ${isMr ? 'font-marathi' : ''} ${
                    active ? 'text-heritage' : 'text-cream/70 hover:text-cream'
                  } ${isAuth ? 'border border-cream/20 ml-1 rounded-sm hover:border-heritage hover:bg-heritage/5' : ''} ${active && isAuth ? 'border-heritage bg-heritage/10' : ''} ${navHidden ? 'opacity-40 line-through decoration-heritage' : ''}`}
                  title={navHidden ? 'Hidden from visitors' : undefined}>
                  {tr(item, isMr)}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {(isVisible('vis_db_status_pill') || isAdmin) && (
              <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 border border-emerald-500/40 bg-emerald-500/10 ${!isVisible('vis_db_status_pill') ? 'opacity-40' : ''}`} title={!isVisible('vis_db_status_pill') ? 'Hidden from visitors' : undefined}>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span className={`text-[10px] font-semibold text-emerald-300 tracking-wide ${isMr ? 'font-marathi' : ''}`}>{tr('dbSynced', isMr)}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            )}

            {(isVisible('vis_language_switcher') || isAdmin) && (
              <div className={`flex items-center border border-cream/25 overflow-hidden ${!isVisible('vis_language_switcher') ? 'opacity-40' : ''}`} title={!isVisible('vis_language_switcher') ? 'Hidden from visitors' : undefined}>
                <button onClick={() => setIsMr(false)} className={`px-2.5 py-1 text-[11px] font-bold transition-colors ${!isMr ? 'bg-heritage text-white' : 'text-cream/60'}`}>EN</button>
                <button onClick={() => setIsMr(true)} className={`px-2.5 py-1 text-[11px] font-bold font-marathi transition-colors ${isMr ? 'bg-heritage text-white' : 'text-cream/60'}`}>मराठी</button>
              </div>
            )}

            <button onClick={() => setOpen(!open)} className="xl:hidden p-2 text-cream">
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="xl:hidden border-t border-white/10 bg-charcoal px-5 py-3 grid grid-cols-2 gap-1 fade-in">
            {NAV.map(item => {
              const visKey = NAV_VIS[item];
              if (visKey && !isVisible(visKey) && !isAdmin) return null;
              const navHidden = visKey && !isVisible(visKey);
              return (
                <button key={item} onClick={() => go(item)}
                  className={`px-3 py-2.5 text-left text-sm font-semibold ${isMr ? 'font-marathi' : ''} ${
                    activeTab === TAB_MAP[item] ? 'text-heritage bg-heritage/10' : 'text-cream/70'
                  } ${navHidden ? 'opacity-40 line-through decoration-heritage' : ''}`}>
                  {tr(item, isMr)}
                </button>
              );
            })}
          </div>
        )}

        {/* Brand & logo editor (admin) */}
        {isAdmin && brandOpen && (
          <div className="border-t border-white/10 bg-charcoal px-5 py-4 fade-in">
            <div className="mx-auto max-w-[1400px] grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase font-bold text-amber mb-2">Company Logo</div>
                <div className="flex items-center gap-3">
                  {logoUrl ? <img src={logoUrl} className="w-12 h-12 object-contain bg-white/10 p-1" /> : <div className="w-12 h-12 border-2 border-dashed border-cream/20 grid place-items-center text-[8px] text-cream/40">None</div>}
                  <div className="[&_button]:!border-cream/30 [&_button]:!text-cream">
                    <Uploader accept="image/*,image/svg+xml" label="Upload Logo" onUploaded={saveLogo} />
                  </div>
                  {logoUrl && <button onClick={() => saveLogo('')} className="text-[10px] text-cream/50 underline">Remove</button>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 items-end">
                <button onClick={() => onEditText('brand_name')} className="px-2 py-2 text-[10px] font-bold uppercase border border-cream/25 text-cream hover:border-heritage">Edit Name</button>
                <button onClick={() => onEditText('brand_name_accent')} className="px-2 py-2 text-[10px] font-bold uppercase border border-cream/25 text-cream hover:border-heritage">Edit Accent</button>
                <button onClick={() => onEditText('brand_tagline')} className="px-2 py-2 text-[10px] font-bold uppercase border border-cream/25 text-cream hover:border-heritage">Edit Tagline</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
