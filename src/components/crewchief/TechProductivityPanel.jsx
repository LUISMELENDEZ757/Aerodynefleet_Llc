import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { User, Shield, BookOpen, CheckCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TODAY = new Date().toISOString().split('T')[0];

function StatPill({ icon: Icon, value, label, color }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-secondary/50 min-w-[60px]">
      <Icon className={cn('w-3.5 h-3.5 mb-0.5', color)} />
      <p className={cn('text-lg font-black', color)}>{value}</p>
      <p className="text-[9px] text-muted-foreground uppercase tracking-wide text-center leading-tight">{label}</p>
    </div>
  );
}

export default function TechProductivityPanel({ stationFilter, aircraft = [] }) {
  // Fetch today's logbook entries
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['tech-productivity-entries', TODAY],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 500),
    select: (data) => data.filter(e => {
      const d = e.created_date || e.updated_date;
      return d && d.startsWith(TODAY);
    }),
    refetchInterval: 60000,
  });

  // Station-filter tail numbers
  const stationTails = useMemo(() => {
    if (!stationFilter) return null;
    return new Set(aircraft.filter(a => a.base_station === stationFilter).map(a => a.tail_number));
  }, [stationFilter, aircraft]);

  const filteredEntries = useMemo(() =>
    stationTails ? entries.filter(e => stationTails.has(e.aircraft_tail)) : entries,
    [entries, stationTails]
  );

  // Aggregate per technician
  const techStats = useMemo(() => {
    const map = {};

    filteredEntries.forEach(e => {
      const name = e.technician_name || e.corrected_by || null;
      if (!name) return;

      if (!map[name]) {
        map[name] = {
          name,
          tech_id: e.technician_id || e.corrected_by_id || '',
          logbook_entries: 0,
          rii_signed: 0,
          rii_pending: 0,
          closed: 0,
          in_progress: 0,
          last_entry: null,
          tails: new Set(),
        };
      }

      const s = map[name];
      s.logbook_entries++;
      if (e.aircraft_tail) s.tails.add(e.aircraft_tail);
      if (e.discrepancy_status === 'CLOSED' || e.is_cleared) s.closed++;
      if (e.discrepancy_status === 'IN_PROGRESS') s.in_progress++;
      if (e.rii_required && e.rii_signed_at) s.rii_signed++;
      if (e.rii_required && !e.rii_signed_at && !e.rii_rejected) s.rii_pending++;

      const entryTime = e.updated_date || e.created_date;
      if (!s.last_entry || entryTime > s.last_entry) s.last_entry = entryTime;
    });

    return Object.values(map)
      .map(s => ({ ...s, tails: [...s.tails] }))
      .sort((a, b) => b.logbook_entries - a.logbook_entries);
  }, [filteredEntries]);

  // Unattributed entries (no technician name)
  const unattributed = filteredEntries.filter(e => !e.technician_name && !e.corrected_by).length;

  if (isLoading) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        <div className="w-6 h-6 border-2 border-primary/40 border-t-primary rounded-full animate-spin mx-auto mb-3" />
        Loading today's activity…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-extrabold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Daily Technician Productivity
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Today · {filteredEntries.length} entries · {techStats.length} technician{techStats.length !== 1 ? 's' : ''}
            {stationFilter && ` · ${stationFilter}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl px-3 py-3 text-center">
          <p className="text-2xl font-black text-primary">{filteredEntries.length}</p>
          <p className="text-[10px] text-muted-foreground">Total Entries</p>
        </div>
        <div className="bg-card border border-border rounded-xl px-3 py-3 text-center">
          <p className="text-2xl font-black text-violet-400">
            {techStats.reduce((s, t) => s + t.rii_signed, 0)}
          </p>
          <p className="text-[10px] text-muted-foreground">RII Signed</p>
        </div>
        <div className="bg-card border border-border rounded-xl px-3 py-3 text-center">
          <p className="text-2xl font-black text-green-400">
            {techStats.reduce((s, t) => s + t.closed, 0)}
          </p>
          <p className="text-[10px] text-muted-foreground">Items Closed</p>
        </div>
      </div>

      {/* Per-technician cards */}
      {techStats.length === 0 ? (
        <div className="text-center py-14">
          <User className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm font-bold text-muted-foreground">No technician activity recorded today</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Entries will appear once logbook records with technician names are created</p>
        </div>
      ) : (
        <div className="space-y-2">
          {techStats.map((tech, idx) => (
            <div key={tech.name}
              className="bg-card border border-border rounded-2xl px-4 py-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {/* Rank badge */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0',
                    idx === 0 ? 'bg-primary/20 text-primary' :
                    idx === 1 ? 'bg-secondary text-foreground' :
                    'bg-secondary/50 text-muted-foreground'
                  )}>
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-foreground">{tech.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {tech.tech_id && <span className="mr-2">{tech.tech_id}</span>}
                      {tech.tails.length > 0 && (
                        <span className="text-primary">{tech.tails.slice(0, 3).join(', ')}{tech.tails.length > 3 ? ` +${tech.tails.length - 3}` : ''}</span>
                      )}
                    </p>
                  </div>
                </div>
                {tech.last_entry && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(tech.last_entry).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}Z
                  </div>
                )}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-2 flex-wrap">
                <StatPill icon={BookOpen} value={tech.logbook_entries} label="Entries" color="text-sky-400" />
                <StatPill icon={CheckCircle} value={tech.closed} label="Closed" color="text-green-400" />
                <StatPill icon={Shield} value={tech.rii_signed} label="RII Signed" color="text-violet-400" />
                {tech.rii_pending > 0 && (
                  <StatPill icon={AlertTriangle} value={tech.rii_pending} label="RII Pending" color="text-amber-400" />
                )}
                {tech.in_progress > 0 && (
                  <StatPill icon={Clock} value={tech.in_progress} label="In Progress" color="text-orange-400" />
                )}
              </div>

              {/* RII pending warning */}
              {tech.rii_pending > 0 && (
                <div className="mt-2 flex items-center gap-2 bg-amber-900/20 border border-amber-500/30 rounded-lg px-3 py-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <p className="text-[10px] text-amber-300 font-bold">
                    {tech.rii_pending} RII task{tech.rii_pending > 1 ? 's' : ''} awaiting inspector sign-off
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Unattributed entries notice */}
      {unattributed > 0 && (
        <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-xl px-4 py-3">
          <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="font-bold text-foreground">{unattributed}</span> entr{unattributed === 1 ? 'y' : 'ies'} with no technician assigned — add names to logbook entries for full tracking.
          </p>
        </div>
      )}
    </div>
  );
}