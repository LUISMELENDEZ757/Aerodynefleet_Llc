import { cn } from '@/lib/utils';

export default function MccKpiBar({ aircraft, oosEntries, melItems, faults, parts, tools }) {
  const totalAircraft  = aircraft.length;
  const activeAircraft = aircraft.filter(a => a.status === 'active').length;
  const oosAircraft    = aircraft.filter(a => a.status === 'oos' || a.status === 'maintenance').length;

  const openOOS      = oosEntries.filter(e => e.status === 'in_work' || e.status === 'waiting_on_parts').length;
  const aogParts     = parts.filter(p => p.status === 'aog_ordered').length;
  const openMEL      = melItems.filter(m => m.status === 'open' || m.status === 'expiring_soon').length;
  const expiredMEL   = melItems.filter(m => m.status === 'expired').length;
  const activeFaults = faults.filter(f => f.status === 'active').length;
  const warnFaults   = faults.filter(f => f.status === 'active' && f.severity === 'warning').length;
  const toolsOut     = tools.filter(t => t.status === 'checked_out').length;
  const calDue       = tools.filter(t => t.status === 'calibration_due').length;

  const kpis = [
    {
      label: 'Fleet / Active',
      value: `${activeAircraft} / ${totalAircraft}`,
      sub: `${oosAircraft} OOS`,
      color: oosAircraft > 0 ? 'text-red-400' : 'text-green-400',
      bg: oosAircraft > 0 ? 'bg-red-600/20' : 'bg-green-600/20',
    },
    {
      label: 'Open OOS / MX',
      value: openOOS,
      sub: 'in work',
      color: openOOS > 0 ? 'text-orange-400' : 'text-green-400',
      bg: 'bg-orange-600/20',
    },
    {
      label: 'MEL Items',
      value: openMEL,
      sub: expiredMEL > 0 ? `${expiredMEL} EXPIRED` : 'open',
      color: expiredMEL > 0 ? 'text-red-400' : openMEL > 0 ? 'text-amber-400' : 'text-green-400',
      bg: expiredMEL > 0 ? 'bg-red-600/20' : 'bg-amber-600/20',
    },
    {
      label: 'Active Faults',
      value: activeFaults,
      sub: warnFaults > 0 ? `${warnFaults} WARNING` : 'fleet-wide',
      color: warnFaults > 0 ? 'text-red-400' : activeFaults > 0 ? 'text-amber-400' : 'text-green-400',
      bg: 'bg-red-600/20',
    },
    {
      label: 'AOG Parts',
      value: aogParts,
      sub: 'critical orders',
      color: aogParts > 0 ? 'text-red-400' : 'text-green-400',
      bg: aogParts > 0 ? 'bg-red-600/20' : 'bg-green-600/20',
    },
    {
      label: 'Tools Out / Cal',
      value: `${toolsOut} / ${calDue}`,
      sub: 'checked out / due',
      color: calDue > 0 ? 'text-amber-400' : 'text-cyan-400',
      bg: 'bg-cyan-600/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 px-5 pt-5">
      {kpis.map(({ label, value, sub, color, bg }) => (
        <div key={label} className={cn('rounded-2xl border border-white/10 p-4', bg)}>
          <p className={cn('text-2xl font-extrabold', color)}>{value}</p>
          <p className="text-xs text-white font-bold mt-0.5">{label}</p>
          <p className={cn('text-[10px] font-bold mt-0.5', color)}>{sub}</p>
        </div>
      ))}
    </div>
  );
}