import { createContext, useContext, useState } from 'react';

const AdminContext = createContext({ isAdmin: false, setIsAdmin: () => {}, adminPass: '', setAdminPass: () => {} });

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('mavala_admin') === '1');
  const [adminPass, setAdminPass] = useState(() => sessionStorage.getItem('mavala_pass') || '');

  const setAdmin = (v, pass) => {
    setIsAdmin(v);
    if (v) { sessionStorage.setItem('mavala_admin', '1'); if (pass) { sessionStorage.setItem('mavala_pass', pass); setAdminPass(pass); } }
    else { sessionStorage.removeItem('mavala_admin'); sessionStorage.removeItem('mavala_pass'); setAdminPass(''); }
  };

  return (
    <AdminContext.Provider value={{ isAdmin, setIsAdmin: setAdmin, adminPass, setAdminPass }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
