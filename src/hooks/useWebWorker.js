import { useState, useEffect, useRef } from 'react';

/**
 * Generic hook for managing Web Worker communication
 * Usage:
 *   const { result, loading, error } = useWebWorker(workerPath, type, payload)
 */
export function useWebWorker(workerPath, type, payload) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const workerRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!workerPath) return;

    // Initialize worker once
    if (!workerRef.current) {
      try {
        workerRef.current = new Worker(new URL(workerPath, import.meta.url), {
          type: 'module',
        });

        workerRef.current.onmessage = (event) => {
          const { result, id } = event.data;
          if (id === requestIdRef.current) {
            setResult(result);
            setLoading(false);
          }
        };

        workerRef.current.onerror = (err) => {
          setError(err.message);
          setLoading(false);
        };
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    // Send message when payload changes
    if (payload && workerRef.current) {
      setLoading(true);
      setError(null);
      requestIdRef.current += 1;

      try {
        workerRef.current.postMessage({
          type,
          payload,
          id: requestIdRef.current,
        });
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    return () => {
      // Don't terminate worker on unmount — reuse for performance
    };
  }, [workerPath, type, payload]);

  return { result, loading, error };
}

/**
 * Hook for W&B calculations
 */
export function useWeightBalanceCalculation(aircraftData) {
  return useWebWorker(
    '../workers/weightBalanceWorker.js',
    'calculate_wb',
    aircraftData
  );
}

/**
 * Hook for FAR 117 compliance checks
 */
export function useFAR117Check(crewData) {
  return useWebWorker(
    '../workers/far117Worker.js',
    'check_far117',
    crewData
  );
}

/**
 * Hook for fatigue calculation
 */
export function useFatigueCalculation(fatigueData) {
  return useWebWorker(
    '../workers/far117Worker.js',
    'calculate_fatigue',
    fatigueData
  );
}

/**
 * Hook for pairing generation
 */
export function usePairingGeneration(schedulingData) {
  return useWebWorker(
    '../workers/schedulingWorker.js',
    'generate_pairings',
    schedulingData
  );
}

/**
 * Hook for bid processing
 */
export function useBidProcessing(bidData) {
  return useWebWorker(
    '../workers/schedulingWorker.js',
    'process_bids',
    bidData
  );
}

/**
 * Hook for schedule validation
 */
export function useScheduleValidation(scheduleData) {
  return useWebWorker(
    '../workers/schedulingWorker.js',
    'validate_schedule',
    scheduleData
  );
}