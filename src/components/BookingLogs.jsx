import { useState, useEffect } from 'react';
import { Search, Download, RefreshCw, Loader2, IndianRupee, CheckCircle2, XCircle, Clock, Receipt, Phone, MapPin, Calendar, User, TrendingUp, CreditCard } from 'lucide-react';

const STATUS_FILTERS = ['All', 'Paid', 'Pending', 'Failed', 'Refunded'];

export default function BookingLogs({ isMr }) {
  const [data, setData] = useState({ bookings: [], stats: null });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/data?resource=trek-bookings');
      const json = await res.json();
      setData(json.bookings ? json : { bookings: [], stats: null });
    } catch (e) { console.error(e); } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = data.bookings.filter((b) => {
    if (status !== 'All' && b.payment_status !== status) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return [b.full_name, b.mobile, b.city, b.trek_name, b.razorpay_payment_id, b.razorpay_order_id]
      .filter(Boolean).some((v) => String(v).toLowerCase().includes(s));
  });

  const exportCsv = () => {
    const headers = ['ID', 'Name', 'Mobile', 'Age', 'Gender', 'City', 'Trek', 'Amount', 'Status', 'Payment ID', 'Order ID', 'Date'];
    const rows = filtered.map((b) => [
      b.id, b.full_name, b.mobile, b.age, b.gender, b.city, b.trek_name, b.amount,
      b.payment_status, b.razorpay_payment_id, b.razorpay_order_id,
      b.created_at ? new Date(b.created_at).toLocaleString() : '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `mavala-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const markRefunded = async (id) => {
    if (!confirm('Mark this booking as Refunded?')) return;
    await fetch('/api/data?resource=trek-bookings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, payment_status: 'Refunded' }) });
    load();
  };

  const s = data.stats;

  const statusPill = (st) => {
    const map = {
      Paid: 'bg-emerald-100 text-emerald-700',
      Failed: 'bg-red-100 text-red-700',
      Pending: 'bg-amber-100 text-amber-700',
      Refunded: 'bg-charcoal/10 text-charcoal/60',
    };
    return map[st] || 'bg-charcoal/10 text-charcoal/60';
  };

  if (loading) {
    return <div className="py-16 flex justify-center"><Loader2 className="w-7 h-7 text-heritage animate-spin" /></div>;
  }

  return (
    <div>
      {/* Stats */}
      {s && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatCard icon={IndianRupee} label={isMr ? 'एकूण महसूल (भरलेले)' : 'Revenue (Paid)'} value={`₹${s.revenue.toLocaleString('en-IN')}`} accent="text-emerald-600" />
          <StatCard icon={CheckCircle2} label={isMr ? 'यशस्वी बुकिंग' : 'Paid Bookings'} value={s.paid} accent="text-emerald-600" />
          <StatCard icon={Clock} label={isMr ? 'प्रलंबित' : 'Pending'} value={s.pending} accent="text-amber-600" />
          <StatCard icon={XCircle} label={isMr ? 'अयशस्वी' : 'Failed'} value={s.failed} accent="text-red-500" />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={isMr ? 'नाव, मोबाईल, ट्रेक, पेमेंट आयडी शोधा...' : 'Search name, mobile, trek, payment ID...'}
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-charcoal/15 focus:border-heritage outline-none text-charcoal text-sm" />
        </div>
        <button onClick={() => { setRefreshing(true); load(); }} className="flex items-center gap-1.5 px-3 py-2.5 border-2 border-charcoal/15 text-charcoal/60 text-xs font-bold uppercase hover:border-heritage transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> {isMr ? 'रिफ्रेश' : 'Refresh'}
        </button>
        <button onClick={exportCsv} disabled={!filtered.length} className="flex items-center gap-1.5 px-3 py-2.5 bg-charcoal text-cream text-xs font-bold uppercase hover:bg-heritage disabled:opacity-40 transition-colors">
          <Download className="w-3.5 h-3.5" /> {isMr ? 'CSV निर्यात' : 'Export CSV'}
        </button>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_FILTERS.map((st) => (
          <button key={st} onClick={() => setStatus(st)}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide border transition-colors ${status === st ? 'bg-heritage border-heritage text-white' : 'border-charcoal/15 text-charcoal/50 hover:border-heritage'}`}>
            {st}{st !== 'All' && s ? ` (${data.bookings.filter((b) => b.payment_status === st).length})` : ''}
          </button>
        ))}
      </div>

      {/* Table (desktop) */}
      {filtered.length ? (
        <>
          <div className="hidden md:block overflow-x-auto border border-charcoal/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-charcoal/40 text-[10px] uppercase tracking-wide bg-cream-dark/40 border-b border-charcoal/10">
                  <th className="py-2.5 px-3">Hiker</th>
                  <th className="px-3">Trek</th>
                  <th className="px-3">Details</th>
                  <th className="px-3">Amount</th>
                  <th className="px-3">Payment ID</th>
                  <th className="px-3">Status</th>
                  <th className="px-3">Date</th>
                  <th className="px-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-charcoal/5 hover:bg-cream-dark/20">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-charcoal">{b.full_name}</div>
                      <div className="text-xs text-charcoal/50">{b.mobile}</div>
                    </td>
                    <td className="px-3 text-charcoal/70">{b.trek_name}</td>
                    <td className="px-3 text-xs text-charcoal/50">{b.age}y · {b.gender} · {b.city}</td>
                    <td className="px-3 font-semibold text-charcoal">₹{(b.amount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-3"><span className="font-mono text-[11px] text-charcoal/60">{b.razorpay_payment_id || '—'}</span></td>
                    <td className="px-3"><span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${statusPill(b.payment_status)}`}>{b.payment_status}</span></td>
                    <td className="px-3 text-xs text-charcoal/50">{b.created_at ? new Date(b.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-3">
                      {b.payment_status === 'Paid' && (
                        <button onClick={() => markRefunded(b.id)} title="Mark refunded" className="text-[10px] font-bold uppercase text-charcoal/40 hover:text-heritage">Refund</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards (mobile) */}
          <div className="md:hidden space-y-3">
            {filtered.map((b) => (
              <div key={b.id} className="border border-charcoal/10 bg-white p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-charcoal flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-heritage" />{b.full_name}</div>
                    <div className="text-xs text-charcoal/50 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{b.mobile}</div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${statusPill(b.payment_status)}`}>{b.payment_status}</span>
                </div>
                <div className="text-sm text-charcoal/70 mb-1">{b.trek_name}</div>
                <div className="text-xs text-charcoal/50 flex flex-wrap gap-x-3 gap-y-1 mb-2">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{b.age}y</span>
                  <span>{b.gender}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.city}</span>
                </div>
                <div className="flex items-center justify-between border-t border-charcoal/10 pt-2">
                  <span className="font-bold text-charcoal flex items-center"><IndianRupee className="w-3.5 h-3.5" />{(b.amount || 0).toLocaleString('en-IN')}</span>
                  <span className="font-mono text-[10px] text-charcoal/40 flex items-center gap-1"><Receipt className="w-3 h-3" />{b.razorpay_payment_id || '—'}</span>
                </div>
                {b.payment_status === 'Paid' && <button onClick={() => markRefunded(b.id)} className="mt-2 text-[10px] font-bold uppercase text-charcoal/40 hover:text-heritage">Mark Refunded</button>}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="border-2 border-dashed border-charcoal/20 bg-cream-dark/30 py-14 text-center">
          <CreditCard className="w-9 h-9 mx-auto text-heritage/50 mb-3" />
          <p className="text-charcoal/50 text-sm">{isMr ? 'अद्याप कोणतेही पेमेंट बुकिंग नाहीत.' : 'No payment bookings yet.'}</p>
          <p className="text-charcoal/40 text-xs mt-1">{isMr ? 'गिर्यारोहकांनी ट्रेक बुक केल्यावर ते येथे दिसतील.' : 'Bookings appear here once hikers pay via Razorpay.'}</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-white border border-charcoal/10 p-4">
      <Icon className={`w-5 h-5 mb-2 ${accent || 'text-heritage'}`} />
      <div className="font-serif text-2xl font-bold text-charcoal">{value}</div>
      <div className="text-[10px] text-charcoal/50 uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}
