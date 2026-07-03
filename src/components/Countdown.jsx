import { useEffect, useState } from 'react';
import { tr } from '../lib/i18n';

function diff(target) {
  const t = new Date(target).getTime() - Date.now();
  if (isNaN(t) || t < 0) return { d: 0, h: 0, m: 0, s: 0 };
  return {
    d: Math.floor(t / 86400000),
    h: Math.floor((t / 3600000) % 24),
    m: Math.floor((t / 60000) % 60),
    s: Math.floor((t / 1000) % 60),
  };
}

export default function Countdown({ target, isMr }) {
  const [c, setC] = useState(diff(target));
  useEffect(() => {
    const id = setInterval(() => setC(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const cells = [
    { v: c.d, label: tr('days', isMr) },
    { v: c.h, label: tr('hours', isMr) },
    { v: c.m, label: tr('mins', isMr) },
    { v: c.s, label: tr('secs', isMr) },
  ];

  return (
    <div className="bg-charcoal py-14 px-5 paper-grain">
      <div className="mx-auto max-w-4xl text-center">
        <p className={`text-heritage text-[11px] md:text-xs font-bold tracking-[0.35em] uppercase mb-8 ${isMr ? 'font-marathi tracking-widest' : ''}`}>
          {tr('countdownTitle', isMr)}
        </p>
        <div className="grid grid-cols-4 gap-3 md:gap-5">
          {cells.map((cell, i) => (
            <div key={i} className="border border-white/15 bg-white/[0.03] py-5 md:py-8 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-heritage/50" />
              <div className="font-serif text-4xl md:text-6xl font-bold text-cream tabular-nums">
                {String(cell.v).padStart(2, '0')}
              </div>
              <div className={`text-[10px] md:text-xs text-cream/50 tracking-[0.25em] uppercase mt-2 ${isMr ? 'font-marathi' : ''}`}>{cell.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
