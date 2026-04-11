import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Monitor, Plus, Pencil, Trash2, Save, X, ChevronLeft, Eye, GripVertical, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Screensaver from '@/components/screensaver/Screensaver';

const CATEGORIES = ['safety','engine','hydraulics','avionics','flight_controls','apu','fuel','emergency','regulatory','general'];
const ACCENT_PRESETS = ['#f59e0b','#ef4444','#3b82f6','#8b5cf6','#10b981','#f97316','#06b6d4','#ec4899','#84cc16','#ffffff'];

const BLANK = {
  title: '', subtitle: '', narration: '', category: 'safety',
  ata_chapter: '', accent_color: '#f59e0b', duration_seconds: 8,
  image_url: '', is_active: true, order: 0,
};

function SlideForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="bg-[#111827] border border-primary/30 rounded-2xl p-5 space-y-4">
      <p className="text-sm font-extrabold text-primary">{initial.id ? 'Edit Slide' : 'New Slide'}</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Title *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="e.g. Engine Oil System — ATA 79"
            className="input" />
        </div>
        <div>
          <label className="label">Subtitle</label>
          <input value={form.subtitle} onChange={e => set('subtitle', e.target.value)}
            placeholder="e.g. CFM56-7B Series" className="input" />
        </div>
        <div>
          <label className="label">ATA Chapter</label>
          <input value={form.ata_chapter} onChange={e => set('ata_chapter', e.target.value)}
            placeholder="e.g. 79" className="input" />
        </div>
        <div>
          <label className="label">Category</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} className="input">
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Duration (seconds)</label>
          <input type="number" min="3" max="60" value={form.duration_seconds}
            onChange={e => set('duration_seconds', +e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Display Order</label>
          <input type="number" min="0" value={form.order}
            onChange={e => set('order', +e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Background Image URL</label>
          <input value={form.image_url} onChange={e => set('image_url', e.target.value)}
            placeholder="https://…" className="input" />
        </div>

        {/* Accent color picker */}
        <div className="col-span-2">
          <label className="label">Accent Color</label>
          <div className="flex items-center gap-2 flex-wrap">
            {ACCENT_PRESETS.map(c => (
              <button key={c} type="button" onClick={() => set('accent_color', c)}
                className="w-7 h-7 rounded-lg border-2 transition-all"
                style={{ background: c, borderColor: form.accent_color === c ? '#fff' : 'transparent' }} />
            ))}
            <input type="color" value={form.accent_color} onChange={e => set('accent_color', e.target.value)}
              className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border border-white/20" />
            <span className="text-xs font-mono text-gray-400">{form.accent_color}</span>
          </div>
        </div>

        {/* Narration textarea */}
        <div className="col-span-2">
          <label className="label">Narration Text *</label>
          <textarea value={form.narration} onChange={e => set('narration', e.target.value)}
            rows={5} placeholder="Full narration body — this text is also read aloud via text-to-speech."
            className="input resize-none" />
        </div>

        <div className="col-span-2 flex items-center gap-3">
          <button type="button" onClick={() => set('is_active', !form.is_active)}
            className="flex items-center gap-2 text-sm font-bold">
            {form.is_active
              ? <ToggleRight className="w-6 h-6 text-primary" />
              : <ToggleLeft className="w-6 h-6 text-gray-500" />}
            <span className={form.is_active ? 'text-primary' : 'text-gray-500'}>
              {form.is_active ? 'Active — included in rotation' : 'Inactive — hidden from screensaver'}
            </span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(form)} disabled={!form.title || !form.narration}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors">
          <Save className="w-3.5 h-3.5" /> Save Slide
        </button>
        <button onClick={onCancel}
          className="flex items-center gap-2 px-5 py-2 rounded-xl border border-white/10 text-gray-400 text-sm font-bold hover:bg-white/5 transition-colors">
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </div>
  );
}

export default function ScreensaverAdmin() {
  const qc = useQueryClient();
  const [form, setForm] = useState(null);
  const [preview, setPreview] = useState(false);

  const { data: slides = [] } = useQuery({
    queryKey: ['screensaver-slides'],
    queryFn: () => base44.entities.ScreensaverSlide.list('order', 200),
  });

  const save = useMutation({
    mutationFn: d => d.id
      ? base44.entities.ScreensaverSlide.update(d.id, d)
      : base44.entities.ScreensaverSlide.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['screensaver-slides'] }); setForm(null); },
  });

  const del = useMutation({
    mutationFn: id => base44.entities.ScreensaverSlide.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['screensaver-slides'] }),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.ScreensaverSlide.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['screensaver-slides'] }),
  });

  const sorted = [...slides].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const activeCount = slides.filter(s => s.is_active).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      {preview && <Screensaver onDismiss={() => setPreview(false)} />}

      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors">
              <ChevronLeft className="w-5 h-5 text-primary" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground">Screensaver Editor</h1>
              <p className="text-xs text-muted-foreground">{activeCount} active slides · Safety & Systems Narration</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPreview(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button onClick={() => setForm({ ...BLANK, order: slides.length })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> New Slide
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 pt-6 space-y-5">
        {/* Info banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-2xl px-5 py-4">
          <p className="text-sm font-bold text-primary mb-1">How the Screensaver Works</p>
          <p className="text-xs text-muted-foreground">
            The screensaver activates after <strong className="text-foreground">5 minutes of inactivity</strong> anywhere in the app.
            Slides auto-advance per their duration setting and narration is read aloud via text-to-speech.
            Add your own safety briefings, regulatory reminders, or aircraft systems lessons below.
            If no custom slides are saved, the built-in defaults will show.
          </p>
        </div>

        {/* New / Edit form */}
        {form !== null && (
          <SlideForm
            initial={form}
            onSave={d => save.mutate(d)}
            onCancel={() => setForm(null)}
          />
        )}

        {/* Slides list */}
        {sorted.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border py-16 text-center space-y-3">
            <Monitor className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="font-extrabold text-muted-foreground">No custom slides yet</p>
            <p className="text-sm text-muted-foreground/70">The built-in default slides are currently showing. Add a slide to customize the rotation.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((slide, i) => (
              <div key={slide.id}
                className={cn('bg-card border rounded-2xl overflow-hidden transition-all', slide.is_active ? 'border-border' : 'border-border opacity-60')}>
                <div className="flex items-start gap-4 px-5 py-4">
                  {/* Color accent strip */}
                  <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: slide.accent_color || '#f59e0b' }} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">#{i + 1}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">
                        {slide.category?.replace(/_/g,' ')}
                        {slide.ata_chapter ? ` · ATA ${slide.ata_chapter}` : ''}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{slide.duration_seconds || 8}s</span>
                      {!slide.is_active && <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">Hidden</span>}
                    </div>
                    <p className="text-sm font-bold text-foreground truncate">{slide.title}</p>
                    {slide.subtitle && <p className="text-xs text-muted-foreground">{slide.subtitle}</p>}
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{slide.narration}</p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => toggleActive.mutate({ id: slide.id, is_active: !slide.is_active })}
                      className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors" title="Toggle active">
                      {slide.is_active
                        ? <ToggleRight className="w-4 h-4 text-primary" />
                        : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <button onClick={() => setForm(slide)}
                      className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => del.mutate(slide.id)}
                      className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tailwind class injection for dynamic label/input */}
      <style>{`
        .label { display: block; font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
        .input { width: 100%; background: #0d1423; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 12px; font-size: 13px; color: white; outline: none; transition: border-color 0.15s; }
        .input:focus { border-color: hsl(var(--primary) / 0.5); }
        .input option { background: #0d1423; }
      `}</style>
    </div>
  );
}