import { useState, useRef } from 'react';
import { UploadCloud, Loader2, Check, AlertCircle, Film, Image as ImageIcon } from 'lucide-react';

// Uploads many files (images + videos) in sequence. Calls onUploaded(item) per file.
// item = { url, media_type }
export default function MultiUploader({ onUploaded, onAllDone }) {
  const [queue, setQueue] = useState([]); // {name, status: 'pending'|'uploading'|'done'|'error', type}
  const inputRef = useRef(null);

  const uploadOne = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onerror = () => resolve({ error: 'read failed' });
      reader.onload = async () => {
        try {
          const base64 = String(reader.result).split(',')[1];
          const res = await fetch('/api/auth?action=upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: file.name, fileBase64: base64, contentType: file.type }),
          });
          const data = await res.json();
          if (res.ok && data.url) resolve({ url: data.url, media_type: file.type.startsWith('video') ? 'video' : 'image' });
          else resolve({ error: data.error || 'upload failed' });
        } catch {
          resolve({ error: 'network error' });
        }
      };
      reader.readAsDataURL(file);
    });

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const initial = files.map((f) => ({ name: f.name, status: 'pending', type: f.type.startsWith('video') ? 'video' : 'image' }));
    setQueue(initial);

    for (let i = 0; i < files.length; i++) {
      setQueue((q) => q.map((item, idx) => (idx === i ? { ...item, status: 'uploading' } : item)));
      const result = await uploadOne(files[i]);
      if (result.error) {
        setQueue((q) => q.map((item, idx) => (idx === i ? { ...item, status: 'error' } : item)));
      } else {
        setQueue((q) => q.map((item, idx) => (idx === i ? { ...item, status: 'done' } : item)));
        onUploaded && onUploaded(result);
      }
    }
    onAllDone && onAllDone();
    // Clear the queue display after a short delay
    setTimeout(() => setQueue([]), 2500);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*,video/*" multiple className="hidden"
        onChange={(e) => handleFiles(e.target.files)} />
      <button type="button" onClick={() => inputRef.current?.click()}
        className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-charcoal/25 hover:border-heritage bg-cream-dark/30 py-8 px-4 transition-colors group">
        <UploadCloud className="w-8 h-8 text-heritage group-hover:scale-110 transition-transform" />
        <span className="text-sm font-bold text-charcoal uppercase tracking-wide">Upload Photos & Videos</span>
        <span className="text-xs text-charcoal/50">Select multiple files at once — unlimited images & videos</span>
      </button>

      {queue.length > 0 && (
        <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto">
          {queue.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs bg-white border border-charcoal/10 px-3 py-1.5">
              {item.type === 'video' ? <Film className="w-3.5 h-3.5 text-charcoal/40 shrink-0" /> : <ImageIcon className="w-3.5 h-3.5 text-charcoal/40 shrink-0" />}
              <span className="flex-1 truncate text-charcoal/70">{item.name}</span>
              {item.status === 'uploading' && <Loader2 className="w-3.5 h-3.5 text-heritage animate-spin" />}
              {item.status === 'pending' && <span className="text-charcoal/30">waiting</span>}
              {item.status === 'done' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              {item.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
