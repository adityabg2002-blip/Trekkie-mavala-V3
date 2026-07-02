import { tr } from '../lib/i18n';
import TrekCard from '../components/TrekCard';
import EmptyState from '../components/EmptyState';
import { AddButton, InlineEdit } from '../components/EditButton';
import useReveal from '../lib/useReveal';

export default function Treks({ isMr, treks, onBook, onEditEntity, onEditText, refresh }) {
  useReveal([isMr, treks.length]);
  const del = async (id) => {
    if (!confirm('Delete this trek?')) return;
    await fetch('/api/treks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    refresh();
  };

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-16">
      <div className="text-center mb-6">
        <div className="w-14 h-0.5 bg-heritage mx-auto mb-4" />
        <h1 className={`text-charcoal ${isMr ? 'font-marathi text-3xl' : 'font-serif text-4xl md:text-6xl'}`}>{tr('activeExpeditions', isMr)}<InlineEdit contentKey="activeExpeditions" onEdit={onEditText} /></h1>
        <p className={`text-charcoal/50 mt-3 ${isMr ? 'font-marathi' : 'font-cormorant text-xl italic'}`}>{tr('treksIntro', isMr)}<InlineEdit contentKey="treksIntro" onEdit={onEditText} /></p>
      </div>
      <div className="flex justify-center mb-8">
        <AddButton onClick={() => onEditEntity('trek', null)} label={tr('addTrek', isMr)} />
      </div>
      {treks.length ? (
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3 stagger">
          {treks.map((t, i) => (
            <div key={t.id} style={{ '--i': i % 3 }} className="reveal">
              <TrekCard trek={t} isMr={isMr} onBook={onBook} onEdit={() => onEditEntity('trek', t)} onDelete={() => del(t.id)} />
            </div>
          ))}
        </div>
      ) : <EmptyState isMr={isMr} />}
    </div>
  );
}
