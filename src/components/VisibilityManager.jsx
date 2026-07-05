import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { VISIBILITY_GROUPS } from '../lib/i18n';

// Lets the admin show/hide sections & elements across the whole site.
// State is stored in site_content with content_type='visibility' (value 'show'|'hide').
export default function VisibilityManager({ content, refresh }) {
  const [saving, setSaving] = useState('');

  const cmap = {};
  content.forEach((c) => { if (c.content_type === 'visibility') cmap[c.content_key] = c.value_en; });
  const isShown = (key) => (cmap[key] || 'show') !== 'hide';

  const toggle = async (key) => {
    setSaving(key);
    const next = isShown(key) ? 'hide' : 'show';
    try {
      await fetch('/api/data?resource=site-content', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_key: key, value_en: next, value_mr: next, content_type: 'visibility' }),
      });
      await refresh();
    } finally { setSaving(''); }
  };

  return (
    <div>
      <h3 className="font-bold text-charcoal mb-1">Show / Hide Sections</h3>
      <p className="text-xs text-charcoal/50 mb-5">Toggle any element off to instantly hide it from visitors. You can turn it back on anytime — nothing is deleted.</p>

      <div className="space-y-6">
        {VISIBILITY_GROUPS.map((grp) => (
          <div key={grp.label}>
            <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-heritage mb-2">{grp.label}</div>
            <div className="space-y-2">
              {grp.items.map((item) => {
                const shown = isShown(item.key);
                return (
                  <div key={item.key} className={`flex items-center justify-between gap-4 border p-3 transition-colors ${shown ? 'border-charcoal/10 bg-white' : 'border-charcoal/10 bg-charcoal/[0.03]'}`}>
                    <div className="min-w-0">
                      <div className={`font-semibold text-sm ${shown ? 'text-charcoal' : 'text-charcoal/40'}`}>{item.label}</div>
                      <div className="text-[11px] text-charcoal/45">{item.desc}</div>
                    </div>
                    <button onClick={() => toggle(item.key)} disabled={saving === item.key}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wide border-2 transition-colors disabled:opacity-50 ${
                        shown ? 'border-emerald-500 text-emerald-600 hover:bg-emerald-50' : 'border-charcoal/25 text-charcoal/50 hover:border-heritage hover:text-heritage'
                      }`}>
                      {saving === item.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : shown ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {shown ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
