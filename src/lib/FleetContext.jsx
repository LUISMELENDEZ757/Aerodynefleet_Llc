import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const FleetContext = createContext({
  fleets: [],
  activeFleetId: null,   // null = "All Fleets"
  activeFleet: null,
  setActiveFleetId: () => {},
});

export function FleetProvider({ children }) {
  const [activeFleetId, setActiveFleetIdState] = useState(() => {
    try { return localStorage.getItem('active_fleet_id') || '69c56b4e764fbad32099b0a0'; } catch { return '69c56b4e764fbad32099b0a0'; }
  });

  const { data: fleets = [] } = useQuery({
    queryKey: ['fleets-global'],
    queryFn: () => base44.entities.Fleet.list('name', 50),
    staleTime: 60000,
  });

  const setActiveFleetId = (id) => {
    setActiveFleetIdState(id);
    try { localStorage.setItem('active_fleet_id', id || ''); } catch {}
  };

  const activeFleet = fleets.find(f => f.id === activeFleetId) || null;

  return (
    <FleetContext.Provider value={{ fleets, activeFleetId, activeFleet, setActiveFleetId }}>
      {children}
    </FleetContext.Provider>
  );
}

export function useFleet() {
  return useContext(FleetContext);
}

/** Returns a filter object to pass into entity queries */
export function useFleetFilter() {
  const { activeFleet } = useFleet();
  if (!activeFleet) return {}; // all fleets
  return { airline: activeFleet.name };
}