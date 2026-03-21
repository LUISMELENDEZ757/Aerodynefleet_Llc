import React from 'react';
import { Plane, Users, FileText, AlertTriangle } from 'lucide-react';

export default React.memo(function OpsStatBar({ flights, crew, releases }) {
  const airborne = flights.filter(f => f.status === 'airborne').length;
  const delayed  = flights.filter(f => f.status === 'delayed' || f.delay_minutes > 0).length;
  const illegal  = crew.filter(c => c.legal_status === 'illegal').length;
  const pending  = releases.filter(r => r.release_status === 'pending').length;

  const stats = [
    { icon: Plane,         label: 'Airborne',        value: airborne, color: 'text-green-400' },
    { icon: AlertTriangle, label: 'Delayed',          value: delayed,  color: delayed > 0 ? 'text-orange-400' : 'text-muted-foreground' },
    { icon: Users,         label: 'Crew Illegal',     value: illegal,  color: illegal > 0 ? 'text-destructive' : 'text-muted-foreground' },
    { icon: FileText,      label: 'Releases Pending', value: pending,  color: pending > 0 ? 'text-primary' : 'text-muted-foreground' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="rounded-xl bg-card border border-border px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <div>
            <p className={`text-2xl font-extrabold font-mono ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
});