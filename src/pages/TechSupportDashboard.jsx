import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, AlertTriangle, Clock, CheckCircle, TrendingUp,
  Wrench, Plane, Calendar, Users, RefreshCw, Search, Filter,
  ArrowUpRight, ArrowDownRight, Minus, Zap, Shield, BookOpen,
  MapPin, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CatCapabilityBadge from '@/components/techops/CatCapabilityBadge';
import EtopsCapabilityBadge from '@/components/techops/EtopsCapabilityBadge';
import { useStations } from '@/hooks/useStations';

const CHRONIC_THRESHOLD = 3; // Number of recurrences to be considered chronic

const STATUS_CFG = {
  open: { label: 'OPEN', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
  expiring_soon: { label: 'EXPIRING SOON', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  expired: { label: 'EXPIRED', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
  cleared: { label: 'CLEARED', color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/30' },
};

const CATEGORY_CFG = {
  A: { label: 'CAT A', color: 'text-red-400', bg: 'bg-red-700', desc: 'ASAP' },
  B: { label: 'CAT B', color: 'text-orange-400', bg: 'bg-orange-700', desc: '3 Days' },
  C: { label: 'CAT C', color: 'text-amber-400', bg: 'bg-amber-700', desc: '10 Days' },
  D: { label: 'CAT D', color: 'text-blue-400', bg: 'bg-blue-700', desc: '120 Days' },
};

function ChronicMelCard({ mel, recurrenceCount, logEntries }) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CFG[mel.status] || STATUS_CFG.open;
  const categoryCfg = CATEGORY_CFG[mel.category] || CATEGORY_CFG.C;
  
  const daysRemaining = mel.expiry_date 
    ? Math.ceil((new Date(mel.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  
  const relatedLogEntries = logEntries.filter(e => 
    e.aircraft_tail === mel.aircraft_tail && 
    e.mel_reference?.includes(mel.item_number)
  );

  return (
    <div className={cn('bg-card border rounded-2xl overflow-hidden transition-all', statusCfg.border)}>
      <div onClick={() => setExpanded(!expanded)} className="px-5 py-4 cursor-pointer hover:bg-secondary/30 transition-colors">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-[10px] font-black px-2 py-0.5 rounded text-white', categoryCfg.bg)}>
              {categoryCfg.label}
            </span>
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', statusCfg.bg, statusCfg.color)}>
              {statusCfg.label}
            </span>
            <span className="text-xs font-mono font-bold text-primary">{mel.aircraft_tail}</span>
            <span className="text-xs font-bold text-foreground">ATA {mel.ata_chapter || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            {daysRemaining !== null && (
              <div className={cn('text-right', daysRemaining <= 3 ? 'text-red-400' : 'text-muted-foreground')}>
                <p className="text-[10px] font-bold uppercase">Days Left</p>
                <p className="text-lg font-black">{daysRemaining}</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-sm font-bold text-foreground mb-2">{mel.description}</p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Deferred: {mel.deferred_date ? new Date(mel.deferred_date).toLocaleDateString() : '—'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Expires: {mel.expiry_date ? new Date(mel.expiry_date).toLocaleDateString() : '—'}
          </span>
          {recurrenceCount >= CHRONIC_THRESHOLD && (
            <span className="flex items-center gap-1 text-orange-400 font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              {recurrenceCount} recurrences
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {mel.etops_impact && mel.etops_impact !== 'OK' && (
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded',
              mel.etops_impact === 'NO_ETOPS' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
              'bg-orange-500/15 text-orange-400 border border-orange-500/30')}>
              {mel.etops_impact === 'NO_ETOPS' ? 'NO ETOPS' : 'ETOPS LIMITED'}
            </span>
          )}
          {mel.placard_required && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/30">
              📋 Placard Required
            </span>
          )}
          {mel.flight_restrictions && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
              ⚠ Flight Restrictions
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-border space-y-4">
          {/* Capability Impact */}
          <div className="grid grid-cols-2 gap-3">
            <CatCapabilityBadge aircraft={{ tail_number: mel.aircraft_tail }} melItems={[mel]} />
            <EtopsCapabilityBadge aircraft={{ tail_number: mel.aircraft_tail }} melItems={[mel]} />
          </div>

          {/* Procedures */}
          {(mel.ops_procedure || mel.mx_procedure) && (
            <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Procedures</p>
              {mel.ops_procedure && (
                <div>
                  <p className="text-[10px] font-bold text-primary mb-1">OPS PROCEDURE:</p>
                  <p className="text-xs text-foreground">{mel.ops_procedure}</p>
                </div>
              )}
              {mel.mx_procedure && (
                <div>
                  <p className="text-[10px] font-bold text-primary mb-1">MX PROCEDURE:</p>
                  <p className="text-xs text-foreground">{mel.mx_procedure}</p>
                </div>
              )}
            </div>
          )}

          {/* Flight Restrictions */}
          {mel.flight_restrictions && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p className="text-xs font-extrabold text-amber-400 uppercase tracking-widest mb-1">Flight Restrictions</p>
              <p className="text-sm text-amber-100">{mel.flight_restrictions}</p>
            </div>
          )}

          {/* Related Log Entries */}
          {relatedLogEntries.length > 0 && (
            <div>
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-2">Related Log Entries</p>
              <div className="space-y-2">
                {relatedLogEntries.slice(0, 5).map(entry => (
                  <div key={entry.id} className="bg-background border border-border rounded-lg px-3 py-2 text-xs">
                    <p className="text-primary font-mono">{entry.log_page || '—'}</p>
                    <p className="text-foreground mt-1">{entry.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Link 
              to={`/AircraftDetail?tail=${mel.aircraft_tail}`}
              className="flex-1 text-center py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
            >
              View Aircraft
            </Link>
            <Link 
              to={`/TechOpsLogbook?tail=${mel.aircraft_tail}`}
              className="flex-1 text-center py-2.5 rounded-xl border border-border bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition-colors"
            >
              Logbook
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, sub, color, icon: Icon, trend }) {
  const TrendIcon = trend > 0 ? ArrowUpRight : trend < 0 ? ArrowDownRight : Minus;
  const trendColor = trend > 0 ? 'text-red-400' : trend < 0 ? 'text-green-400' : 'text-muted-foreground';
  
  return (
    <div className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className={cn('w-6 h-6', color)} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={cn('text-3xl font-black', color)}>{value}</p>
          {trend !== undefined && (
            <TrendIcon className={cn('w-4 h-4', trendColor)} />
          )}
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function TechSupportDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stationFilter, setStationFilter] = useState('');
  const qc = useQueryClient();
  const { icaoCodes: stations } = useStations();

  const { data: melItems = [], isLoading, refetch } = useQuery({
    queryKey: ['chronic-mel-items'],
    queryFn: () => base44.entities.MELItem.list('-deferred_date', 500),
    refetchInterval: 60000,
  });

  const { data: logEntries = [] } = useQuery({
    queryKey: ['tech-support-logbook'],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 500),
    refetchInterval: 60000,
  });

  const { data: aircraft = [] } = useQuery({
    queryKey: ['tech-support-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 60000,
  });

  const { data: techSupportRequests = [] } = useQuery({
    queryKey: ['tech-support-requests-dashboard'],
    queryFn: () => base44.entities.LogbookEntry.filter({ entry_type: 'discrepancy' }, '-created_date', 200),
    select: (data) => data
      .filter(e => e.description?.includes('[TECH-SUPPORT]'))
      .map(e => {
        const meta = JSON.parse(e.notes || '{}');
        return {
          id: e.id,
          aircraft_tail: e.aircraft_tail,
          support_type: meta.support_type || 'troubleshooting',
          ata_chapter: e.ata_chapter,
          description: e.description.replace('[TECH-SUPPORT] ', ''),
          station: e.station || meta.station,
          specialist: e.technician_name,
          urgency: meta.urgency || 'routine',
          status: meta.status || 'open',
          created_date: e.created_date,
        };
      }),
    refetchInterval: 30000,
  });

  // Identify chronic MELs (same ATA chapter + item number appearing multiple times)
  const chronicMels = melItems.filter(m => m.status !== 'cleared');
  
  const recurrenceMap = chronicMels.reduce((acc, mel) => {
    const key = `${mel.aircraft_tail}-${mel.ata_chapter}-${mel.item_number}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Get aircraft by station
  const stationTails = stationFilter
    ? aircraft.filter(a => a.base_station === stationFilter).map(a => a.tail_number)
    : null;

  // Filter MELs
  const filteredMels = chronicMels.filter(mel => {
    if (filterCategory !== 'all' && mel.category !== filterCategory) return false;
    if (filterStatus !== 'all' && mel.status !== filterStatus) return false;
    if (stationTails && !stationTails.includes(mel.aircraft_tail)) return false;
    if (searchQuery && !mel.description?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !mel.aircraft_tail?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !mel.ata_chapter?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Filter tech support requests by station
  const filteredRequests = stationFilter
    ? techSupportRequests.filter(r => r.station === stationFilter)
    : techSupportRequests;

  // KPIs
  const openCount = chronicMels.filter(m => m.status === 'open').length;
  const expiringSoon = chronicMels.filter(m => {
    if (!m.expiry_date) return false;
    const days = Math.ceil((new Date(m.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
    return days <= 3 && days >= 0;
  }).length;
  const expired = chronicMels.filter(m => m.status === 'expired').length;
  const etopsImpacted = chronicMels.filter(m => m.etops_impact && m.etops_impact !== 'OK').length;
  const chronicCount = Object.values(recurrenceMap).filter(c => c >= CHRONIC_THRESHOLD).length;
  const activeRequests = filteredRequests.filter(r => r.status !== 'resolved').length;
  const aogRequests = filteredRequests.filter(r => r.urgency === 'aog' && r.status !== 'resolved').length;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-5 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Link to="/LineMaintenanceDashboard" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground">Tech Support Dashboard</h1>
              <p className="text-xs text-orange-400 tracking-widest uppercase">Chronic MEL Monitoring · Technical Assistance</p>
            </div>
          </div>
          <button onClick={() => refetch()} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
            <RefreshCw className={cn('w-4 h-4 text-muted-foreground', isLoading && 'animate-spin')} />
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label="Open MELs" value={openCount} color="text-red-400" icon={AlertTriangle} />
          <KpiCard label="Expiring Soon" value={expiringSoon} color="text-orange-400" icon={Clock} />
          <KpiCard label="Expired" value={expired} color="text-red-400" icon={Zap} />
          <KpiCard label="ETOPS Impacted" value={etopsImpacted} color="text-violet-400" icon={Shield} />
          <KpiCard label="Chronic Items" value={chronicCount} sub="≥3 recurrences" color="text-amber-400" icon={TrendingUp} />
          <KpiCard label="Total Active" value={chronicMels.length} color="text-blue-400" icon={BookOpen} />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          {/* Station Filter Dropdown */}
          <div className="relative flex items-center gap-2 bg-secondary border border-border rounded-xl px-3 py-2.5 min-w-[180px]">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="bg-secondary text-sm font-bold text-foreground outline-none flex-1 appearance-none cursor-pointer"
            >
              <option value="">All Stations</option>
              {stations.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 pointer-events-none" />
          </div>
          
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by tail, ATA, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_CFG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label} ({cfg.desc})</option>
            ))}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_CFG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5 space-y-6 max-w-7xl mx-auto">
        {/* Tech Support Requests Section */}
        {filteredRequests.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-400" />
                <p className="text-sm font-extrabold text-foreground uppercase tracking-widest">
                  Crew Chief Tech Support Requests {stationFilter && `— ${stationFilter}`}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-orange-400 font-bold">{activeRequests} Active</span>
                {aogRequests > 0 && <span className="text-red-400 font-bold">· {aogRequests} AOG</span>}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filteredRequests.slice(0, 6).map(req => {
                const urgencyColor = req.urgency === 'aog' ? 'border-red-500/50 bg-red-500/10' :
                  req.urgency === 'urgent' ? 'border-orange-500/40 bg-orange-500/10' : 'border-border';
                const statusColor = req.status === 'resolved' ? 'text-green-400' :
                  req.status === 'in_progress' ? 'text-yellow-400' : 'text-orange-400';
                return (
                  <div key={req.id} className={cn('bg-card border rounded-xl p-4 space-y-2', urgencyColor)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', statusColor, 'bg-transparent border', req.status === 'resolved' ? 'border-green-500/30' : 'border-orange-500/30')}>
                            {req.status.toUpperCase()}
                          </span>
                          <span className="text-xs font-mono font-bold text-primary">{req.aircraft_tail}</span>
                          {req.station && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5" /> {req.station}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-foreground">{req.description}</p>
                        {req.specialist && (
                          <p className="text-[10px] text-muted-foreground mt-1">Specialist: {req.specialist}</p>
                        )}
                      </div>
                      {req.urgency !== 'routine' && (
                        <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded',
                          req.urgency === 'aog' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400')}>
                          {req.urgency.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>ATA {req.ata_chapter || '—'}</span>
                      <span>·</span>
                      <span>{new Date(req.created_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chronic MELs Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <p className="text-sm font-extrabold text-foreground uppercase tracking-widest">Chronic MEL Items</p>
          </div>
          {filteredMels.length === 0 ? (
            <div className="text-center py-20">
              <CheckCircle className="w-16 h-16 text-green-500/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold text-lg">No MEL items match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredMels.map(mel => (
                <ChronicMelCard
                  key={mel.id}
                  mel={mel}
                  recurrenceCount={recurrenceMap[`${mel.aircraft_tail}-${mel.ata_chapter}-${mel.item_number}`] || 1}
                  logEntries={logEntries}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}