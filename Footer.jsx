import { Mountain, Instagram, Mail, Phone, Pencil } from 'lucide-react';
import { tr } from '../lib/i18n';
import { useAdmin } from '../contexts/AdminContext';

export default function Footer({ isMr, settings, setActiveTab, content, cvalL, onEditText }) {
  const { isAdmin } = useAdmin();
  const year = new Date().getFullYear();
  const cval = (k) => content?.find(c => c.content_key === k)?.value_en;
  const logoUrl = cval('logo_url');
  const brandName = cvalL('brand_name', isMr) || 'TREKKIE';
  const brandAccent = cvalL('brand_name_accent', isMr) || 'मावळा';
  const parentCompany = cvalL('parent_company', isMr) || 'Mavala Adventure Guild Pvt. Ltd.';

  // policy key -> content_key
  const policies = [
    ['privacyPolicy', 'policy_privacy'],
    ['refundPolicy', 'policy_refund'],
    ['safetyCharter', 'policy_safety'],
    ['terms', 'policy_terms'],
  ];
  const links = [['home', 'home'], ['treks', 'treks'], ['tours', 'tours'], ['gallery', 'gallery'], ['faq', 'faq'], ['contact', 'contact']];

  const openPolicy = (contentKey, labelKey) => {
    const body = cvalL(contentKey, isMr);
    alert(`${tr(labelKey, isMr)}\n\n${body}`);
  };

  const Edit = ({ k }) => isAdmin ? (
    <button onClick={() => onEditText(k)} className="inline-grid place-items-center w-5 h-5 ml-1.5 align-middle bg-heritage/20 text-heritage hover:bg-heritage hover:text-white transition-colors rounded-sm">
      <Pencil className="w-3 h-3" />
    </button>
  ) : null;

  return (
    <footer className="bg-charcoal text-cream paper-grain">
      <div className="mx-auto max-w-[1400px] px-5 py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            {logoUrl ? <img src={logoUrl} className="w-9 h-9 object-contain" /> : (
              <div className="grid place-items-center w-9 h-9 border-2 border-heritage rotate-45"><Mountain className="w-4 h-4 text-heritage -rotate-45" /></div>
            )}
            <span className={`font-serif text-lg font-bold ${isMr ? 'font-marathi' : ''}`}>{brandName} <span className="font-marathi text-heritage">{brandAccent}</span></span>
          </div>
          <p className={`text-cream/50 text-sm leading-relaxed ${isMr ? 'font-marathi' : ''}`}>
            {tr('footerTag', isMr)}<Edit k="footerTag" />
          </p>
          <p className={`text-cream/40 text-xs mt-3 ${isMr ? 'font-marathi' : ''}`}>
            {isMr ? 'मूळ कंपनी' : 'A unit of'}: <span className="text-cream/60 font-semibold">{parentCompany}</span><Edit k="parent_company" />
          </p>
          {settings?.instagram && <div className="flex items-center gap-2 mt-4 text-cream/60 text-sm"><Instagram className="w-4 h-4 text-heritage" />{settings.instagram}</div>}
        </div>

        <div>
          <h4 className={`text-xs font-bold tracking-[0.25em] uppercase text-amber mb-4 ${isMr ? 'font-marathi' : ''}`}>{tr('quickLinks', isMr)}</h4>
          <ul className="space-y-2">
            {links.map(([k, tab]) => (
              <li key={k}><button onClick={() => { setActiveTab(tab); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`text-cream/60 text-sm hover:text-heritage transition-colors ${isMr ? 'font-marathi' : ''}`}>{tr(k, isMr)}</button></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className={`text-xs font-bold tracking-[0.25em] uppercase text-amber mb-4 ${isMr ? 'font-marathi' : ''}`}>{tr('policies', isMr)}</h4>
          <ul className="space-y-2">
            {policies.map(([labelKey, contentKey]) => (
              <li key={labelKey} className="flex items-center">
                <button onClick={() => openPolicy(contentKey, labelKey)} className={`text-cream/60 text-sm hover:text-heritage transition-colors text-left ${isMr ? 'font-marathi' : ''}`}>{tr(labelKey, isMr)}</button>
                <Edit k={contentKey} />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className={`text-xs font-bold tracking-[0.25em] uppercase text-amber mb-4 ${isMr ? 'font-marathi' : ''}`}>{tr('reach', isMr)}</h4>
          <div className="space-y-3">
            {settings?.phone && <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-cream/60 text-sm hover:text-heritage"><Phone className="w-4 h-4" />{settings.phone}</a>}
            {settings?.email && <a href={`mailto:${settings.email}`} className="flex items-center gap-2 text-cream/60 text-sm hover:text-heritage"><Mail className="w-4 h-4" />{settings.email}</a>}
            {isAdmin && <p className="text-[10px] text-heritage/70">Edit in Command → Site Customizer → Contact & Brand</p>}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center">
        <p className={`text-cream/40 text-xs ${isMr ? 'font-marathi' : ''}`}>© {year} {brandName} {brandAccent} · {parentCompany}. {tr('rights', isMr)}</p>
      </div>
    </footer>
  );
}
