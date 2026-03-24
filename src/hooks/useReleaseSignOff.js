import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const TODAY = new Date().toISOString().split('T')[0];

/**
 * Manages dispatch release fetch + pilot sign-off state for a flight.
 */
export function useReleaseSignOff(flightNumber, enabled = true) {
  const queryClient = useQueryClient();
  const [captainSig, setCaptainSig] = useState(null);   // { name, timestamp }
  const [foSig, setFoSig]           = useState(null);

  const { data: release, isLoading } = useQuery({
    queryKey: ['release-signoff', flightNumber, TODAY],
    queryFn: async () => {
      const res = await base44.entities.DispatchRelease.filter({
        flight_number: flightNumber,
        flight_date: TODAY,
      });
      return res[0] || null;
    },
    enabled: !!flightNumber && enabled,
  });

  const amendMutation = useMutation({
    mutationFn: ({ id, remarks }) =>
      base44.entities.DispatchRelease.update(id, {
        release_status: 'amended',
        remarks,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['release-signoff', flightNumber, TODAY] }),
  });

  const signAsCaptain = (name) =>
    setCaptainSig({ name, timestamp: new Date().toISOString() });

  const signAsFO = (name) =>
    setFoSig({ name, timestamp: new Date().toISOString() });

  const clearSignatures = () => {
    setCaptainSig(null);
    setFoSig(null);
  };

  const bothSigned = !!captainSig && !!foSig;

  return {
    release,
    isLoading,
    captainSig,
    foSig,
    bothSigned,
    signAsCaptain,
    signAsFO,
    clearSignatures,
    amendRelease: amendMutation.mutate,
    isAmending: amendMutation.isPending,
  };
}