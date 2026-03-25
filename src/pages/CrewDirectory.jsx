import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Users, Search, Phone, Mail, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_CONFIG = {
  captain:          { label: 'CPT',  color: 'text-primary bg-primary/15' },
  first_officer:    { label: 'F/O',  color: 'text-blue-400 bg-blue-500/15' },
  flight_attendant: { label: 'F/A',  color: 'text-purple-400 bg-purple-500/15' },
  dispatcher:       { label: 'DISP', color: 'text-orange-400 bg-orange-500/15' },
};

const LEGAL_CONFIG = {
  legal:      { label: 'Legal',     color: 'text-green-400' },
  near_limit: { label: 'Near',      color: 'text-orange-400' },
  illegal:    { label: 'ILLEGAL',   color: 'text-destructive' },
};

function CrewCard({ crew }) {
  const role = ROLE_CONFIG[crew.role] || { label: crew.role, color: 'text-muted-foreground bg-muted' };
  const legal = LEGAL_CONFIG[crew.legal_status] || { label: 'Unknown', color: 'text-muted-foreground' };
  const initials = crew.crew_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <div className="rounded-xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground truncate">{crew.crew_name}</p>
            <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0', role.color)}>{role.label}</span>
          </div>
          <p className="text-xs text-muted-foreground">{crew.employee_id || 'No ID'} · {crew.aircraft_type || 'All types'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-background/40 rounded-lg px-3 py-2">
          <p className="text-muted-foreground">Flight</p>
          <p className="font-mono font-bold text-foreground">{crew.flight_number || '—'}</p>
        </div>
        <div className="bg-background/40 rounded-lg px-3 py-2">
          <p className="text-muted-foreground">FAR 117</p>
          <p className={cn('font-bold', legal.color)}>{legal.label}</p>
        </div>
        {crew.duty_start && (
          <div className="bg-background/40 rounded-lg px-3 py-2">
            <p className="text-muted-foreground">Duty</p>
            <p className="font-mono font-bold text-foreground">{crew.duty_start} – {crew.duty_end || '?'}</p>
          </div>
        )}
        {crew.rest_hours_prior != null && (
          <div className="bg-background/40 rounded-lg px-3 py-2">
            <p className="text-muted-foreground">Rest Prior</p>
            <p className="font-mono font-bold text-foreground">{crew.rest_hours_prior}h</p>
          </div>
        )}
      </div>

      {crew.notes && (
        <p className="text-xs text-muted-foreground bg-background/40 rounded-lg px-3 py-2">{crew.notes}</p>
      )}
    </div>
  );
}

export default function CrewDirectory() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const TODAY = new Date().toISOString().split('T')[0];

  const { data: crew = [], isLoading, refetch } = useQuery({
    queryKey: ['crew-directory', TODAY],
    queryFn: () => base44.entities.CrewAssignment.filter({ flight_date: TODAY }),
    refetchInterval: 60000,
  });

  const filtered = crew
    .filter(c => roleFilter === 'all' || c.role === roleFilter)
    .filter(c => !search || c.crew_name?.toLowerCase().includes(search.toLowerCase()) || c.employee_id?.includes(search) || c.flight_number?.includes(search));

  const counts = {
    captain: crew.filter(c => c.role === 'captain').length,
    first_officer: crew.filter(c => c.role === 'first_officer').length,
    flight_attendant: crew.filter(c => c.role === 'flight_attendant').length,
    dispatcher: crew.filter(c => c.role === 'dispatcher').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <Users className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">CREW DIRECTORY</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">All Crew · Roles · FAR 117 Status</p>
            </div>
          </div>
          <button onClick={refetch} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(counts).map(([role, count]) => {
            const cfg = ROLE_CONFIG[role];
            return (
              <div key={role} className="rounded-xl bg-card border border-border px-3 py-2 text-center">
                <p className={cn('text-xl font-extrabold font-mono', cfg.color.split(' ')[0])}>{count}</p>
                <p className="text-xs text-muted-foreground">{cfg.label}</p>
              </div>
            );
          })}
        </div>

        {/* Search + role filter */}
        <div className="flex gap-2 flex-col sm:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input placeholder="Search by name, ID, or flight…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-10 bg-card border border-border rounded-xl pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="flex gap-1 bg-secondary rounded-xl p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'captain', label: 'CPT' },
              { key: 'first_officer', label: 'F/O' },
              { key: 'flight_attendant', label: 'F/A' },
              { key: 'dispatcher', label: 'DISP' },
            ].map(r => (
              <button key={r.key} onClick={() => setRoleFilter(r.key)}
                className={cn('px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all',
                  roleFilter === r.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">Loading crew…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No crew members found{search ? ' matching your search' : ' for today'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(c => <CrewCard key={c.id} crew={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}