import { Mountain, Clock, TrendingUp, Users, Calendar, Route, MapPin, Navigation } from 'lucide-react';
import { tr } from '../lib/i18n';
import { EditBadge } from './EditButton';

export default function TrekCard({ trek, isMr, onBook, onEdit, onDelete }) {
  const name = isMr ? trek.name_mr : trek.name_en;
  const desc = isMr ? trek.description_mr : trek.description_en;
  const route = isMr ? trek.route_mr : trek.route_en;
  const venue = isMr ? trek.venue_mr : trek.venue_en;
  const pickup = isMr ? trek.pickup_mr : trek.pickup_en;
  const showDate = trek.show_date !== false && trek.date;

  return (
    <div className="group relative bg-white border border-charcoal/10 overflow-hidden card-lift">
      <EditBadge onEdit={onEdit} onDelete={onDelete} />
      <div className="relative h-52 overflow-hidden">
        <img src={trek.image} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[900ms] ease-out" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-heritage text-white text-[10px] font-bold tracking-widest uppercase shadow-lg">{trek.grade}</div>
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-cream text-xs font-semibold">
          <Mountain className="w-3.5 h-3.5 text-amber" /> {trek.fort}
        </div>
      </div>
      <div className="p-5">
        <h3 className={`text-xl font-bold text-charcoal leading-snug mb-2 ${isMr ? 'font-marathi' : 'font-serif'}`}>{name}</h3>
        <p className={`text-sm text-charcoal/60 leading-relaxed mb-4 line-clamp-3 ${isMr ? 'font-marathi' : ''}`}>{desc}</p>

        {showDate && (
          <div className="flex items-center gap-2 mb-3 text-xs text-heritage font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            {trek.date}{trek.departure_time && ` • ${trek.departure_time}`}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="border border-charcoal/10 py-2">
            <TrendingUp className="w-3.5 h-3.5 mx-auto text-heritage mb-1" />
            <div className="text-[11px] font-bold text-charcoal">{trek.altitude}</div>
            <div className={`text-[8px] text-charcoal/40 uppercase tracking-wider ${isMr ? 'font-marathi' : ''}`}>{tr('altitude', isMr)}</div>
          </div>
          <div className="border border-charcoal/10 py-2">
            <Clock className="w-3.5 h-3.5 mx-auto text-heritage mb-1" />
            <div className="text-[11px] font-bold text-charcoal">{trek.duration}</div>
            <div className={`text-[8px] text-charcoal/40 uppercase tracking-wider ${isMr ? 'font-marathi' : ''}`}>{tr('duration', isMr)}</div>
          </div>
          <div className="border border-charcoal/10 py-2">
            <Users className="w-3.5 h-3.5 mx-auto text-heritage mb-1" />
            <div className="text-[11px] font-bold text-charcoal">{trek.seats}</div>
            <div className={`text-[8px] text-charcoal/40 uppercase tracking-wider ${isMr ? 'font-marathi' : ''}`}>{tr('seatsLeft', isMr)}</div>
          </div>
        </div>

        {(route || venue || pickup) && (
          <div className="space-y-1.5 mb-4 border-t border-charcoal/10 pt-3">
            {route && <div className={`flex items-start gap-1.5 text-[11px] text-charcoal/60 ${isMr ? 'font-marathi' : ''}`}><Route className="w-3.5 h-3.5 text-heritage shrink-0 mt-0.5" /><span>{route}</span></div>}
            {venue && <div className={`flex items-start gap-1.5 text-[11px] text-charcoal/60 ${isMr ? 'font-marathi' : ''}`}><MapPin className="w-3.5 h-3.5 text-heritage shrink-0 mt-0.5" /><span>{venue}</span></div>}
            {pickup && <div className={`flex items-start gap-1.5 text-[11px] text-charcoal/60 ${isMr ? 'font-marathi' : ''}`}><Navigation className="w-3.5 h-3.5 text-heritage shrink-0 mt-0.5" /><span>{pickup}</span></div>}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="font-serif text-2xl font-bold text-charcoal">₹{trek.price?.toLocaleString('en-IN')}</span>
            <span className="text-xs text-charcoal/40"> / {isMr ? 'व्यक्ती' : 'head'}</span>
          </div>
          <button onClick={() => onBook({ ...trek, kind: 'trek' })} className={`btn-sheen px-4 py-2 bg-charcoal text-cream text-xs font-bold tracking-wide uppercase hover:bg-heritage transition-colors ${isMr ? 'font-marathi' : ''}`}>
            {tr('bookNow', isMr)}
          </button>
        </div>
      </div>
    </div>
  );
}
