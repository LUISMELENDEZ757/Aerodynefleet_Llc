import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Shared hook — returns active stations from the Global Station registry.
 * Use `icaoCodes` for a plain sorted array of ICAO strings (e.g. ['KATL', 'KEWR', …])
 * Use `stations` for the full records (id, icao_code, station_name, region, …)
 */
export function useStations() {
  const { data: stations = [], isLoading } = useQuery({
    queryKey: ['global-stations'],
    queryFn: () => base44.entities.Station.list('icao_code', 500),
    staleTime: 300000,
    refetchInterval: 300000,
  });

  const active = stations.filter(s => s.is_active !== false);
  const icaoCodes = active.map(s => s.icao_code).sort();

  return { stations: active, icaoCodes, isLoading };
}