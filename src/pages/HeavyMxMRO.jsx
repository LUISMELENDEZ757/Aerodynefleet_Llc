import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  BarChart2, Plane, CheckCircle, Activity, CalendarDays, Users,
  ChevronLeft, FileText, Wrench, Package, Play, RefreshCw,
  Plus, X, Send, AlertTriangle, Clock, Building2, Radio,
  Video, TrendingUp, ClipboardList, Settings, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// ── Live Clock ───────────────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-right">
      <p className="text-2xl font-black font-mono text-primary tracking-widest">
        {String(now.getHours()).padStart(2,'0')}:{String(now.getMinutes()).padStart(2,'0')}:{String(now.getSeconds()).padStart(2,'0')}
      </p>
      <p className="text-xs text-gray-500">{format(now, 'EEE, MMM d, yyyy')}</p>
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, iconColor, dotColor, value, label }) {
  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl p-4 flex flex-col gap-2 min-w-[110px]">
      <div className="flex items-center justify-between">
        <Icon className={cn('w-5 h-5', iconColor)} />
        <span className={cn('w-2 h-2 rounded-full', dotColor)} />
      </div>
      <p className="text-4xl font-black text-white leading-none">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',   label: 'Overview',                icon: BarChart2 },
  { id: 'daily',      label: 'Daily Aircraft Status Report', icon: FileText },
  { id: 'hangar',     label: 'Hangar Status',           icon: Building2 },
  { id: 'schedule',   label: 'Check Schedule',          icon: CalendarDays },
  { id: 'planning',   label: 'Planning & Analytics',    icon: TrendingUp },
  { id: 'comms',      label: 'MRO Comms',               icon: Radio, live: true },
  { id: 'webrtc',     label: 'WebRTC Link',             icon: Video },
];

const CHECK_TYPES = ['A Check', 'B Check', 'C Check', 'D Check / Heavy', 'ETOPS Compliance', 'AD/SB', 'Structural Repair', 'Engine Change', 'Landing Gear Overhaul'];
const HANGAR_BAYS = ['Bay 1', 'Bay 2', 'Bay 3', 'Bay 4', 'Bay 5', 'Bay 6'];

