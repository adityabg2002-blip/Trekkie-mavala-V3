import { MapPin, CalendarDays, Calendar, Route, Navigation } from 'lucide-react';
import { tr } from '../lib/i18n';
import EmptyState from '../components/EmptyState';
import { AddButton, InlineEdit, EditBadge } from '../components/EditButton';
import useReveal from '../lib/useReveal';

export default function Tours({ isMr, tours, onBook, onEditEntity, onEditText, refresh }) {
  useReveal([isMr, tours.length]);
  const del = async (id) => {
    if (!confirm('Delete this tour?')) return;
    await fetch('/api/data?resource=tours', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    refresh();
  };

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-16">
      <div className="text-center mb-6">
        <div className="w-14 h-0.5 bg-heritage mx-auto mb-4" />
        <h1 className={`text-charcoal ${isMr ? 'font-marathi text-3xl' : 'font-serif text-4xl md:text-6xl'}`}>{tr('toursTitle', isMr)}<InlineEdit contentKey="toursTitle" onEdit={onEditText} /></h1>
        <p className={`text-charcoal/50 mt-3 ${isMr ? 'font-marathi' : 'font-cormorant text-xl italic'}`}>{tr('toursIntro', isMr)}<InlineEdit contentKey="toursIntro" onEdit={onEditText} /></p>
      </div>
      <div className="flex justify-center mb-8">
        <AddButton onClick={() => onEditEntity('tour', null)} label={isMr ? 'दौरा जोडा' : 'Add Tour'} />
      </div>
      {tours.length ? (
        <div className="grid gap-8 md:grid-cols-3 stagger">
          {tours.map((t, idx) => {
            const route = isMr ? t.route_mr : t.route_en;
            const venue = isMr ? t.venue_mr : t.venue_en;
            const pickup = isMr ? t.pickup_mr : t.pickup_en;
            const showDate = t.show_date !== false && t.date;
            return (
              <div key={t.id} style={{ '--i': idx % 3 }} className="reveal group relative bg-white border border-charcoal/10 overflow-hidden card-lift">
                <EditBadge onEdit={() => onEditEntity('tour', t)} onDelete={() => del(t.id)} />
                <div className="relative h-56 overflow-hidden">
                  <img src={t.image} alt={t.title_en} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[900ms] ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-3 text-cream text-xs font-semibold">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-amber" />{t.region}</span>
                    <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5 text-amber" />{t.days} {tr('daysLabel', isMr)}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className={`text-xl font-bold text-charcoal mb-3 ${isMr ? 'font-marathi' : 'font-serif'}`}>{isMr ? t.title_mr : t.title_en}</h3>
                  <p className={`text-sm text-charcoal/60 leading-relaxed mb-4 ${isMr ? 'font-marathi' : ''}`}>{isMr ? t.description_mr : t.description_en}</p>
                  {showDate && <div className="flex items-center gap-2 mb-2 text-xs text-heritage font-semibold"><Calendar className="w-3.5 h-3.5" />{t.date}{t.departure_time && ` • ${t.departure_time}`}</div>}
                  {(route || venue || pickup) && (
                    <div className="space-y-1.5 mb-4 border-t border-charcoal/10 pt-3">
                      {route && <div className={`flex items-start gap-1.5 text-[11px] text-charcoal/60 ${isMr ? 'font-marathi' : ''}`}><Route className="w-3.5 h-3.5 text-heritage shrink-0 mt-0.5" /><span>{route}</span></div>}
                      {venue && <div className={`flex items-start gap-1.5 text-[11px] text-charcoal/60 ${isMr ? 'font-marathi' : ''}`}><MapPin className="w-3.5 h-3.5 text-heritage shrink-0 mt-0.5" /><span>{venue}</span></div>}
                      {pickup && <div className={`flex items-start gap-1.5 text-[11px] text-charcoal/60 ${isMr ? 'font-marathi' : ''}`}><Navigation className="w-3.5 h-3.5 text-heritage shrink-0 mt-0.5" /><span>{pickup}</span></div>}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-2xl font-bold text-charcoal">₹{t.price?.toLocaleString('en-IN')}<span className="text-xs text-charcoal/40 font-body"> / {isMr ? 'व्यक्ती' : 'head'}</span></span>
                    <button onClick={() => onBook({ name_en: t.title_en, name_mr: t.title_mr, price: t.price, date: t.date || '' })} className={`btn-sheen px-4 py-2 bg-charcoal text-cream text-xs font-bold uppercase tracking-wide hover:bg-heritage transition-colors ${isMr ? 'font-marathi' : ''}`}>{tr('bookNow', isMr)}</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : <EmptyState isMr={isMr} />}
    </div>
  );
}
