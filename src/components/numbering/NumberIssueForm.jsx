import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  ATA_CHAPTERS, SUB_GROUPS_BY_ATA, CLASS_CODES, DOC_TYPES,
  TRACE_CATEGORIES, TRACE_TYPES, HISTORY_EVENTS, SCRAP_REASONS,
  buildNumber, buildCounterKey,
} from '../../../base44/shared/meNumbering';
import { cn } from '@/lib/utils';
import { Copy, RefreshCw, Send, CheckCircle } from 'lucide-react';

const NUMBER_TYPES = [
  { id: 'me_part',     label: 'M&E Part',     hint: 'ATA-Sub-Class-Seq' },
  { id: 'tooling',     label: 'Tooling',      hint: 'TL-ATA-Class-Seq' },
  { id: 'document',    label: 'Document',     hint: 'Type-ATA-Seq-Rev' },
  { id: 'traceability',label: 'Traceability', hint: 'DOC-CAT-ATA-Seq-Type-Rev' },
  { id: 'work_order',  label: 'Work Order',   hint: 'WO-Tail-Date-ATA-Seq' },
  { id: 'history',     label: 'History',      hint: 'HIS-ATA-Class-Seq-Event' },
  { id: 'scrap',       label: 'Scrap / BER',  hint: 'SCR-ATA-Class-Seq-Reason' },
  { id: 'pool',        label: 'Pool',         hint: 'POOL-ATA-Class-Seq-Loc' },
];

