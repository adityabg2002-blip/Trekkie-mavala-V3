import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import supabase from './lib/supabase';
import { handleGoogleRedirect } from './lib/googleAuth';
import { tr, setOverrides, setVisibility, isVisible } from './lib/i18n';
import { AdminProvider } from './contexts/AdminContext';
import CursorTrail from './components/CursorTrail';
import Header from './components/Header';
import Footer from './components/Footer';
import BookingForm from './components/BookingForm';
import EntityEditor from './components/EntityEditor';
import QuickTextEditor from './components/QuickTextEditor';
import { AddButton, InlineEdit } from './components/EditButton';
import Home from './pages/Home';
import Treks from './pages/Treks';
import Tours from './pages/Tours';
import Gallery from './pages/Gallery';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import Commander from './pages/Commander';
import Portal from './pages/Portal';
import AdminSetup from './pages/AdminSetup';

handleGoogleRedirect();

function AppInner() {
  // Simple URL route: visiting /admin-setup shows the setup/SQL page directly.
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  if (path === '/admin-setup' || path === '/setup') {
    return <AdminSetup />;
  }

  const [isMr, setIsMr] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  const [treks, setTreks] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [hikers, setHikers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [content, setContent] = useState<any[]>([]);
  const [contentVersion, setContentVersion] = useState(0);

  // Edit modals
  const [editEntity, setEditEntity] = useState<{ kind: string; initial: any } | null>(null);
  const [editText, setEditText] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      const [t, to, g, r, f, b, h, s, c] = await Promise.all([
        fetch('/api/treks').then(x => x.json()),
        fetch('/api/tours').then(x => x.json()),
        fetch('/api/gallery').then(x => x.json()),
        fetch('/api/reviews').then(x => x.json()),
        fetch('/api/faqs').then(x => x.json()),
        fetch('/api/bookings').then(x => x.json()),
        fetch('/api/hikers').then(x => x.json()),
        fetch('/api/business-settings').then(x => x.json()),
        fetch('/api/site-content').then(x => x.json()),
      ]);
      setTreks(Array.isArray(t) ? t : []);
      setTours(Array.isArray(to) ? to : []);
      setGallery(Array.isArray(g) ? g : []);
      setReviews(Array.isArray(r) ? r : []);
      setFaqs(Array.isArray(f) ? f : []);
      setBookings(Array.isArray(b) ? b : []);
      setHikers(Array.isArray(h) ? h : []);
      setSettings(s || null);
      const list = Array.isArray(c) ? c : [];
      setContent(list);
      const map: Record<string, { en: string; mr: string }> = {};
      const vis: Record<string, string> = {};
      list.forEach((row: any) => {
        if (row.content_type === 'text') map[row.content_key] = { en: row.value_en, mr: row.value_mr };
        if (row.content_type === 'visibility') vis[row.content_key] = row.value_en;
      });
      setOverrides(map);
      setVisibility(vis);
      setContentVersion(v => v + 1);
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const cval = (key: string) => content.find(c => c.content_key === key)?.value_en;
  const cvalL = (key: string, mr: boolean) => {
    const row = content.find(c => c.content_key === key);
    if (!row) return '';
    return (mr ? row.value_mr : row.value_en) || row.value_en || '';
  };
  const heroType = cval('hero_media_type') || 'video';
  const heroUrl = cval('hero_media_url') || '/videos/hero.mp4';

  useEffect(() => {
    loadAll();
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-charcoal text-cream paper-grain">
        <CursorTrail />
        <div className="grid place-items-center w-16 h-16 border-2 border-heritage rotate-45 mb-6 animate-pulse">
          <div className="w-6 h-6 border-t-2 border-heritage animate-spin" />
        </div>
        <p className={`text-cream/60 text-sm tracking-wide ${isMr ? 'font-marathi' : ''}`}>{tr('loading', isMr)}</p>
      </div>
    );
  }

  const wa = settings?.whatsapp || '';
  const editProps = {
    onEditEntity: (kind: string, initial: any) => setEditEntity({ kind, initial }),
    onEditText: (key: string) => setEditText(key),
    refresh: loadAll,
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream paper-grain grain-overlay hide-native-cursor">
      <CursorTrail />
      <Header activeTab={activeTab} setActiveTab={setActiveTab} isMr={isMr} setIsMr={setIsMr} content={content} onEditText={setEditText} />

      <main className="flex-1" key={`${isMr}-${contentVersion}`}>
        {activeTab === 'home' && <Home isMr={isMr} treks={treks} reviews={reviews} settings={settings} setActiveTab={setActiveTab} onBook={setBooking} heroType={heroType} heroUrl={heroUrl} {...editProps} />}
        {activeTab === 'treks' && <Treks isMr={isMr} treks={treks} onBook={setBooking} {...editProps} />}
        {activeTab === 'tours' && <Tours isMr={isMr} tours={tours} onBook={setBooking} {...editProps} />}
        {activeTab === 'gallery' && <Gallery isMr={isMr} items={gallery} {...editProps} />}
        {activeTab === 'about' && (
          <div className="mx-auto max-w-3xl px-5 py-20 text-center">
            <div className="w-14 h-0.5 bg-heritage mx-auto mb-6" />
            <h1 className={`text-charcoal mb-6 ${isMr ? 'font-marathi text-3xl' : 'font-serif text-4xl md:text-6xl'}`}>{tr('aboutTitle', isMr)}<InlineEdit contentKey="aboutTitle" onEdit={setEditText} /></h1>
            <p className={`text-charcoal/65 leading-loose ${isMr ? 'font-marathi text-base' : 'font-cormorant text-xl'}`}>{tr('aboutBody', isMr)}<InlineEdit contentKey="aboutBody" onEdit={setEditText} /></p>
          </div>
        )}
        {activeTab === 'faq' && <FAQ isMr={isMr} faqs={faqs} {...editProps} />}
        {activeTab === 'contact' && <Contact isMr={isMr} settings={settings} content={content} {...editProps} />}
        {activeTab === 'commander' && <Commander isMr={isMr} treks={treks} tours={tours} bookings={bookings} gallery={gallery} hikers={hikers} reviews={reviews} content={content} settings={settings} refresh={loadAll} onEditEntity={editProps.onEditEntity} />}
        {activeTab === 'portal' && <Portal isMr={isMr} user={user} hikers={hikers} bookings={bookings} treks={treks} tours={tours} refresh={loadAll} />}
      </main>

      <Footer isMr={isMr} settings={settings} setActiveTab={setActiveTab} content={content} cvalL={cvalL} onEditText={setEditText} />

      {wa && isVisible('vis_whatsapp') && (
        <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"
          className="fixed bottom-6 right-6 z-[600] grid place-items-center w-14 h-14 rounded-full bg-[#25D366] shadow-lg shadow-[#25D366]/40 hover:scale-110 transition-transform">
          <MessageCircle className="w-7 h-7 text-white" fill="white" />
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
        </a>
      )}

      {booking && <BookingForm trek={booking} isMr={isMr} onClose={() => setBooking(null)} onDone={loadAll} />}
      {editEntity && <EntityEditor kind={editEntity.kind} initial={editEntity.initial} onClose={() => setEditEntity(null)} onSaved={loadAll} />}
      {editText && <QuickTextEditor contentKey={editText} content={content} onClose={() => setEditText(null)} onSaved={loadAll} />}
    </div>
  );
}

export default function App() {
  return (
    <AdminProvider>
      <AppInner />
      <Analytics />
    </AdminProvider>
  );
}
