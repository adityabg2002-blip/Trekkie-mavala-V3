import { Pencil, Trash2, Plus, Pin, PinOff } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';

// Small floating admin action buttons. Only render when logged in as admin.
export function AdminOnly({ children }) {
  const { isAdmin } = useAdmin();
  if (!isAdmin) return null;
  return children;
}

export function EditBadge({ onEdit, onDelete, onPin, pinned, label = 'Edit' }) {
  const { isAdmin } = useAdmin();
  if (!isAdmin) return null;
  return (
    <div className="absolute top-2 right-2 z-20 flex gap-1.5">
      {onPin && (
        <button onClick={(e) => { e.stopPropagation(); onPin(); }} title={pinned ? 'Unpin' : 'Pin'}
          className={`grid place-items-center w-8 h-8 shadow-lg transition-colors ${pinned ? 'bg-amber text-charcoal' : 'bg-charcoal/90 text-cream hover:bg-heritage'}`}>
          {pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
        </button>
      )}
      {onEdit && (
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} title={label}
          className="grid place-items-center w-8 h-8 bg-charcoal/90 text-cream shadow-lg hover:bg-heritage transition-colors">
          <Pencil className="w-4 h-4" />
        </button>
      )}
      {onDelete && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete"
          className="grid place-items-center w-8 h-8 bg-red-600/90 text-white shadow-lg hover:bg-red-700 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Inline edit pencil for text blocks (headings, paragraphs)
export function InlineEdit({ contentKey, onEdit }) {
  const { isAdmin } = useAdmin();
  if (!isAdmin) return null;
  return (
    <button onClick={(e) => { e.stopPropagation(); onEdit(contentKey); }} title={`Edit: ${contentKey}`}
      className="inline-grid place-items-center w-6 h-6 ml-2 align-middle bg-heritage/15 text-heritage hover:bg-heritage hover:text-white transition-colors rounded-sm">
      <Pencil className="w-3 h-3" />
    </button>
  );
}

export function AddButton({ onClick, label }) {
  const { isAdmin } = useAdmin();
  if (!isAdmin) return null;
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 px-4 py-2 bg-heritage text-white text-xs font-bold uppercase tracking-wide hover:bg-heritage-dark transition-colors">
      <Plus className="w-4 h-4" /> {label}
    </button>
  );
}
