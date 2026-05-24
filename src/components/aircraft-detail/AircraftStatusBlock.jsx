import { MapPin, Plane, Clock, User, Wrench, Fuel, Zap, Cpu, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

function StatusRow({ icon: Icon, label, value, valueColor }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
        <p className={cn('text-sm font-bold mt-0.5', valueColor || 'text-foreground')}>{value || '—'}</p>
      </div>
    </div>
  );
}

function StatusCard({ title, children }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-2">{title}</p>
      {children}
    </div>
  );
}

export default function AircraftStatusBlock({ aircraft, melItems }) {
  const openMels = melItems?.filter(m => m.status !== 'cleared' && m.status !== 'voided') || [];
  const expiredMels = melItems?.filter(m => m.status === 'expired') || [];
  const cdlItems = []; // CDL support can be added later

  const locationLabel = aircraft?.location_label
    ? `${(aircraft.location_type || 'unknown').toUpperCase()} — ${aircraft.location_label}`
    : aircraft?.base_station || '—';

  return (
    <div className="space-y-4">
      <h2 className="text-base font-extrabold text-foreground">Aircraft Status Block</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left — Operational */}
        <StatusCard title="Operational">
          <StatusRow icon={MapPin} label="Current Location" value={locationLabel} valueColor="text-cyan-400" />
          <StatusRow icon={Plane} label="Base Station" value={aircraft?.base_station} />
          <StatusRow icon={Activity} label="Operational Status" value={aircraft?.status?.toUpperCase()} valueColor={
            aircraft?.status === 'active' ? 'text-green-400' :
            aircraft?.status === 'oos' ? 'text-red-400' :
            'text-amber-400'
          } />
          <StatusRow icon={Clock} label="Engine Type" value={aircraft?.engine_type} />
          <StatusRow icon={User} label="CAT Approval" value={aircraft?.cat_approval} valueColor="text-blue-400" />
          <StatusRow icon={Wrench} label="ETOPS Approval" value={aircraft?.etops_approval ? `ETOPS-${aircraft.etops_approval}` : 'Non-ETOPS'} valueColor="text-cyan-400" />
        </StatusCard>

        {/* Right — MEL/CDL Summary */}
        <StatusCard title="MEL / CDL Summary">
          <StatusRow
            icon={Zap}
            label="MEL Count"
            value={`${openMels.length} Open${expiredMels.length > 0 ? ` (${expiredMels.length} Expired)` : ''}`}
            valueColor={openMels.length > 0 ? 'text-amber-400' : 'text-green-400'}
          />
          <StatusRow
            icon={Zap}
            label="CDL Count"
            value={`${cdlItems.length} Items`}
            valueColor={cdlItems.length > 0 ? 'text-amber-400' : 'text-green-400'}
          />
          <StatusRow icon={Cpu} label="APU Status" value={aircraft?.notes?.includes('APU') ? 'See Notes' : 'N/A'} />
          <StatusRow icon={Plane} label="RVSM Approved" value={aircraft?.rvsm_approved !== false ? 'Yes' : 'No'} valueColor={aircraft?.rvsm_approved !== false ? 'text-green-400' : 'text-red-400'} />
          <StatusRow icon={Plane} label="Polar Approved" value={aircraft?.polar_approved ? 'Yes' : 'No'} valueColor={aircraft?.polar_approved ? 'text-green-400' : 'text-muted-foreground'} />
          <StatusRow icon={Activity} label="RNP Capability" value={aircraft?.rnp_capability} />
        </StatusCard>

        {/* Aircraft Specs */}
        <StatusCard title="Aircraft Specs">
          <StatusRow icon={Plane} label="Aircraft Type" value={aircraft?.aircraft_type} />
          <StatusRow icon={Activity} label="MSN" value={aircraft?.msn} />
          <StatusRow icon={Activity} label="Line Number" value={aircraft?.line_number} />
          <StatusRow icon={Clock} label="Delivery Date" value={aircraft?.delivery_date ? new Date(aircraft.delivery_date).toLocaleDateString() : '—'} />
          <StatusRow icon={Cpu} label="Engine Variant" value={aircraft?.engine_variant} />
          <StatusRow icon={Activity} label="MTOW Variant" value={aircraft?.mtow_variant} />
        </StatusCard>

        {/* Alerts */}
        <StatusCard title="Active Alerts">
          {aircraft?.mcc_watch && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 mb-2">
              <span className="text-amber-400 text-xs font-extrabold animate-pulse">👁 MCC WATCH ACTIVE</span>
            </div>
          )}
          {aircraft?.ferry_flight && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-500/20 border border-sky-500/40 mb-2">
              <span className="text-sky-400 text-xs font-extrabold">✈ FERRY FLIGHT SCHEDULED</span>
            </div>
          )}
          {expiredMels.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-900/20 border border-red-500/40 mb-2">
              <span className="text-red-400 text-xs font-extrabold">🔴 {expiredMels.length} EXPIRED MEL{expiredMels.length > 1 ? 'S' : ''}</span>
            </div>
          )}
          {!aircraft?.mcc_watch && !aircraft?.ferry_flight && expiredMels.length === 0 && (
            <p className="text-sm text-green-400 font-bold py-2">No active alerts</p>
          )}
        </StatusCard>
      </div>
    </div>
  );
}