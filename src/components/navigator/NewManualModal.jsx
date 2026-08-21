import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAutoMeNumber } from '@/hooks/useAutoMeNumber';
import { issueMeNumber } from '@/lib/meNumberingClient';
import { DOC_TYPES, ATA_CHAPTERS } from '../../../base44/shared/meNumbering';
import { CAT_CFG } from './navConfig';

const inputCls =
  'w-full h-9 bg-white/[0.04] border border-white/10 rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary';
const areaCls =
  'w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none';

export default function NewManualModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    title: '', category: 'sop', document_number: '', revision: '1', effective_date: '',
    doc_type: 'SOP', ata_chapter: '21',
    summary: '', content: '', tags: '',
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const { autoGen, setAutoGen, issuing } = useAutoMeNumber(true);

  const handleSave = async () => {
    const tags = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    const payload = { ...form, tags, is_active: true };
    if (autoGen && !form.document_number.trim() && form.doc_type) {
      const revNum = form.revision ? Number(String(form.revision).replace(/[^0-9]/g, '') || 1) : 1;
      const num = await issueMeNumber({ number_type: 'document', doc_type: form.doc_type, ata: form.ata_chapter, rev: revNum });
      if (!num) return;
      payload.document_number = num;
    }
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-card border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-5 space-y-3 max-h-[85vh] overflow-y-auto backdrop-blur-xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">Add Manual / Document</p>
          <span className="text-[10px] font-mono text-primary tracking-widest uppercase">Navigator Ingest</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">Title</label>
            <input value={form.title} onChange={(e) => set('title', e.target.value)} className={cn(inputCls, 'mt-1')} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Category</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className={cn(inputCls, 'mt-1')}>
              {Object.entries(CAT_CFG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">M&E Doc Number</label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={autoGen} onChange={(e) => setAutoGen(e.target.checked)} className="w-3.5 h-3.5 accent-primary" />
                <span className="text-[9px] font-bold text-primary uppercase">Auto-gen</span>
              </label>
            </div>
            <input
              value={autoGen ? '' : form.document_number}
              disabled={autoGen}
              onChange={(e) => set('document_number', e.target.value)}
              placeholder={autoGen ? `${form.doc_type}-${form.ata_chapter || 'NN'}-XXXX-Rev ${form.revision || 1}` : 'Doc number'}
              className={cn(inputCls, 'font-mono disabled:opacity-60')}
            />
            {autoGen && (
              <div className="grid grid-cols-2 gap-2">
                <select value={form.doc_type} onChange={(e) => set('doc_type', e.target.value)} className={cn(inputCls, 'text-xs')}>
                  {DOC_TYPES.map((d) => (
                    <option key={d.code} value={d.code}>{d.code} — {d.name}</option>
                  ))}
                </select>
                <select value={form.ata_chapter} onChange={(e) => set('ata_chapter', e.target.value)} className={cn(inputCls, 'text-xs')}>
                  {ATA_CHAPTERS.map((a) => (
                    <option key={a.code} value={a.code}>{a.code} — {a.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Revision</label>
            <input value={form.revision} onChange={(e) => set('revision', e.target.value)} className={cn(inputCls, 'mt-1')} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Effective Date</label>
            <input type="date" value={form.effective_date} onChange={(e) => set('effective_date', e.target.value)} className={cn(inputCls, 'mt-1')} />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Summary</label>
          <textarea value={form.summary} onChange={(e) => set('summary', e.target.value)} rows={2} className={cn(areaCls, 'mt-1')} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Content / Key Excerpts</label>
          <textarea value={form.content} onChange={(e) => set('content', e.target.value)} rows={4} className={cn(areaCls, 'mt-1')} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Tags (comma-separated)</label>
          <input
            value={form.tags}
            onChange={(e) => set('tags', e.target.value)}
            placeholder="e.g. far117, crew, duty-time, N455GJ"
            className={cn(inputCls, 'mt-1')}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={issuing || !form.title}
            className="flex-1 h-10 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            {issuing ? 'Allocating…' : 'Add Document'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-10 border border-white/10 text-sm font-semibold text-muted-foreground rounded-lg hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}