export default function NumberIssueForm() {
  const [type, setType] = useState('me_part');
  const [ata, setAta] = useState('72');
  const [sub, setSub] = useState('000');
  const [cls, setCls] = useState('9');
  const [docType, setDocType] = useState('EO');
  const [rev, setRev] = useState(1);
  const [category, setCategory] = useState('CMP');
  const [traceType, setTraceType] = useState('8130');
  const [tail, setTail] = useState('N12345');
  const [workDate, setWorkDate] = useState(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
  const [reason, setReason] = useState('BER');
  const [event, setEvent] = useState('INSTALL');
  const [location, setLocation] = useState('EWR');
  const [issued, setIssued] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Live preview
  const previewReq = { number_type: type, ata, sub, class_code: cls, doc_type: docType, category, trace_type: traceType, tail, work_date: workDate, reason, event, location, rev };
  const previewKey = buildCounterKey(previewReq);
  const previewNum = buildNumber(previewReq, 1);

  const issue = async () => {
    setLoading(true); setError(null); setIssued(null);
    try {
      const res = await base44.functions.invoke('meIssueNumber', previewReq);
      setIssued(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Issue failed');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const subGroups = SUB_GROUPS_BY_ATA[ata] || [];
  const showAta = ['me_part', 'tooling', 'document', 'work_order', 'history', 'scrap', 'pool'].includes(type);
  const showSub = type === 'me_part';
  const showClass = ['me_part', 'tooling', 'history', 'scrap', 'pool'].includes(type);
  const showDocType = type === 'document';
  const showRev = ['document', 'traceability'].includes(type);
  const showTrace = type === 'traceability';
  const showWO = type === 'work_order';
  const showHistory = type === 'history';
  const showScrap = type === 'scrap';
  const showPool = type === 'pool';

  const field = 'bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:border-primary';

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {NUMBER_TYPES.map(t => (
          <button key={t.id} onClick={() => { setType(t.id); setIssued(null); }}
            className={cn('rounded-xl border px-3 py-2.5 text-left transition-all',
              type === t.id ? 'bg-amber-500/15 border-amber-500/50' : 'bg-[#1a1f2e] border-white/10 hover:border-white/20')}>
            <p className={cn('text-xs font-extrabold', type === t.id ? 'text-amber-400' : 'text-white')}>{t.label}</p>
            <p className="text-[9px] text-gray-500 font-mono mt-0.5">{t.hint}</p>
          </button>
        ))}
      </div>

      {/* Dynamic fields */}
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {showAta && (
            <Field label="ATA Chapter">
              <select value={ata} onChange={e => setAta(e.target.value)} className={field}>
                {ATA_CHAPTERS.map(a => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
              </select>
            </Field>
          )}
          {showSub && (
            <Field label="Sub-Group">
              <select value={sub} onChange={e => setSub(e.target.value)} className={field}>
                {subGroups.length > 0 ? subGroups.map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>) : <option value="000">000 — Generic</option>}
              </select>
            </Field>
          )}
          {showClass && (
            <Field label="Class Code">
              <select value={cls} onChange={e => setCls(e.target.value)} className={field}>
                {Object.entries(CLASS_CODES).map(([c, n]) => <option key={c} value={c}>{c} — {n}</option>)}
              </select>
            </Field>
          )}
          {showDocType && (
            <Field label="Doc Type">
              <select value={docType} onChange={e => setDocType(e.target.value)} className={field}>
                {DOC_TYPES.map(d => <option key={d.code} value={d.code}>{d.code} — {d.name}</option>)}
              </select>
            </Field>
          )}
          {showTrace && (
            <>
              <Field label="Category">
                <select value={category} onChange={e => setCategory(e.target.value)} className={field}>
                  {TRACE_CATEGORIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                </select>
              </Field>
              <Field label="Trace Type">
                <select value={traceType} onChange={e => setTraceType(e.target.value)} className={field}>
                  {TRACE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            </>
          )}
          {showWO && (
            <>
              <Field label="Tail Number"><input value={tail} onChange={e => setTail(e.target.value.toUpperCase())} className={field} /></Field>
              <Field label="Work Date (YYYYMMDD)"><input value={workDate} onChange={e => setWorkDate(e.target.value)} className={field} /></Field>
            </>
          )}
          {showHistory && (
            <Field label="Event">
              <select value={event} onChange={e => setEvent(e.target.value)} className={field}>
                {HISTORY_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
              </select>
            </Field>
          )}
          {showScrap && (
            <Field label="Reason">
              <select value={reason} onChange={e => setReason(e.target.value)} className={field}>
                {SCRAP_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          )}
          {showPool && (
            <Field label="Location (ICAO)"><input value={location} onChange={e => setLocation(e.target.value.toUpperCase())} className={field} /></Field>
          )}
          {showRev && (
            <Field label="Revision"><input type="number" min={0} value={rev} onChange={e => setRev(Number(e.target.value))} className={field} /></Field>
          )}
        </div>
      </div>

      {/* Preview + issue */}
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Preview (next slot)</p>
            <p className="text-xl font-black font-mono text-primary mt-1">{previewNum}</p>
            <p className="text-[10px] text-gray-600 font-mono mt-1">key: {previewKey}</p>
          </div>
          <button onClick={issue} disabled={loading} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black text-sm font-extrabold hover:bg-amber-400 disabled:opacity-50 transition-colors">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Issue Number
          </button>
        </div>

        {error && <p className="text-xs text-red-400 bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">{error}</p>}

        {issued && (
          <div className="bg-emerald-900/20 border border-emerald-500/40 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Number Issued</p>
                  <p className="text-2xl font-black font-mono text-white mt-0.5">{issued.number}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => copy(issued.number)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-xs font-bold text-white hover:bg-white/20">
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-[10px] font-mono">
              <Meta label="Seq" value={String(issued.seq)} />
              <Meta label="Type" value={issued.number_type} />
              <Meta label="Key" value={issued.counter_key} />
              <Meta label="By" value={issued.issued_by} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
function Meta({ label, value }) {
  return (
    <div className="bg-[#0d1117] border border-white/8 rounded-lg px-2 py-1.5">
      <p className="text-gray-600">{label}</p>
      <p className="text-white truncate">{value}</p>
    </div>
  );
}