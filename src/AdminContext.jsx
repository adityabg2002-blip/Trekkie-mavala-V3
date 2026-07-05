import { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import { setApiToken } from '../lib/apiShim';

const AdminContext = createContext({ isAdmin: false, user: null, loading: true, logout: () => {} });

// Reads the admin flag straight from the verified Supabase session's role claim
// (app_metadata.role === 'admin' — set from the Supabase Dashboard). There is
// no client-trusted "admin passcode" anymore; the backend independently
// verifies the same JWT on every write.
function deriveAdmin(session) {
  const u = session?.user;
  if (!u) return false;
  const role = u.app_metadata?.role || u.user_metadata?.role;
  if (role === 'admin' || u.app_metadata?.roles?.includes?.('admin')) return true;
  // Fallback allow-list (mirrors the server's ADMIN_EMAILS). Prefer tagging
  // app_metadata.role = "admin" in the Supabase Dashboard for production.
  const allow = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return !!(u.email && allow.includes(u.email.toLowerCase()));
}

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      setApiToken(s?.access_token || null);
      setUser(s?.user ?? null);
      setIsAdmin(deriveAdmin(s));
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setApiToken(session?.access_token || null);
      setUser(session?.user ?? null);
      setIsAdmin(deriveAdmin(session));
    });
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setUser(null);
    setApiToken(null);
  };

  return (
    <AdminContext.Provider value={{ isAdmin, user, loading, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
