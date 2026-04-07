import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const RULES = [
  { rule: 'FAR 117.25(a)', title: 'Min Rest Before FDP', limit: '10h', description: 'Minimum rest period before a flight duty period.' },
  { rule: 'FAR 117.23',   title: 'Max FDP (Table B)',   limit: '13h', description: 'Maximum flight duty period based on acclimation and report time.' },
  { rule: 'FAR 117.27',   title: 'Max Flight Time 24h', limit: '9h',  description: 'Maximum flight time in any 24-hour period.' },
  { rule: 'FAR 117.29',   title: 'Max Flight Time 28d', limit: '100h',description: 'Maximum flight time in any 28 consecutive calendar days.' },
  { rule: 'FAR 117.31',   title: 'Max Flight Time 365d',limit: '1000h',description: 'Maximum flight time in any 365 consecutive calendar days.' },
  { rule: 'FAR 117.35',   title: 'Min Rest Period 168h', limit: '30h', description: '30 consecutive hours free from duty in each 168-hour period.' },
];

const CREW = [
  { name: 'Capt. J. Harrison', restBefore: 11.5, fdp: 8.5,  ft24: 7.5, ft28: 62,  ft365: 580, rest168: 38 },
  { name: 'F/O M. Chen',       restBefore: 10.8, fdp: 8.5,  ft24: 7.5, ft28: 78,  ft365: 720, rest168: 32 },
  { name: 'Capt. A. Nguyen',   restBefore: 14.0, fdp: 6.5,  ft24: 5.5, ft28: 44,  ft365: 410, rest168: 44 },
  { name: 'F/O T. Park',       restBefore: 12.2, fdp: 5.0,  ft24: 4.2, ft28: 55,  ft365: 510, rest168: 36 },
  { name: 'F/O R. Davis',      restBefore: 13.0, fdp: 4.5,  ft24: 3.5, ft28: 30,  ft365: 290, rest168: 50 },
  { name: 'Purser K. Williams',restBefore: 13.0, fdp: 8.5,  ft24: 7.5, ft28: 55,  ft365: 520, rest168: 40 },
  { name: 'FA B. Thompson',    restBefore: 11.0, fdp: 8.5,  ft24: 7.5, ft28: 60,  ft365: 560, rest168: 30 },
  { name: 'FA S. Patel',       restBefore: 12.5, fdp: 8.5,  ft24: 7.5, ft28: 48,  ft365: 440, rest168: 38 },
  { name: 'FA L. Brooks',      restBefore: 9.5,  fdp: 10.5, ft24: 9.2, ft28: 71,  ft365: 680, rest168: 28 },
];

const LIMITS = { restBefore: 10, fdp: 13, ft24: 9, ft28: 100, ft365: 1000, rest168: 30 };
const WARN   = { restBefore: 10.5, fdp: 12, ft24: 8, ft28: 85, ft365: 900, rest168: 32 };

function cellStatus(val, field) {
  const limit = LIMITS[field];
  const warn  = WARN[field];
  const isMin = field === 'restBefore' || field === 'rest168'; // higher = better
  if (isMin) {
    if (val < limit) return 'fail';
    if (val < warn)  return 'warn';
    return 'ok';
  }
  if (val >= limit) return 'fail';
  if (val >= warn)  return 'warn';
  return 'ok';
}

const CELL_CFG = {
  ok:   { bg: 'bg-emerald-900/20', text: 'text-emerald-300', icon: <CheckCircle className="w-3 h-3" /> },
  warn: { bg: 'bg-amber-900/20',   text: 'text-amber-300',   icon: <AlertTriangle className="w-3 h-3" /> },
  fail: { bg: 'bg-rose-900/30',    text: 'text-rose-300',    icon: <XCircle className="w-3 h-3" /> },
};

const FIELDS = [
  { key: 'restBefore', label: 'Rest Before', unit: 'h',   limit: '≥10h' },
  { key: 'fdp',        label: 'FDP',         unit: 'h',   limit: '≤13h' },
  { key: 'ft24',       label: 'FT 24h',      unit: 'h',   limit: '≤9h'  },
  { key: 'ft28',       label: 'FT 28d',      unit: 'h',   limit: '≤100h' },
  { key: 'ft365',      label: 'FT 365d',     unit: 'h',   limit: '≤1000h' },
  { key: 'rest168',    label: 'Rest 168h',   unit: 'h',   limit: '≥30h' },
];

export default function LegalityMatrix() {
  const failCount = CREW.reduce((s, c) => s + FIELDS.filter(f => cellStatus(c[f.key], f.key) === 'fail').length, 0);
  const warnCount = CREW.reduce((s, c) => s + FIELDS.filter(f => cellStatus(c[f.key], f.key) === 'warn').length, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex flex-wrap gap-3">
        <div className="rounded-xl border border-rose-700/40 bg-rose-900/20 px-4 py-2.5 flex items-center gap-2">
          <XCircle className="w-4 h-4 text-rose-400" />
          <span className="text-sm font-extrabold text-rose-300">{failCount}</span>
          <span className="text-xs text-rose-400">Violations</span>
        </div>
        <div className="rounded-xl border border-amber-700/40 bg-amber-900/20 px-4 py-2.5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-extrabold text-amber-300">{warnCount}</span>
          <span className="text-xs text-amber-400">Advisories</span>
        </div>
        <div className="rounded-xl border border-emerald-700/40 bg-emerald-900/20 px-4 py-2.5 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-extrabold text-emerald-300">{CREW.length * FIELDS.length - failCount - warnCount}</span>
          <span className="text-xs text-emerald-400">Compliant</span>
        </div>
      </div>

      {/* Matrix */}
      <div className="rounded-2xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-40">Crew Member</th>
              {FIELDS.map(f => (
                <th key={f.key} className="px-3 py-3 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{f.label}</p>
                  <p className="text-[9px] text-slate-600">{f.limit}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {CREW.map((c, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-bold text-foreground whitespace-nowrap">{c.name}</td>
                {FIELDS.map(f => {
                  const status = cellStatus(c[f.key], f.key);
                  const cfg = CELL_CFG[status];
                  return (
                    <td key={f.key} className="px-3 py-3 text-center">
                      <div className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-lg', cfg.bg)}>
                        <span className={cfg.text}>{cfg.icon}</span>
                        <span className={cn('font-mono font-bold', cfg.text)}>{c[f.key]}{f.unit}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rule reference */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <p className="text-xs font-extrabold text-foreground uppercase tracking-widest flex items-center gap-2"><Info className="w-4 h-4 text-primary" /> FAR 117 Reference</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {RULES.map(r => (
            <div key={r.rule} className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2">
              <p className="text-[9px] font-extrabold text-primary uppercase">{r.rule}</p>
              <p className="text-xs font-bold text-foreground">{r.title}</p>
              <p className="text-[10px] font-mono text-muted-foreground">Limit: {r.limit}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{r.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}