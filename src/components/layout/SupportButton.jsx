import { useState, useRef, useEffect } from 'react';
import { HelpCircle, Mail, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SupportButton() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '' });
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSend = () => {
    if (!form.message.trim()) return;
    const mailto = `mailto:luismelendez757@yahoo.com?subject=${encodeURIComponent(form.subject || 'Support Request')}&body=${encodeURIComponent(form.message)}`;
    window.open(mailto);
    setSent(true);
    setTimeout(() => { setSent(false); setOpen(false); setForm({ subject: '', message: '' }); }, 2000);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Feedback & Support"
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
          open ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
        )}
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/40">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <p className="text-sm font-extrabold text-foreground">Feedback & Support</p>
            </div>
            <button onClick={() => setOpen(false)} className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {sent ? (
            <div className="px-4 py-6 text-center text-sm font-bold text-green-400">
              ✓ Opening email client…
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <input
                type="text"
                placeholder="Subject (optional)"
                value={form.subject}
                onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
              />
              <textarea
                rows={4}
                placeholder="Describe your issue or feedback…"
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors resize-none"
              />
              <button
                onClick={handleSend}
                disabled={!form.message.trim()}
                className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                Send via Email
              </button>
              <p className="text-[10px] text-muted-foreground text-center">
                Sends to luismelendez757@yahoo.com
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}