import React from 'react';
import { cn } from '@/lib/utils';
import { Users, AlertTriangle, MapPin, Zap } from 'lucide-react';
import useCabinConfig from '@/hooks/useCabinConfig';

export default function CabinZonesPanel({ aircraftType }) {
  const { cabinConfig, isLoading } = useCabinConfig(aircraftType);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-card border border-border px-4 py-6 text-center text-sm text-muted-foreground">
        Loading cabin zones…
      </div>
    );
  }

  if (!cabinConfig) {
    return (
      <div className="rounded-xl bg-card border border-border px-4 py-6 text-center text-sm text-muted-foreground">
        No cabin configuration available
      </div>
    );
  }

  const zones = cabinConfig.cabin_zones || [];
  const doors = cabinConfig.doors || [];
  const equipment = cabinConfig.emergency_equipment || {};
  const crew = cabinConfig.crew_stations || [];

  return (
    <div className="space-y-4">
      {/* Cabin zones grid */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cabin Zones</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {zones.map((zone) => (
            <div key={zone.zone_id} className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="px-4 py-3 bg-secondary/40 border-b border-border/50">
                <p className="text-sm font-bold text-foreground">{zone.name}</p>
                <p className="text-xs text-muted-foreground">Rows {zone.rows} · Cap: {zone.capacity} pax</p>
              </div>
              <div className="p-3 space-y-2 text-xs">
                {zone.crew_rest_seats > 0 && (
                  <div className="flex items-center gap-2 text-blue-400">
                    <Zap className="w-3 h-3" />
                    <span>{zone.crew_rest_seats} crew rest seat{zone.crew_rest_seats !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {zone.galley_position && (
                  <div className="flex items-center gap-2 text-primary">
                    <MapPin className="w-3 h-3" />
                    <span>Galley location</span>
                  </div>
                )}
                {zone.lavatory_count > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{zone.lavatory_count} lavatory{zone.lavatory_count !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency exits */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Emergency Exits & Doors</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {doors.map((door) => (
            <div key={door.door_id} className={cn(
              'rounded-lg px-3 py-2 border',
              door.slide_equipped ? 'bg-orange-500/10 border-orange-500/20' : 'bg-background/40 border-border'
            )}>
              <p className={cn('text-sm font-bold', door.slide_equipped ? 'text-orange-400' : 'text-foreground')}>
                {door.door_id}
              </p>
              <p className="text-xs text-muted-foreground capitalize">{door.type.replace('_', ' ')}</p>
              {door.slide_equipped && (
                <p className="text-xs text-orange-400 font-semibold mt-1">Slide equipped</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Crew stations */}
      {crew.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Crew Jump Seats</p>
          <div className="space-y-1.5">
            {crew.map((station) => (
              <div key={station.position} className="bg-card border border-border rounded-lg px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-foreground">{station.position}</p>
                    <p className="text-xs text-muted-foreground">{station.zone}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {(station.designated_exits || []).map((exit) => (
                      <span key={exit} className="text-xs bg-primary/15 text-primary font-mono font-bold px-1.5 py-0.5 rounded">
                        {exit}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency equipment summary */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Emergency Equipment</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Life Jackets', value: equipment.life_jackets, color: 'text-blue-400' },
            { label: 'Life Rafts', value: equipment.life_raft_locations?.length || 0, color: 'text-primary' },
            { label: 'First Aid Kits', value: equipment.first_aid_kits, color: 'text-green-400' },
            { label: 'AEDs', value: equipment.aed_locations?.length || 0, color: 'text-orange-400' },
            { label: 'Fire Extinguishers', value: equipment.fire_extinguishers?.length || 0, color: 'text-destructive' },
            { label: 'Oxygen Masks', value: equipment.oxygen_masks, color: 'text-muted-foreground' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-background/40 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn('text-lg font-bold', color)}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Galley info */}
      {cabinConfig.galley_config && (
        <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-3">
          <p className="text-xs font-bold text-primary mb-2">Galley Configuration</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-primary">
            <div>
              <p className="text-muted-foreground">Galley Count</p>
              <p className="font-bold">{cabinConfig.galley_config.galley_count}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Oven Capacity</p>
              <p className="font-bold">{cabinConfig.galley_config.oven_capacity}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Water Capacity</p>
              <p className="font-bold">{cabinConfig.galley_config.water_capacity} gal</p>
            </div>
            {(cabinConfig.galley_config.galley_locations || []).length > 0 && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Locations</p>
                <p className="font-mono text-xs">{cabinConfig.galley_config.galley_locations.join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}