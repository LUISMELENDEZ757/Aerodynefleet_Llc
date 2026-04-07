import { useState } from 'react';
import { FileText, Clock, User, ChevronDown, ChevronRight, Lock } from 'lucide-react';

const ACTION_COLORS = {
  release_issued:        'text-emerald-400 bg-emerald-900/30 border-emerald-700/40',
  release_amended:       'text-amber-400  bg-amber-900/30  border-amber-700/40',
  weather_update:        'text-sky-400    bg-sky-900/30    border-sky-700/40',
  crew_notification:     'text-purple-400 bg-purple-900/30 border-purple-700/40',
  fuel_request:          'text-orange-400 bg-orange-900/30 border-orange-700/40',
  diversion_authorized:  'text-rose-400   bg-rose-900/30   border-rose-700/40',
  notam_added:           'text-blue-400   bg-blue-900/30   border-blue-700/40',
  release_accepted:      'text-teal-400   bg-teal-900/30   border-teal-700/40',
};

const MOCK_LOG = [
  { id: 1, type: 'release_issued',    time: '22:48Z', user: 'S. Mitchell / D-4471', detail: 'Initial release issued. FOB 74.5 klbs. ETOPS-330 approved.' },
  { id: 2, type: 'crew_notification', time: '22:51Z', user: 'S. Mitchell / D-4471', detail: 'PDC sent via ACARS. ATIS Info Bravo confirmed by crew.' },
  { id: 3, type: 'weather_update',    time: '23:04Z', user: 'S. Mitchell / D-4471', detail: 'CDG TAF updated — TSRA VC. Alternate BRU confirmed serviceable.' },
  { id: 4, type: 'release_amended',   time: '23:09Z', user: 'S. Mitchell / D-4471', detail: 'Amendment 1: Extra fuel +1.5 klbs added for CDG convective activity.' },
  { id: 5, type: 'fuel_request',      time: '23:11Z', user: 'S. Mitchell / D-4471', detail: 'Gate agent notified of revised FOB 76.0 klbs. Uplift confirmed.' },
  { id: 6, type: 'release_accepted',  time: '23:18Z', user: 'Capt. J. Harrison',    detail: 'PIC accepted release. Signature obtained. Ready for departure.' },
];

function LogEntry({ entry }) {
  const [expanded, setExpanded] = useState(false);
  const colorCls = ACTION_COLORS[entry.type] || 'text-slate-400 bg-slate-800 border-slate-700';
  const label = entry.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="flex gap-3">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div className={`w-2.5 h-2.5 rounded-full border-2 mt-1 flex-shrink-0 ${colorCls.split(' ')[0].replace('text-', 'border-').replace('400', '500')} bg-slate-950`} />
        <div className="w-px flex-1 bg-slate-800 mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <button onClick={() => setExpanded(v => !v)} className="w-full text-left">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${colorCls}`}>{label}</span>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                <Clock className="w-2.5 h-2.5" />{entry.time}
                <User className="w-2.5 h-2.5 ml-1" />{entry.user}
              </p>
            </div>
            {expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-600 mt-1 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-600 mt-1 flex-shrink-0" />}
          </div>
          {!expanded && <p className="text-[11px] text-slate-500 mt-1 truncate">{entry.detail}</p>}
        </button>
        {expanded && (
          <div className="mt-2 rounded-lg bg-slate-950 border border-slate-800 px-3 py-2">
            <p className="text-xs text-slate-300">{entry.detail}</p>
            <p className="text-[9px] text-slate-600 mt-1.5 flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Immutable record — hash verified</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DispatchAuditTrail({ flight }) {
  const [filter, setFilter] = useState('all');

  const types = ['all', 'release_issued', 'release_amended', 'weather_update', 'crew_notification', 'fuel_request'];
  const filtered = filter === 'all' ? MOCK_LOG : MOCK_LOG.filter(e => e.type === filter);

  return (
    <div className="space-y-4 mt-3">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3">
        <FileText className="w-5 h-5 text-slate-400" />
        <div>
          <p className="text-sm font-bold text-slate-100">Dispatch Action Logbook</p>
          <p className="text-[11px] text-slate-400">{flight.flightNumber} · {MOCK_LOG.length} entries · Immutable record per FAA Order 7200.1</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] text-emerald-400 font-bold">Verified</span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-1.5">
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${filter === t ? 'bg-primary text-primary-foreground' : 'bg-slate-800 text-slate-400 hover:text-slate-300'}`}>
            {t === 'all' ? 'All' : t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {filtered.map(e => <LogEntry key={e.id} entry={e} />)}
      </div>

      {/* Export */}
      <div className="flex gap-2 border-t border-slate-800 pt-3">
        <button className="flex-1 rounded-lg bg-slate-800 text-slate-300 py-2 text-xs font-bold hover:bg-slate-700 transition-all">
          Export PDF Log
        </button>
        <button className="flex-1 rounded-lg bg-slate-800 text-slate-300 py-2 text-xs font-bold hover:bg-slate-700 transition-all">
          Export CSV
        </button>
      </div>
    </div>
  );
}