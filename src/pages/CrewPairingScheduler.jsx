import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Users, Plane, Calendar, Plus, RefreshCw, AlertTriangle, CheckCircle, Clock, Filter, Download } from 'lucide-react';
import PairingBoard from '@/components/crew/pairing/PairingBoard';
import PairingBuilder from '@/components/crew/pairing/PairingBuilder';
import CrewRosterPanel from '@/components/crew/pairing/CrewRosterPanel';
import LegalityMatrix from '@/components/crew/pairing/LegalityMatrix';
import PairingAnalytics from '@/components/crew/pairing/PairingAnalytics';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'board',     label: 'Pairing Board' },
  { key: 'builder',   label: 'Pairing Builder' },
  { key: 'roster',    label: 'Crew Roster' },
  { key: 'legality',  label: 'Legality Matrix' },
  { key: 'analytics', label: 'Analytics' },
];

// KPI summary data
const KPI = [
  { label: 'Open Pairings',    value: 3,   color: 'text-rose-400',    bg: 'bg-rose-500/10' },
  { label: 'Crew Covered',     value: '94%', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { label: 'Legality Alerts',  value: 2,   color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  { label: 'Deadheads',        value: 4,   color: 'text-sky-400',     bg: 'bg-sky-500/10' },
  { label: 'Reserve Active',   value: 6,   color: 'text-purple-400',  bg: 'bg-purple-500/10' },
  { label: 'Pairings Today',   value: 18,  color: 'text-primary',     bg: 'bg-primary/10' },
];

export default function CrewPairingScheduler() {
  const [activeTab, setActiveTab] = useState('board');
  const [bidPeriod, setBidPeriod] = useState('APR 2026');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 py-4 flex-shrink-0">
        <div className="flex items-center gap-4 flex-wrap">
          <Link to="/Home" className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">Crew Pairing Scheduler</h1>
              <p className="text-[11px] text-muted-foreground uppercase tracking-widest">Flight Crew & Cabin Crew · FAR 117 Compliant</p>
            </div>
          </div>

          {/* Bid period selector */}
          <select value={bidPeriod} onChange={e => setBidPeriod(e.target.value)}
            className="ml-auto bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground font-bold outline-none focus:ring-1 focus:ring-primary">
            {['MAR 2026','APR 2026','MAY 2026'].map(p => <option key={p}>{p}</option>)}
          </select>

          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> New Pairing
          </button>
          <button className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <Download className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* KPI bar */}
        <div className="flex gap-3 mt-4 flex-wrap">
          {KPI.map(k => (
            <div key={k.label} className={cn('flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10', k.bg)}>
              <span className={cn('text-lg font-black', k.color)}>{k.value}</span>
              <span className="text-[10px] text-muted-foreground font-semibold">{k.label}</span>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mt-4 flex-wrap">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={cn('px-4 py-2 rounded-xl text-xs font-bold transition-all',
                activeTab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-white/5')}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-5">
        {activeTab === 'board'     && <PairingBoard bidPeriod={bidPeriod} />}
        {activeTab === 'builder'   && <PairingBuilder />}
        {activeTab === 'roster'    && <CrewRosterPanel />}
        {activeTab === 'legality'  && <LegalityMatrix />}
        {activeTab === 'analytics' && <PairingAnalytics />}
      </div>
    </div>
  );
}