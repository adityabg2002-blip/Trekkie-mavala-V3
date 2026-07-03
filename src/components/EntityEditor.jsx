import { useState } from 'react';
import { X, Save, Loader2, Calendar, Clock, MapPin, Route, IndianRupee, Image as ImageIcon } from 'lucide-react';
import Uploader from './Uploader';

const GRADES = ['Easy', 'Easy-Moderate', 'Moderate', 'Difficult', 'Technical'];
const CATS = ['Forts', 'Monsoon', 'Canyons', 'Campsites'];

// Unified editor for both treks and tours.
export default function EntityEditor({ kind, initial, onClose, onSaved }) {
  const isTrek = kind === 'trek';
  const [f, setF] = useState(() => ({
    show_date: true,
    ...(isTrek
      ? { name_en: '', name_mr: '', fort: '', grade: 'Moderate', duration: '', altitude: '', price: '', date: '', departure_time: '', seats: '', category: 'Forts', description_en: '', description_mr: '', route_en: '', route_mr: '', venue_en: '', venue_mr: '', pickup_en: '', pickup_mr: '', image: '' }
      : { title_en: '', title_mr: '', region: '', days: '', price: '', date: '', departure_time: '', description_en: '', description_mr: '', route_en: '', route_mr: '', venue_en: '', venue_mr: '', pickup_en: '', pickup_mr: '', image: '' }),
    ...(initial || {}),
  }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const nameKey = isTrek ? 'name_en' : 'title_en';

  const save = async () => {
    if (!f[nameKey]?.trim()) { setErr('Name is required.'); return; }
    setErr(''); setBusy(true);
    try {
      const payload = { ...f };
      if (payload.price !== '' && payload.price != null) payload.price = Number(payload.price);
      if (isTrek && payload.seats !== '') payload.seats = Number(payload.seats);
      if (!isTrek && payload.days !== '') payload.days = Number(payload.days);
      const method = initial?.id ? 'PUT' : 'POST';
      const res = await fetch(`/api/${isTrek ? 'treks' : 'tours'}`, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Save failed'); }
      await onSaved();
      onClose();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const Field = ({ label, k, type = 'text', icon: Icon, placeholder, marathi }) => (
    <div>
      <label className="text-[10px] text-charcoal/50 uppercase font-bold flex items-center gap-1">{Icon && <Icon className="w-3 h-3 text-heritage" />}{label}</label>
      <input type={type} value={f[k] ?? ''} onChange={(e) => set(k, e.target.value)} placeholder={placeholder}
        className={`w-full px-3 py-2 bg-white border border-charcoal/15 focus:border-heritage outline-none text-charcoal text-sm ${marathi ? 'font-marathi' : ''}`} />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[1100] flex items-start justify-center p-4 bg-charcoal/70 backdrop-blur-sm overflow-y-auto fade-in" onClick={onClose}>
      <div className="w-full max-w-3xl my-8 bg-cream border border-charcoal/10 relative" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-charcoal text-cream">
          <h3 className="font-serif text-xl">{initial?.id ? 'Edit' : 'Add'} {isTrek ? 'Expedition' : 'Tour'}</h3>
          <button onClick={onClose} className="text-cream/60 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          {err && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2">{err}</div>}

          {/* Photo */}
          <div className="border border-charcoal/10 p-4">
            <label className="text-[10px] text-charcoal/50 uppercase font-bold flex items-center gap-1 mb-2"><ImageIcon className="w-3 h-3 text-heritage" />Showcasing Photo</label>
            <div className="flex items-center gap-4">
              {f.image ? <img src={f.image} alt="" className="w-24 h-16 object-cover border border-charcoal/10" /> : <div className="w-24 h-16 border-2 border-dashed border-charcoal/20 grid place-items-center text-charcoal/30 text-[10px]">No image</div>}
              <div className="space-y-2">
                <Uploader accept="image/*" label="Upload Photo" onUploaded={(url) => set('image', url)} />
                <input value={f.image ?? ''} onChange={(e) => set('image', e.target.value)} placeholder="or paste image URL"
                  className="w-64 max-w-full px-3 py-1.5 bg-white border border-charcoal/15 focus:border-heritage outline-none text-charcoal text-xs" />
              </div>
            </div>
          </div>

          {/* Names */}
          <div className="grid md:grid-cols-2 gap-3">
            <Field label={`${isTrek ? 'Trek' : 'Tour'} Name (EN)`} k={nameKey} placeholder="e.g. Rajgad Night Trek" />
            <Field label={`${isTrek ? 'Trek' : 'Tour'} Name (मराठी)`} k={isTrek ? 'name_mr' : 'title_mr'} marathi />
          </div>

          {/* Departure date/time with toggle */}
          <div className="border border-charcoal/10 p-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!f.show_date} onChange={(e) => set('show_date', e.target.checked)} className="w-4 h-4 accent-heritage" />
              <span className="text-sm font-semibold text-charcoal">Show departure date & time on the site</span>
            </label>
            {f.show_date && (
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Departure Date" k="date" type="date" icon={Calendar} />
                <Field label="Departure Time" k="departure_time" type="time" icon={Clock} />
              </div>
            )}
          </div>

          {/* Trek-specific */}
          {isTrek && (
            <div className="grid md:grid-cols-3 gap-3">
              <Field label="Fort / Location" k="fort" icon={MapPin} />
              <div>
                <label className="text-[10px] text-charcoal/50 uppercase font-bold">Grade</label>
                <select value={f.grade} onChange={(e) => set('grade', e.target.value)} className="w-full px-3 py-2 bg-white border border-charcoal/15 text-charcoal text-sm">
                  {GRADES.map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-charcoal/50 uppercase font-bold">Category</label>
                <select value={f.category} onChange={(e) => set('category', e.target.value)} className="w-full px-3 py-2 bg-white border border-charcoal/15 text-charcoal text-sm">
                  {CATS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <Field label="Altitude" k="altitude" placeholder="1376 m" />
              <Field label="Duration" k="duration" placeholder="2 Days / 1 Night" />
              <Field label="Seats Available" k="seats" type="number" />
            </div>
          )}

          {/* Tour-specific */}
          {!isTrek && (
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Region" k="region" icon={MapPin} />
              <Field label="Days" k="days" type="number" />
            </div>
          )}

          {/* Price per head */}
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Price Per Head (₹)" k="price" type="number" icon={IndianRupee} placeholder="1499" />
          </div>

          {/* Route */}
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Trek / Tour Route (EN)" k="route_en" icon={Route} placeholder="Base village → Ridge → Summit" />
            <Field label="Route (मराठी)" k="route_mr" marathi />
          </div>

          {/* Venue */}
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Venue of Departure (EN)" k="venue_en" icon={MapPin} placeholder="e.g. Pune Railway Station" />
            <Field label="Venue (मराठी)" k="venue_mr" marathi />
          </div>

          {/* Pickup point */}
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Picking Point (EN)" k="pickup_en" icon={MapPin} placeholder="e.g. Swargate Bus Stand, Gate 3" />
            <Field label="Picking Point (मराठी)" k="pickup_mr" marathi />
          </div>

          {/* Description */}
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-charcoal/50 uppercase font-bold">Description (EN)</label>
              <textarea rows={3} value={f[isTrek ? 'description_en' : 'description_en'] ?? ''} onChange={(e) => set('description_en', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-charcoal/15 focus:border-heritage outline-none text-charcoal text-sm resize-none" />
            </div>
            <div>
              <label className="text-[10px] text-charcoal/50 uppercase font-bold">Description (मराठी)</label>
              <textarea rows={3} value={f.description_mr ?? ''} onChange={(e) => set('description_mr', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-charcoal/15 focus:border-heritage outline-none text-charcoal text-sm resize-none font-marathi" />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 px-6 py-4 bg-cream-dark/60 border-t border-charcoal/10">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold uppercase text-charcoal/60 border border-charcoal/20 hover:border-charcoal">Cancel</button>
          <button onClick={save} disabled={busy} className="flex items-center gap-2 px-5 py-2 bg-heritage text-white text-sm font-bold uppercase hover:bg-heritage-dark disabled:opacity-50 transition-colors">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}
