import { useState, useRef } from 'react';
import { Upload, Loader2, Check } from 'lucide-react';

// Reusable file uploader. Calls onUploaded(publicUrl) when done.
export default function Uploader({ onUploaded, accept = 'image/*', label = 'Upload', compact = false }) {
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef(null);

  const handle = (file) => {
    if (!file) return;
    setErr(''); setOk(false); setBusy(true);
    const reader = new FileReader();
    reader.onerror = () => { setErr('Read failed'); setBusy(false); };
    reader.onload = async () => {
      try {
        const base64 = String(reader.result).split(',')[1];
        const res = await fetch('/api/auth?action=upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileBase64: base64, contentType: file.type }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setOk(true);
          onUploaded(data.url);
          setTimeout(() => setOk(false), 2000);
        } else {
          setErr(data.error || 'Upload failed');
        }
      } catch (e) {
        setErr('Network error');
      } finally {
        setBusy(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={compact ? 'inline-flex' : 'block'}>
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => handle(e.target.files?.[0])} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wide border-2 transition-colors disabled:opacity-50 ${
          ok ? 'border-emerald-500 text-emerald-600' : 'border-charcoal/20 text-charcoal/70 hover:border-heritage hover:text-heritage'
        }`}>
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : ok ? <Check className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
        {busy ? 'Uploading...' : ok ? 'Uploaded' : label}
      </button>
      {err && <span className="text-red-500 text-xs ml-2">{err}</span>}
    </div>
  );
}
