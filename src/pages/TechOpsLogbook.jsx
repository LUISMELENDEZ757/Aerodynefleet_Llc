import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  BookOpen, Plane, AlertTriangle, ChevronDown, Plus,
  Printer, Clock, CheckCircle, XCircle, Wrench, Zap,
  Radio, Flame, Wind, Settings, Shield, ChevronRight, FilePlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import NewLogEntryModal from '@/components/techops/NewLogEntryModal';
import NewFaultModal from '@/components/techops/NewFaultModal';

const STATUS_STYLES = {
  active:      { label: 'IN SERVICE',  bg: 'bg-green-600',  dot: 'bg-green-400' },
  oos:         { label: 'OUT OF SERVICE', bg: 'bg-red-700', dot: 'bg-red-400' },
  maintenance: { label: 'MAINTENANCE', bg: 'bg-orange-600', dot: 'bg-orange-400' },
  retired:     { label: 'RETIRED',     bg: 'bg-gray-600',   dot: 'bg-gray-400' },
};

const SEVERITY_STYLES = {
  warning:  { label: 'WARNING',  bg: 'bg-red-700',    text: 'text-red-300',    border: 'border-red-600' },
  caution:  { label: 'CAUTION',  bg: 'bg-amber-700',  text: 'text-amber-300',  border: 'border-amber-600' },
  advisory: { label: 'ADVISORY', bg: 'bg-blue-700',   text: 'text-blue-300',   border: 'border-blue-600' },
  memo:     { label: 'MEMO',     bg: 'bg-gray-700',   text: 'text-gray-300',   border: 'border-gray-600' },
};

const ENTRY_STYLES = {
  discrepancy:      { label: 'DISCREPANCY',       color: 'text-red-400',    border: 'border-red-500/30' },
  corrective_action:{ label: 'CORRECTIVE ACTION', color: 'text-green-400',  border: 'border-green-500/30' },
  deferred:         { label: 'DEFERRED',          color: 'text-amber-400',  border: 'border-amber-500/30' },
  cleared:          { label: 'CLEARED',           color: 'text-blue-400',   border: 'border-blue-500/30' },
  info:             { label: 'INFO',              color: 'text-gray-400',   border: 'border-gray-500/30' },
};

const SYSTEM_ICONS = {
  engine: Flame, hydraulics: Settings, avionics: Radio,
  electrical: Zap, fuel: Plane, pneumatics: Wind,
  flight_controls: Plane, apu: Zap, landing_gear: Plane, other: AlertTriangle,
};

