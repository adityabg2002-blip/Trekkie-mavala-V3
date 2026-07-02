import { Compass } from 'lucide-react';
import { tr } from '../lib/i18n';

export default function EmptyState({ isMr }) {
  return (
    <div className="border-2 border-dashed border-charcoal/30 bg-cream-dark/40 py-16 px-8 text-center">
      <Compass className="w-10 h-10 mx-auto text-heritage/60 mb-4" />
      <p className={`text-charcoal/70 font-medium max-w-md mx-auto ${isMr ? 'font-marathi' : 'font-cormorant text-lg italic'}`}>
        {tr('emptyState', isMr)}
      </p>
    </div>
  );
}
