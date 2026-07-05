import { EyeOff } from 'lucide-react';
import { isVisible } from '../lib/i18n';
import { useAdmin } from '../contexts/AdminContext';

// Wraps a section. If the admin has hidden it:
//   - visitors see nothing
//   - admins see it dimmed with a "Hidden from visitors" banner (so they can still
//     find it and re-enable it from the Show/Hide manager)
export default function HideWrap({ visKey, children }) {
  const { isAdmin } = useAdmin();
  const shown = isVisible(visKey);
  if (shown) return children;
  if (!isAdmin) return null;
  return (
    <div className="relative">
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1 bg-charcoal text-cream text-[10px] font-bold uppercase tracking-wide shadow-lg">
        <EyeOff className="w-3.5 h-3.5" /> Hidden from visitors
      </div>
      <div className="opacity-40 pointer-events-none">{children}</div>
    </div>
  );
}