const WORK_STATUS = {
  scheduled:   { label: 'SCHEDULED',   color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/30' },
  inducted:    { label: 'INDUCTED',    color: 'text-cyan-400',   bg: 'bg-cyan-500/15',   border: 'border-cyan-500/30' },
  in_progress: { label: 'IN PROGRESS', color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/30' },
  completed:   { label: 'COMPLETED',   color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30' },
  deferred:    { label: 'DEFERRED',    color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
};

const inputCls = 'w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary';

// ── Induct Aircraft Modal ────────────────────────────────────────────────────
function InductModal({ aircraft, onClose, onCreate }) {
  const [form, setForm] = useState({ aircraft_tail: '', bay: 'Bay 1', check_type: 'C Check', planned_days: '', lead_tech: '', notes: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      aircraft_tail: form.aircraft_tail,
      station: 'HANGAR',
      ata_chapter: '05',
      entry_type: 'info',
      description: `[HEAVY MX INDUCTION] ${form.check_type} — Bay: ${form.bay}` +
        `\nPlanned Duration: ${form.planned_days || '—'} days` +
        (form.notes ? `\nNotes: ${form.notes}` : ''),
      technician_name: form.lead_tech,
      notes: `Bay: ${form.bay} | Check: ${form.check_type} | Inducted: ${new Date().toISOString()}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-[#141922] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="font-extrabold text-white text-sm uppercase tracking-wide">Induct Aircraft</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20"><X className="w-4 h-4 text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Aircraft *</label>
            <select value={form.aircraft_tail} onChange={e => set('aircraft_tail', e.target.value)} required className={inputCls}>
              <option value="">Select tail…</option>
              {aircraft.map(a => <option key={a.id} value={a.tail_number}>{a.tail_number} — {a.aircraft_type}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Hangar Bay</label>
              <select value={form.bay} onChange={e => set('bay', e.target.value)} className={inputCls}>
                {HANGAR_BAYS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Check Type</label>
              <select value={form.check_type} onChange={e => set('check_type', e.target.value)} className={inputCls}>
                {CHECK_TYPES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Planned Days</label>
              <input type="number" value={form.planned_days} onChange={e => set('planned_days', e.target.value)} placeholder="e.g. 21" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Lead Technician</label>
              <input value={form.lead_tech} onChange={e => set('lead_tech', e.target.value)} placeholder="Name / ID" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Work scope notes…" className={inputCls + ' resize-none'} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-500 flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Induct</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Work Package Modal ───────────────────────────────────────────────────────
function WorkPackageModal({ aircraft, onClose, onCreate }) {
  const [form, setForm] = useState({ aircraft_tail: '', check_type: 'C Check', ata_chapter: '05', work_scope: '', man_hours: '', start_date: '', end_date: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      aircraft_tail: form.aircraft_tail,
      station: 'MRO',
      ata_chapter: form.ata_chapter,
      entry_type: 'info',
      description: `[WORK PACKAGE] ${form.check_type} — ATA ${form.ata_chapter}\n${form.work_scope}` +
        (form.man_hours ? `\nEst. Man-Hours: ${form.man_hours}h` : '') +
        (form.start_date ? `\nStart: ${form.start_date}  End: ${form.end_date || '—'}` : ''),
      technician_name: '',
      notes: `WorkPackage | Check: ${form.check_type}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-[#141922] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="font-extrabold text-white text-sm uppercase tracking-wide">Create Work Package</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20"><X className="w-4 h-4 text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Aircraft *</label>
              <select value={form.aircraft_tail} onChange={e => set('aircraft_tail', e.target.value)} required className={inputCls}>
                <option value="">Select tail…</option>
                {aircraft.map(a => <option key={a.id} value={a.tail_number}>{a.tail_number}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Check Type</label>
              <select value={form.check_type} onChange={e => set('check_type', e.target.value)} className={inputCls}>
                {CHECK_TYPES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">ATA Chapter</label>
              <input value={form.ata_chapter} onChange={e => set('ata_chapter', e.target.value)} placeholder="05" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Est. Man-Hours</label>
              <input type="number" value={form.man_hours} onChange={e => set('man_hours', e.target.value)} placeholder="e.g. 480" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Start Date</label>
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">End Date</label>
              <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Work Scope *</label>
            <textarea required rows={3} value={form.work_scope} onChange={e => set('work_scope', e.target.value)} placeholder="Describe the work scope…" className={inputCls + ' resize-none'} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Tab Content Components ────────────────────────────────────────────────────

function OverviewTab({ aircraft, mxEntries, aircraft_maintenance }) {
  const hangarEntries = mxEntries.filter(e => e.description?.includes('[HEAVY MX'));
  const workPackages  = mxEntries.filter(e => e.description?.includes('[WORK PACKAGE]'));

  // Bay occupancy from entries
  const bayMap = {};
  hangarEntries.forEach(e => {
    const bay = e.notes?.match(/Bay: (Bay \d+)/)?.[1];
    if (bay) bayMap[bay] = e;
  });

  return (
    <div className="space-y-5">
      {/* Hangar Bay Grid */}
      <div>
        <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-3">Hangar Bay Status</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {HANGAR_BAYS.map(bay => {
            const occupied = bayMap[bay];
            const acTail = occupied?.aircraft_tail;
            const ac = aircraft.find(a => a.tail_number === acTail);
            return (
              <div key={bay} className={cn(
                'rounded-2xl border p-4 text-center transition-all',
                occupied ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/10 bg-[#141922]'
              )}>
                <Building2 className={cn('w-6 h-6 mx-auto mb-2', occupied ? 'text-amber-400' : 'text-gray-700')} />
                <p className="text-xs font-extrabold text-white">{bay}</p>
                {occupied ? (
                  <>
                    <p className="text-[10px] font-mono font-bold text-amber-400 mt-1">{acTail}</p>
                    <p className="text-[10px] text-gray-500">{occupied.notes?.match(/Check: ([^|]+)/)?.[1]?.trim() || 'MX'}</p>
                  </>
                ) : (
                  <p className="text-[10px] text-green-400 mt-1 font-bold">AVAILABLE</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Aircraft in Maintenance */}
      <div>
        <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-3">Aircraft Under Heavy MX</p>
        {hangarEntries.length === 0 ? (
          <div className="bg-[#141922] border border-white/10 rounded-2xl py-10 text-center text-gray-600 text-sm">
            No aircraft inducted. Use "Induct Aircraft" to begin.
          </div>
        ) : (
          <div className="space-y-3">
            {hangarEntries.map(e => {
              const checkType = e.notes?.match(/Check: ([^|]+)/)?.[1]?.trim() || '—';
              const bay       = e.notes?.match(/Bay: (Bay \d+)/)?.[1] || '—';
              const inducted  = e.notes?.match(/Inducted: ([^|]+)/)?.[1]?.trim();
              return (
                <div key={e.id} className="bg-[#141922] border border-amber-500/20 rounded-2xl px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-black text-primary font-mono">{e.aircraft_tail}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">{checkType}</span>
                        <span className="text-[10px] text-gray-500">{bay}</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {e.description?.replace('[HEAVY MX INDUCTION]', '').split('\n')[0].trim()}
                      </p>
                      {e.technician_name && <p className="text-[10px] text-gray-600 mt-1">Lead: {e.technician_name}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-gray-600">{inducted ? new Date(inducted).toLocaleDateString() : '—'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Work Packages */}
      {workPackages.length > 0 && (
        <div>
          <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-3">Work Packages</p>
          <div className="space-y-2">
            {workPackages.map(e => (
              <div key={e.id} className="bg-[#141922] border border-blue-500/20 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-primary text-sm">{e.aircraft_tail}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-bold">
                    {e.notes?.match(/Check: ([^|]+)/)?.[1]?.trim() || 'Package'}
                  </span>
                  <span className="text-xs text-gray-400 flex-1 truncate">
                    {e.description?.replace('[WORK PACKAGE]', '').split('\n')[0].trim()}
                  </span>
                  <span className="text-[10px] text-gray-600">{new Date(e.created_date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DailyStatusTab({ aircraft, mxEntries }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const maintenanceAc = aircraft.filter(a => a.status === 'maintenance' || a.status === 'oos');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-extrabold text-white">Daily Aircraft Status Report</p>
          <p className="text-xs text-gray-500">{today}</p>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <FileText className="w-3.5 h-3.5" /> Print Report
        </button>
      </div>

      <div className="space-y-3">
        {maintenanceAc.length === 0 ? (
          <div className="bg-[#141922] border border-white/10 rounded-2xl py-10 text-center text-gray-600">No aircraft in maintenance today</div>
        ) : (
          maintenanceAc.map(a => {
            const acEntries = mxEntries.filter(e => e.aircraft_tail === a.tail_number && e.description?.includes('[HEAVY MX'));
            const latestEntry = acEntries[0];
            return (
              <div key={a.id} className="bg-[#141922] border border-white/10 rounded-2xl px-5 py-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Tail</p>
                    <p className="text-lg font-black text-primary font-mono">{a.tail_number}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Type</p>
                    <p className="text-sm font-bold text-white">{a.aircraft_type}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Status</p>
                    <span className={cn('text-xs font-extrabold px-2 py-1 rounded',
                      a.status === 'oos' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
                    )}>{a.status?.toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Check / Task</p>
                    <p className="text-sm text-gray-300">{latestEntry?.notes?.match(/Check: ([^|]+)/)?.[1]?.trim() || 'In Maintenance'}</p>
                  </div>
                </div>
                {latestEntry && (
                  <p className="text-xs text-gray-500 mt-2 border-t border-white/5 pt-2">
                    {latestEntry.description?.replace('[HEAVY MX INDUCTION]', '').split('\n')[0].trim()}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function HangarStatusTab({ aircraft }) {
  const bayAssignments = [
    { bay: 'Bay 1', capacity: '737/A320', status: 'occupied' },
    { bay: 'Bay 2', capacity: '737/A320', status: 'occupied' },
    { bay: 'Bay 3', capacity: '777/787', status: 'available' },
    { bay: 'Bay 4', capacity: '777/787', status: 'available' },
    { bay: 'Bay 5', capacity: 'Narrowbody', status: 'scheduled' },
    { bay: 'Bay 6', capacity: 'Narrowbody', status: 'available' },
  ];

  const STATUS = {
    occupied:  { color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/30',  label: 'OCCUPIED' },
    available: { color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20',  label: 'AVAILABLE' },
    scheduled: { color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   label: 'SCHEDULED' },
  };

  return (
    <div className="space-y-4">
      <p className="text-base font-extrabold text-white">Hangar Bay Occupancy</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bayAssignments.map(({ bay, capacity, status }) => {
          const st = STATUS[status];
          return (
            <div key={bay} className={cn('rounded-2xl border p-5 space-y-3', st.bg, st.border)}>
              <div className="flex items-center justify-between">
                <p className="text-base font-extrabold text-white">{bay}</p>
                <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full', st.color, 'bg-black/20')}>{st.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className={cn('w-8 h-8', st.color)} />
                <div>
                  <p className="text-xs text-gray-400">Capacity: {capacity}</p>
                  {status === 'occupied' && (
                    <p className="text-xs font-bold text-white mt-0.5">
                      {aircraft.filter(a => a.status === 'maintenance')[0]?.tail_number || 'N/A'}
                    </p>
                  )}
                </div>
              </div>
              {status === 'available' && (
                <p className="text-[10px] text-green-400 font-bold">Ready for induction</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CheckScheduleTab({ mxEntries }) {
  const workPackages = mxEntries.filter(e => e.description?.includes('[WORK PACKAGE]') || e.description?.includes('[HEAVY MX'));

  return (
    <div className="space-y-4">
      <p className="text-base font-extrabold text-white">Scheduled Heavy Checks</p>
      {workPackages.length === 0 ? (
        <div className="bg-[#141922] border border-white/10 rounded-2xl py-16 text-center space-y-2">
          <CalendarDays className="w-10 h-10 text-gray-700 mx-auto" />
          <p className="text-gray-500 text-sm">No scheduled checks. Create a work package to begin planning.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workPackages.map(e => {
            const match = e.description?.match(/Start: (\S+)\s+End: (\S+)/);
            const start = match?.[1]; const end = match?.[2];
            const manHours = e.description?.match(/Est\. Man-Hours: (\d+)h/)?.[1];
            return (
              <div key={e.id} className="bg-[#141922] border border-white/10 rounded-2xl px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-mono font-black text-primary">{e.aircraft_tail}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400">
                        {e.notes?.match(/Check: ([^|]+)/)?.[1]?.trim() || 'Check'}
                      </span>
                      {e.ata_chapter && <span className="text-[10px] text-gray-500">ATA {e.ata_chapter}</span>}
                      {manHours && <span className="text-[10px] text-gray-500">{manHours}h est.</span>}
                    </div>
                    <p className="text-xs text-gray-400">
                      {e.description?.replace('[WORK PACKAGE]', '').split('\n')[0].trim()}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    {start && <p className="text-[10px] text-gray-500">Start: <span className="text-white">{start}</span></p>}
                    {end && end !== '—' && <p className="text-[10px] text-gray-500">End: <span className="text-white">{end}</span></p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlanningTab({ aircraft, mxEntries }) {
  const maintenanceAc = aircraft.filter(a => a.status === 'maintenance' || a.status === 'oos').length;
  const totalAc = aircraft.length;
  const utilizationPct = totalAc > 0 ? Math.round(((totalAc - maintenanceAc) / totalAc) * 100) : 100;

  const checkTypes = {};
  mxEntries.forEach(e => {
    const ct = e.notes?.match(/Check: ([^|]+)/)?.[1]?.trim();
    if (ct) checkTypes[ct] = (checkTypes[ct] || 0) + 1;
  });

  return (
    <div className="space-y-5">
      <p className="text-base font-extrabold text-white">Planning & Analytics</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Fleet Utilization',   value: `${utilizationPct}%`, color: utilizationPct > 80 ? 'text-green-400' : 'text-amber-400' },
          { label: 'Aircraft in MX',      value: maintenanceAc,          color: 'text-amber-400' },
          { label: 'Work Packages',       value: mxEntries.filter(e => e.description?.includes('[WORK PACKAGE]')).length, color: 'text-blue-400' },
          { label: 'Total MX Records',    value: mxEntries.length,       color: 'text-primary' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#141922] border border-white/10 rounded-2xl p-4 text-center">
            <p className={cn('text-3xl font-black', color)}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {Object.keys(checkTypes).length > 0 && (
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
          <p className="text-sm font-extrabold text-white mb-4">Check Type Distribution</p>
          <div className="space-y-2">
            {Object.entries(checkTypes).map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <p className="text-xs text-gray-400 w-40 flex-shrink-0">{type}</p>
                <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(count / Math.max(...Object.values(checkTypes))) * 100}%` }} />
                </div>
                <p className="text-xs font-bold text-white w-6 text-right">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CommsTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <p className="text-base font-extrabold text-white">MRO Communications</p>
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-green-500 text-white animate-pulse">LIVE</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: 'Engineering Orders', icon: ClipboardList, color: 'text-blue-400', path: '/Documents', desc: 'ADs, SBs, EOs, and technical orders' },
          { label: 'Parts Coordination', icon: Package,       color: 'text-amber-400', path: '/MaintenanceControl', desc: 'AOG parts, POs, shipping status' },
          { label: 'Quality Control',    icon: CheckCircle,   color: 'text-green-400', path: '/SafetyQA', desc: 'Inspection records, NDT, release certs' },
          { label: 'MX ACARS/Comms',    icon: Radio,         color: 'text-cyan-400',  path: '/CommCenter', desc: 'ACARS messages, MX dispatch comms' },
        ].map(({ label, icon: Icon, color, path, desc }) => (
          <Link key={label} to={path} className="bg-[#141922] border border-white/10 rounded-2xl p-5 flex items-start gap-4 hover:border-white/20 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
              <Icon className={cn('w-5 h-5', color)} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function WebRTCTab() {
  return (
    <div className="space-y-4">
      <p className="text-base font-extrabold text-white">WebRTC Remote MX Support</p>
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-violet-600/20 flex items-center justify-center mx-auto">
          <Video className="w-8 h-8 text-violet-400" />
        </div>
        <p className="text-lg font-extrabold text-white">Remote Expert Support</p>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Connect with OEM technical representatives and remote MX experts via secure WebRTC video conferencing.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {['Boeing Tech Ops', 'CFM Engine Support', 'Airbus AOG Center'].map(name => (
            <button key={name} className="py-3 px-4 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-bold hover:bg-violet-500/20 transition-colors">
              📞 {name}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-600">WebRTC integration requires network configuration. Contact IT for setup.</p>
      </div>
    </div>
  );
}

// ── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function HeavyMxMRO() {
  const [tab, setTab] = useState('overview');
  const [modal, setModal] = useState(null); // 'induct' | 'package' | 'schedule' | 'parts'
  const qc = useQueryClient();

  const { data: aircraft = [], isLoading: acLoading } = useQuery({
    queryKey: ['hmx-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 60000,
  });

  const { data: allEntries = [], isLoading: entriesLoading, refetch } = useQuery({
    queryKey: ['hmx-entries'],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 500),
    refetchInterval: 30000,
  });

  const mxEntries = allEntries.filter(e =>
    e.description?.includes('[HEAVY MX') || e.description?.includes('[WORK PACKAGE]')
  );

  const { data: techs = [] } = useQuery({
    queryKey: ['hmx-crew'],
    queryFn: () => base44.entities.CrewAssignment.list('-flight_date', 100),
    refetchInterval: 60000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LogbookEntry.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hmx-entries'] }); setModal(null); },
  });

  // KPIs
  const totalBays    = HANGAR_BAYS.length;
  const inHangar     = aircraft.filter(a => a.status === 'maintenance').length;
  const available    = aircraft.filter(a => a.status === 'active').length;
  const inProgress   = mxEntries.filter(e => e.description?.includes('[HEAVY MX') && !e.is_cleared).length;
  const scheduled    = mxEntries.filter(e => e.description?.includes('[WORK PACKAGE]')).length;
  const techCount    = techs.length;

  const isLoading = acLoading || entriesLoading;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* ── HEADER ── */}
      <div className="border-b border-white/10 bg-[#0a0e18] px-5 py-4 sticky top-0 z-20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors mt-0.5">
              <ChevronLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <BarChart2 className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-black text-primary tracking-widest uppercase">HEAVY MX / MRO OPERATIONS</h1>
              </div>
              <p className="text-xs text-gray-500">Maintenance, Repair & Overhaul · Hangar Management · Heavy Check Planning</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Settings className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-bold text-primary">Boeing 737 Fleet Only</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <LiveClock />
            <button onClick={refetch} className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <RefreshCw className={cn('w-3.5 h-3.5 text-gray-400', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* ── KPI CARDS ── */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          <KpiCard icon={BarChart2}    iconColor="text-primary"    dotColor="bg-amber-500"   value={isLoading ? '…' : totalBays}  label="Total Bays" />
          <KpiCard icon={Plane}        iconColor="text-red-400"    dotColor="bg-red-500"     value={isLoading ? '…' : inHangar}   label="In Hangar" />
          <KpiCard icon={CheckCircle}  iconColor="text-green-400"  dotColor="bg-green-500"   value={isLoading ? '…' : available}  label="Available" />
          <KpiCard icon={Activity}     iconColor="text-cyan-400"   dotColor="bg-cyan-500"    value={isLoading ? '…' : inProgress} label="In Progress" />
          <KpiCard icon={CalendarDays} iconColor="text-blue-400"   dotColor="bg-amber-500"   value={isLoading ? '…' : scheduled}  label="Scheduled" />
          <KpiCard icon={Users}        iconColor="text-violet-400" dotColor="bg-violet-500"  value={isLoading ? '…' : techCount}  label="Technicians" />
        </div>

        {/* ── TAB BAR ── */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {TABS.map(({ id, label, icon: Icon, live }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex-shrink-0',
                tab === id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-[#141922] border border-white/10 text-gray-400 hover:text-white'
              )}>
              <Icon className="w-3.5 h-3.5" />
              {label}
              {live && <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-green-500 text-white">LIVE</span>}
            </button>
          ))}
        </div>

        {/* ── QUICK ACTIONS (Overview only) ── */}
        {tab === 'overview' && (
          <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-primary" />
              <p className="text-sm font-extrabold text-white">Quick Actions</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Play,       bg: 'bg-green-600',  label: 'Induct Aircraft',    action: () => setModal('induct')   },
                { icon: FileText,   bg: 'bg-blue-600',   label: 'Create Work Package', action: () => setModal('package')  },
                { icon: CalendarDays, bg: 'bg-purple-600', label: 'Schedule Check',   action: () => setTab('schedule')   },
                { icon: Package,    bg: 'bg-orange-600', label: 'Parts Request',       action: () => window.location.href = '/MaintenanceControl' },
              ].map(({ icon: Icon, bg, label, action }) => (
                <button key={label} onClick={action}
                  className="flex flex-col items-center gap-3 py-5 rounded-2xl bg-[#0d1117] border border-white/10 hover:border-white/20 active:scale-95 transition-all">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', bg)}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs font-bold text-white text-center leading-tight">{label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB CONTENT ── */}
        {tab === 'overview'  && <OverviewTab aircraft={aircraft} mxEntries={mxEntries} aircraft_maintenance={aircraft.filter(a => a.status === 'maintenance')} />}
        {tab === 'daily'     && <DailyStatusTab aircraft={aircraft} mxEntries={mxEntries} />}
        {tab === 'hangar'    && <HangarStatusTab aircraft={aircraft} />}
        {tab === 'schedule'  && <CheckScheduleTab mxEntries={mxEntries} />}
        {tab === 'planning'  && <PlanningTab aircraft={aircraft} mxEntries={mxEntries} />}
        {tab === 'comms'     && <CommsTab />}
        {tab === 'webrtc'    && <WebRTCTab />}
      </div>

      {/* ── MODALS ── */}
      {modal === 'induct'  && <InductModal  aircraft={aircraft} onClose={() => setModal(null)} onCreate={(d) => createMutation.mutate(d)} />}
      {modal === 'package' && <WorkPackageModal aircraft={aircraft} onClose={() => setModal(null)} onCreate={(d) => createMutation.mutate(d)} />}
    </div>
  );
}