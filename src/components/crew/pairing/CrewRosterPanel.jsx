import { useState } from 'react';
import { User, Calendar, CheckCircle, AlertTriangle, XCircle, Filter, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROSTER = [
  { id:'r1', name:'Capt. J. Harrison', role:'CA', type:'flight', base:'EWR', emp:'EMP-2847', status:'active',   pairings:['PA-0401'], restHours:11.5, dutyMonth:62, vacDays:4,  quals:['B787','ETOPS-330','CAT IIIb'], reserve:false },
  { id:'r2', name:'F/O M. Chen',       role:'FO', type:'flight', base:'EWR', emp:'EMP-5531', status:'active',   pairings:['PA-0401'], restHours:10.8, dutyMonth:78, vacDays:2,  quals:['B787','B737','ETOPS-180'],     reserve:false },
  { id:'r3', name:'Capt. A. Nguyen',   role:'CA', type:'flight', base:'EWR', emp:'EMP-9981', status:'active',   pairings:['PA-0404'], restHours:14.0, dutyMonth:44, vacDays:0,  quals:['B737','CAT II'],               reserve:false },
  { id:'r4', name:'F/O T. Park',       role:'FO', type:'flight', base:'ORD', emp:'EMP-6623', status:'active',   pairings:['PA-0404'], restHours:12.2, dutyMonth:55, vacDays:0,  quals:['B737'],                        reserve:false },
  { id:'r5', name:'F/O R. Davis',      role:'FO', type:'flight', base:'EWR', emp:'EMP-7714', status:'active',   pairings:['PA-0403'], restHours:13.0, dutyMonth:30, vacDays:0,  quals:['B787','B767'],                 reserve:false },
  { id:'r6', name:'Capt. C. Davis',    role:'CA', type:'flight', base:'ORD', emp:'EMP-3345', status:'reserve',  pairings:[],          restHours:16.0, dutyMonth:12, vacDays:0,  quals:['B737','B777'],                 reserve:true },
  { id:'r7', name:'F/O J. Martinez',   role:'FO', type:'flight', base:'ORD', emp:'EMP-8821', status:'reserve',  pairings:[],          restHours:15.5, dutyMonth:8,  vacDays:0,  quals:['B737'],                        reserve:true },
  { id:'r8', name:'Purser K. Williams',role:'PS', type:'cabin',  base:'EWR', emp:'EMP-1122', status:'active',   pairings:['PA-0402'], restHours:13.0, dutyMonth:55, vacDays:3,  quals:['B787','B777','Lead FA'],       reserve:false },
  { id:'r9', name:'FA B. Thompson',    role:'FA', type:'cabin',  base:'EWR', emp:'EMP-2241', status:'active',   pairings:['PA-0402'], restHours:11.0, dutyMonth:60, vacDays:1,  quals:['B787'],                        reserve:false },
  { id:'r10',name:'FA S. Patel',       role:'FA', type:'cabin',  base:'EWR', emp:'EMP-3302', status:'active',   pairings:['PA-0402'], restHours:12.5, dutyMonth:48, vacDays:0,  quals:['B787','B737'],                 reserve:false },
  { id:'r11',name:'FA L. Brooks',      role:'FA', type:'cabin',  base:'JFK', emp:'EMP-4413', status:'sick',     pairings:[],          restHours:9.5,  dutyMonth:71, vacDays:0,  quals:['B737'],                        reserve:false },
  { id:'r12',name:'FA M. Johnson',     role:'FA', type:'cabin',  base:'EWR', emp:'EMP-5501', status:'reserve',  pairings:[],          restHours:18.0, dutyMonth:20, vacDays:0,  quals:['B787','B777'],                 reserve:true },
];

const STATUS_CFG = {
  active:  { label:'Active',   color:'text-emerald-400', bg:'bg-emerald-900/30', dot:'bg-emerald-400' },
  reserve: { label:'Reserve',  color:'text-sky-400',     bg:'bg-sky-900/30',     dot:'bg-sky-400 animate-pulse' },
  sick:    { label:'Sick',     color:'text-rose-400',    bg:'bg-rose-900/30',    dot:'bg-rose-400' },
  vac:     { label:'Vacation', color:'text-amber-400',   bg:'bg-amber-900/30',   dot:'bg-amber-400' },
};

function DutyBar({ used, limit = 100 }) {
  const pct = Math.min((used / limit) * 100, 100);
  const color = pct >= 95 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function CrewRow({ crew, onClick }) {
  const s = STATUS_CFG[crew.status] || STATUS_CFG.active;
  return (
    <tr onClick={() => onClick(crew)} className="border-b border-border hover:bg-white/5 cursor-pointer transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full flex-shrink-0', s.dot)} />
          <div>
            <p className="text-xs font-bold text-foreground">{crew.name}</p>
            <p className="text-[10px] text-muted-foreground">{crew.emp}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', crew.type === 'flight' ? 'bg-primary/10 text-primary' : 'bg-purple-900/40 text-purple-300')}>
          {crew.role}
        </span>
      </td>
      <td className="px-3 py-3 text-xs font-mono text-muted-foreground">{crew.base}</td>
      <td className="px-3 py-3">
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', s.color, s.bg)}>{s.label}</span>
      </td>
      <td className="px-3 py-3 w-28">
        <div className="space-y-0.5">
          <DutyBar used={crew.dutyMonth} limit={100} />
          <p className="text-[9px] text-muted-foreground">{crew.dutyMonth}h / 100h</p>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1">
          {crew.quals.slice(0,2).map(q => (
            <span key={q} className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{q}</span>
          ))}
          {crew.quals.length > 2 && <span className="text-[9px] text-slate-600">+{crew.quals.length - 2}</span>}
        </div>
      </td>
      <td className="px-3 py-3 text-xs text-muted-foreground">{crew.pairings.length > 0 ? crew.pairings.join(', ') : '—'}</td>
    </tr>
  );
}

function CrewDetailModal({ crew, onClose }) {
  if (!crew) return null;
  const s = STATUS_CFG[crew.status] || STATUS_CFG.active;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 pt-24 px-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl max-h-[75vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-5 py-3 flex items-center justify-between">
          <p className="font-bold text-foreground">{crew.name}</p>
          <button onClick={onClose} className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700">Close</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[['Employee #', crew.emp], ['Role', crew.role], ['Base', crew.base], ['Status', crew.status], ['Rest Available', crew.restHours + 'h'], ['Monthly Duty', crew.dutyMonth + 'h / 100h'], ['Vacation Days', crew.vacDays + ' days'], ['Reserve', crew.reserve ? 'Yes' : 'No']].map(([l,v]) => (
              <div key={l} className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{l}</p>
                <p className="text-sm font-bold text-foreground">{v}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Qualifications</p>
            <div className="flex flex-wrap gap-2">
              {crew.quals.map(q => <span key={q} className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg font-bold">{q}</span>)}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">28-Day Flight Time</p>
            <DutyBar used={crew.dutyMonth} limit={100} />
            <p className="text-xs text-muted-foreground mt-1">{crew.dutyMonth}h of 100h monthly limit</p>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 rounded-lg bg-primary text-primary-foreground py-2 text-xs font-bold hover:bg-primary/90">Assign to Pairing</button>
            <button className="flex-1 rounded-lg bg-slate-700 text-slate-200 py-2 text-xs font-bold hover:bg-slate-600">Edit Profile</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CrewRosterPanel() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const filtered = ROSTER.filter(c => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.emp.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search crew..."
            className="pl-9 pr-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary w-52" />
        </div>
        {['all','flight','cabin'].map(f => (
          <button key={f} onClick={() => setTypeFilter(f)}
            className={cn('px-3 py-2 rounded-xl text-xs font-bold transition-all', typeFilter === f ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground')}>
            {f === 'all' ? 'All Types' : f === 'flight' ? '✈ Flight' : '👥 Cabin'}
          </button>
        ))}
        {['all','active','reserve','sick'].map(f => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className={cn('px-3 py-2 rounded-xl text-xs font-bold transition-all', statusFilter === f ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground')}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} crew members</span>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Crew Member','Role','Base','Status','28-Day Duty','Qualifications','Pairings'].map(h => (
                <th key={h} className="text-left px-3 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest first:px-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => <CrewRow key={c.id} crew={c} onClick={setSelected} />)}
          </tbody>
        </table>
      </div>

      <CrewDetailModal crew={selected} onClose={() => setSelected(null)} />
    </div>
  );
}