function useElapsedTime() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function TechOpsLogbook() {
  const [selectedTail, setSelectedTail] = useState(null);
  const [tailDropdown, setTailDropdown] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showNewFault, setShowNewFault] = useState(false);
  const [faultTab, setFaultTab] = useState('active');
  const [logTab, setLogTab] = useState('entries');
  const [entryPreset, setEntryPreset] = useState(null);
  const elapsed = useElapsedTime();
  const queryClient = useQueryClient();

  const { data: aircraft = [] } = useQuery({
    queryKey: ['logbook-aircraft'],
    queryFn: () => base44.entities.Aircraft.list(),
  });

  const selectedAc = aircraft.find(a => a.tail_number === selectedTail) || aircraft[0];

  useEffect(() => {
    if (!selectedTail && aircraft.length > 0) setSelectedTail(aircraft[0].tail_number);
  }, [aircraft]);

  const { data: entries = [] } = useQuery({
    queryKey: ['logbook-entries', selectedTail],
    queryFn: () => base44.entities.LogbookEntry.filter({ aircraft_tail: selectedTail }),
    enabled: !!selectedTail,
  });

  const { data: faults = [] } = useQuery({
    queryKey: ['logbook-faults', selectedTail],
    queryFn: () => base44.entities.FaultMessage.filter({ aircraft_tail: selectedTail }),
    enabled: !!selectedTail,
  });

  const createEntryMutation = useMutation({
    mutationFn: (data) => base44.entities.LogbookEntry.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['logbook-entries'] }); setShowNewEntry(false); },
  });

  const createFaultMutation = useMutation({
    mutationFn: (data) => base44.entities.FaultMessage.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['logbook-faults'] }); setShowNewFault(false); },
  });

  const clearFaultMutation = useMutation({
    mutationFn: ({ id }) => base44.entities.FaultMessage.update(id, { status: 'cleared', cleared_at: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['logbook-faults'] }),
  });

  const wireToLogbookMutation = useMutation({
    mutationFn: ({ fault, ac }) => {
      const nextPage = `LP#${String(entries.length + 1).padStart(4, '0')}`;
      return base44.entities.LogbookEntry.create({
        aircraft_tail: fault.aircraft_tail,
        log_page: nextPage,
        entry_type: 'discrepancy',
        ata_chapter: fault.ata_chapter || '',
        station: ac?.base_station || '',
        description: `[FAULT → LOGBOOK] ${fault.fault_code}${fault.description ? ` — ${fault.description}` : ''}` +
          `\nSeverity: ${fault.severity?.toUpperCase()} | System: ${fault.system?.toUpperCase()}` +
          (fault.flight_phase ? ` | Phase: ${fault.flight_phase}` : '') +
          `\nAircraft: ${ac?.aircraft_type || fault.aircraft_tail} | Engine: ${ac?.engine_type || '—'} | MSN: ${ac?.msn || '—'}`,
        notes: `Auto-wired from FaultMessage ID: ${fault.id}. Detected: ${fault.detected_at ? new Date(fault.detected_at).toLocaleString() : '—'}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logbook-entries'] });
    },
  });

  const openItems = entries.filter(e => e.is_deferred && !e.is_cleared).length;
  const activeFaults = faults.filter(f => f.status === 'active');
  const clearedFaults = faults.filter(f => f.status === 'cleared');
  const nextLogPage = `LP#${String(entries.length + 1).padStart(4, '0')}`;
  const statusCfg = STATUS_STYLES[selectedAc?.status] || STATUS_STYLES.active;

  const handlePrint = () => {
    const entriesHtml = entries.length === 0
      ? '<tr><td colspan="5" style="text-align:center;color:#888;padding:16px;">No log entries</td></tr>'
      : entries.map(e => {
          const style = ENTRY_STYLES[e.entry_type] || ENTRY_STYLES.discrepancy;
          const date = new Date(e.created_date);
          return `<tr>
            <td>${e.log_page || '—'}</td>
            <td><strong style="color:${style.color.replace('text-','')}">${style.label}</strong></td>
            <td>ATA ${e.ata_chapter || '—'}</td>
            <td>${e.description || '—'}${e.corrective_action ? `<br/><span style="color:green">✓ ${e.corrective_action}</span>` : ''}${e.is_deferred && !e.is_cleared ? `<br/><span style="color:orange">MEL ${e.mel_category} — ${e.mel_reference || ''}</span>` : ''}${e.is_cleared ? '<br/><span style="color:green">✓ CLEARED</span>' : ''}</td>
            <td>${e.technician_name || '—'}<br/><small>${date.toLocaleDateString()} ${date.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false})}</small></td>
          </tr>`;
        }).join('');

    const faultsHtml = activeFaults.length === 0
      ? '<tr><td colspan="4" style="text-align:center;color:#888;padding:12px;">No active faults</td></tr>'
      : activeFaults.map(f => `<tr>
          <td><strong>${f.fault_code}</strong></td>
          <td>${f.severity?.toUpperCase() || '—'}</td>
          <td>ATA ${f.ata_chapter || '—'}</td>
          <td>${f.description || '—'}</td>
        </tr>`).join('');

    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>E-Logbook — ${selectedAc?.tail_number || ''}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 32px; }
        h1 { font-size: 20px; margin: 0 0 2px; }
        .sub { color: #555; font-size: 11px; margin-bottom: 20px; }
        .info-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 24px; }
        .info-box { border: 1px solid #ddd; border-radius: 8px; padding: 10px; }
        .info-box label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px; }
        .info-box span { font-size: 18px; font-weight: 900; }
        h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #111; padding-bottom: 4px; margin: 20px 0 8px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #f3f4f6; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
        .footer { margin-top: 32px; font-size: 10px; color: #aaa; border-top: 1px solid #ddd; padding-top: 8px; }
      </style>
      </head><body>
      <h1>E-LOGBOOK — ${selectedAc?.tail_number || '—'}</h1>
      <div class="sub">Aerodyne Fleet LLC &nbsp;|&nbsp; ${selectedAc?.aircraft_type || '—'} &nbsp;|&nbsp; Station: ${selectedAc?.base_station || '—'} &nbsp;|&nbsp; Status: ${statusCfg.label}</div>

      <div class="info-grid">
        <div class="info-box"><label>Log Entries</label><span>${entries.length}</span></div>
        <div class="info-box"><label>Open Items</label><span>${openItems}</span></div>
        <div class="info-box"><label>Active Faults</label><span>${activeFaults.length}</span></div>
        <div class="info-box"><label>Next Log Page</label><span>${nextLogPage}</span></div>
      </div>

      <h2>Active Fault Messages (EICAS/BITE)</h2>
      <table>
        <thead><tr><th>Code</th><th>Severity</th><th>ATA</th><th>Description</th></tr></thead>
        <tbody>${faultsHtml}</tbody>
      </table>

      <h2>Log Entries</h2>
      <table>
        <thead><tr><th>Log Page</th><th>Type</th><th>ATA</th><th>Description</th><th>Technician / Date</th></tr></thead>
        <tbody>${entriesHtml}</tbody>
      </table>

      <div class="footer">Printed: ${new Date().toLocaleString()} &nbsp;|&nbsp; ${selectedAc?.tail_number || ''} &nbsp;|&nbsp; Aerodyne Fleet LLC E-Logbook</div>
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0d1117]">
        <div className="flex items-center gap-3">
          <Link to="/Home" className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-wide leading-none">E-logbook</p>
            <p className="text-[10px] text-gray-500 tracking-widest uppercase">RECORDS SYSTEM</p>
          </div>
          <div className="flex items-center gap-1 bg-[#1a1f2e] border border-white/10 rounded-full px-3 py-1 ml-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span className="text-xs font-mono text-amber-400">{elapsed}</span>
          </div>
        </div>

        {/* Aircraft Selector */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setTailDropdown(!tailDropdown)}
              className="flex items-center gap-2 bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2 hover:border-white/20 transition-all"
            >
              <Plane className="w-4 h-4 text-gray-400" />
              <span className="font-bold text-sm tracking-wide">{selectedAc?.tail_number || '—'}</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            {tailDropdown && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden z-50 shadow-xl">
                {aircraft.map(a => (
                  <button
                    key={a.id}
                    onClick={() => { setSelectedTail(a.tail_number); setTailDropdown(false); }}
                    className={cn('w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left',
                      a.tail_number === selectedTail && 'bg-primary/10 text-primary'
                    )}
                  >
                    <span className="font-bold">{a.tail_number}</span>
                    <span className="text-xs text-gray-400">{a.aircraft_type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handlePrint} title="Print Logbook" className="w-9 h-9 bg-[#1a1f2e] border border-white/10 rounded-xl flex items-center justify-center hover:bg-primary/20 transition-colors">
            <Printer className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5 max-w-5xl mx-auto">
        {/* Aircraft Info + Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Aircraft Card */}
          <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 space-y-4">
            <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase flex items-center gap-1.5">
              <Plane className="w-3 h-3" /> AIRCRAFT
            </p>
            <p className="text-5xl font-black tracking-wide text-white">{selectedAc?.tail_number || '—'}</p>
            <p className="text-sm text-gray-400 font-semibold">{selectedAc?.aircraft_type || '—'}</p>

            <div>
              <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase flex items-center gap-1.5 mb-1">
                STATION
              </p>
              <p className="text-3xl font-black tracking-wide">{selectedAc?.base_station || '—'}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase flex items-center gap-1.5 mb-2">
                STATUS
              </p>
              <span className={cn('inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-white', statusCfg.bg)}>
                <span className={cn('w-2 h-2 rounded-full', statusCfg.dot)} />
                {statusCfg.label}
              </span>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="sm:col-span-2 grid grid-cols-3 gap-4">
            <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
              <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase flex items-center gap-1.5">
                <BookOpen className="w-3 h-3" /> LOG ENTRIES
              </p>
              <div>
                <p className="text-5xl font-black text-white">{entries.length}</p>
                <p className="text-xs text-gray-500 mt-1">total records</p>
              </div>
            </div>

            <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
              <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" /> OPEN ITEMS
              </p>
              <div>
                <p className={cn('text-5xl font-black', openItems > 0 ? 'text-amber-400' : 'text-white')}>{openItems}</p>
                <p className="text-xs text-gray-500 mt-1">active deferrals</p>
              </div>
            </div>

            <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
              <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> NEXT LOG PAGE
              </p>
              <div>
                <p className="text-3xl font-black text-amber-400 font-mono">{nextLogPage}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fault Messages (EICAS/BITE) */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <p className="text-base font-extrabold tracking-wide">FAULT MESSAGES (EICAS/BITE)</p>
              <p className="text-xs text-gray-500 mt-0.5">System-generated fault codes and maintenance alerts</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFaultTab('active')}
                className={cn('flex flex-col items-center px-5 py-2 rounded-lg transition-all',
                  faultTab === 'active' ? 'bg-red-900/50 border border-red-700' : 'bg-[#1a1f2e] border border-white/10'
                )}
              >
                <span className="text-xs text-gray-400">ACTIVE</span>
                <span className={cn('text-xl font-black', activeFaults.length > 0 ? 'text-red-400' : 'text-white')}>{activeFaults.length}</span>
              </button>
              <button
                onClick={() => setFaultTab('cleared')}
                className={cn('flex flex-col items-center px-5 py-2 rounded-lg transition-all',
                  faultTab === 'cleared' ? 'bg-white/10 border border-white/20' : 'bg-[#1a1f2e] border border-white/10'
                )}
              >
                <span className="text-xs text-gray-400">CLEARED</span>
                <span className="text-xl font-black text-gray-300">{clearedFaults.length}</span>
              </button>
              <button
                onClick={() => setShowNewFault(true)}
                className="flex items-center gap-1.5 bg-red-700 hover:bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> LOG FAULT
              </button>
            </div>
          </div>

          {/* Fault List */}
          <div className="divide-y divide-white/5">
            {(faultTab === 'active' ? activeFaults : clearedFaults).length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-600 text-sm">
                {faultTab === 'active' ? 'No active fault messages' : 'No cleared faults'}
              </div>
            ) : (
              (faultTab === 'active' ? activeFaults : clearedFaults).map(fault => {
                const sev = SEVERITY_STYLES[fault.severity] || SEVERITY_STYLES.caution;
                const SysIcon = SYSTEM_ICONS[fault.system] || AlertTriangle;
                return (
                  <div key={fault.id} className={cn('flex items-start justify-between px-5 py-4 hover:bg-white/5 transition-colors border-l-2', sev.border)}>
                    <div className="flex items-start gap-3">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', sev.bg)}>
                        <SysIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn('text-xs font-bold px-2 py-0.5 rounded', sev.bg, 'text-white')}>{sev.label}</span>
                          <span className="font-mono font-bold text-sm">{fault.fault_code}</span>
                        </div>
                        <p className="text-xs text-gray-400">{fault.description}</p>
                        {fault.ata_chapter && <p className="text-xs text-gray-600 mt-0.5">ATA {fault.ata_chapter}</p>}
                      </div>
                    </div>
                    {fault.status === 'active' && (
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => {
                            const alreadyLogged = entries.some(e =>
                              e.description?.includes(`FaultMessage ID: ${fault.id}`) ||
                              e.description?.includes(`[FAULT → LOGBOOK] ${fault.fault_code}`)
                            );
                            if (!alreadyLogged) {
                              wireToLogbookMutation.mutate({ fault, ac: selectedAc });
                            }
                          }}
                          disabled={
                            wireToLogbookMutation.isPending ||
                            entries.some(e =>
                              e.description?.includes(`FaultMessage ID: ${fault.id}`) ||
                              e.description?.includes(`[FAULT → LOGBOOK] ${fault.fault_code}`)
                            )
                          }
                          title="Create logbook discrepancy entry from this fault"
                          className={cn(
                            'text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1',
                            entries.some(e => e.description?.includes(`[FAULT → LOGBOOK] ${fault.fault_code}`))
                              ? 'bg-primary/10 text-primary border-primary/30 cursor-default opacity-60'
                              : 'bg-primary/20 text-primary border-primary/40 hover:bg-primary/30'
                          )}
                        >
                          <FilePlus className="w-3 h-3" />
                          {entries.some(e => e.description?.includes(`[FAULT → LOGBOOK] ${fault.fault_code}`))
                            ? 'LOGGED' : 'LOG ENTRY'}
                        </button>
                        <button
                          onClick={() => clearFaultMutation.mutate({ id: fault.id })}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-800/50 text-green-400 border border-green-700 hover:bg-green-700/50 transition-colors"
                        >
                          CLEAR
                        </button>
                      </div>
                    )}
                    {fault.status === 'cleared' && (
                      <span className="flex items-center gap-1 text-xs text-green-400 flex-shrink-0">
                        <CheckCircle className="w-3.5 h-3.5" /> Cleared
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Create New Entry Panel */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md border border-white/20 flex items-center justify-center">
              <Plus className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <p className="text-sm font-extrabold tracking-widest uppercase text-white">Create New Entry</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Pilot Discrepancy',       type: 'discrepancy',       border: 'border-red-700',    text: 'text-red-400',    bg: 'bg-red-950/40' },
              { label: 'Technician Discrepancy',  type: 'discrepancy',       border: 'border-amber-800',  text: 'text-amber-500',  bg: 'bg-amber-950/40' },
              { label: 'Correction',              type: 'corrective_action', border: 'border-green-700',  text: 'text-green-400',  bg: 'bg-green-950/40' },
              { label: 'Parts Installation',      type: 'corrective_action', border: 'border-purple-700', text: 'text-purple-400', bg: 'bg-purple-950/40' },
              { label: 'Request Deferral Extension', type: 'deferred',       border: 'border-yellow-700', text: 'text-yellow-400', bg: 'bg-yellow-950/40' },
              { label: 'Parts Ordering',          type: 'info',              border: 'border-amber-900',  text: 'text-amber-600',  bg: 'bg-amber-950/30' },
              { label: 'Oil Service',             type: 'info',              border: 'border-blue-800',   text: 'text-blue-300',   bg: 'bg-blue-950/40' },
              { label: 'Oxygen Service',          type: 'info',              border: 'border-cyan-700',   text: 'text-cyan-400',   bg: 'bg-cyan-950/40' },
            ].map(({ label, type, border, text, bg }) => (
              <button
                key={label}
                onClick={() => { setEntryPreset({ entry_type: type, description: label }); setShowNewEntry(true); }}
                className={cn('px-3 py-2.5 rounded-xl border font-bold text-xs tracking-wide transition-all hover:brightness-125', border, text, bg)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Log Entries / MCC tabs */}
          <div className="flex items-center gap-6 pt-2 border-t border-white/10 mt-1">
            <button
              onClick={() => setLogTab('entries')}
              className={cn('text-sm font-bold pb-1 transition-colors', logTab === 'entries' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-500 hover:text-gray-300')}
            >
              Log Entries
            </button>
            <button
              onClick={() => setLogTab('mcc')}
              className={cn('flex items-center gap-1.5 text-sm font-bold pb-1 transition-colors', logTab === 'mcc' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-500 hover:text-gray-300')}
            >
              <Shield className="w-3.5 h-3.5" /> MCC Reopen Requests
            </button>
          </div>
        </div>

        {/* Log Entries */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <p className="text-base font-extrabold tracking-wide">{logTab === 'entries' ? 'LOG ENTRIES' : 'MCC REOPEN REQUESTS'}</p>
              <p className="text-xs text-gray-500 mt-0.5">Discrepancies, corrective actions, and deferrals</p>
            </div>
            <button
              onClick={() => { setEntryPreset(null); setShowNewEntry(true); }}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> NEW ENTRY
            </button>
          </div>

          <div className="divide-y divide-white/5">
            {entries.length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-600 text-sm">
                No log entries yet — tap "NEW ENTRY" to create the first record
              </div>
            ) : (
              entries.map((entry, i) => {
                const style = ENTRY_STYLES[entry.entry_type] || ENTRY_STYLES.discrepancy;
                return (
                  <div key={entry.id} className={cn('px-5 py-4 border-l-2 hover:bg-white/5 transition-colors', style.border)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn('text-[10px] font-bold tracking-widest', style.color)}>{style.label}</span>
                          {entry.log_page && <span className="text-[10px] font-mono text-gray-500">{entry.log_page}</span>}
                          {entry.ata_chapter && <span className="text-[10px] text-gray-600">ATA {entry.ata_chapter}</span>}
                        </div>
                        <p className="text-sm text-gray-200 font-medium">{entry.description}</p>
                        {entry.corrective_action && (
                          <p className="text-xs text-green-400 mt-1">✓ {entry.corrective_action}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          {entry.technician_name && (
                            <span className="text-[10px] text-gray-600 flex items-center gap-1">
                              <Wrench className="w-2.5 h-2.5" /> {entry.technician_name}
                            </span>
                          )}
                          {entry.is_deferred && !entry.is_cleared && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                              MEL {entry.mel_category} — {entry.mel_reference}
                            </span>
                          )}
                          {entry.is_cleared && (
                            <span className="text-[10px] font-bold text-green-400 flex items-center gap-1">
                              <CheckCircle className="w-2.5 h-2.5" /> CLEARED
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] font-mono text-gray-600">
                          {new Date(entry.created_date).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] font-mono text-gray-600">
                          {new Date(entry.created_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showNewEntry && (
        <NewLogEntryModal
          aircraftTail={selectedTail}
          nextLogPage={nextLogPage}
          preset={entryPreset}
          onClose={() => { setShowNewEntry(false); setEntryPreset(null); }}
          onSave={(data) => createEntryMutation.mutate(data)}
        />
      )}

      {showNewFault && (
        <NewFaultModal
          aircraftTail={selectedTail}
          onClose={() => setShowNewFault(false)}
          onSave={(data) => createFaultMutation.mutate(data)}
        />
      )}
    </div>
  );
}