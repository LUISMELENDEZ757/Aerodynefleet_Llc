import { useState, useCallback } from 'react';
import { issueMeNumber } from '@/lib/meNumberingClient';

/**
 * Hook for auto-allocating an M&E number in create flows.
 * Returns { autoGen, setAutoGen, issuing, issue }.
 * `issue(req)` returns the formatted number string or null on error.
 */
export function useAutoMeNumber(initialAuto = true) {
  const [autoGen, setAutoGen] = useState(initialAuto);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState(null);

  const issue = useCallback(async (req) => {
    setIssuing(true);
    setError(null);
    try {
      const res = await issueMeNumber(req);
      return res?.number || null;
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Issue failed');
      return null;
    } finally {
      setIssuing(false);
    }
  }, []);

  return { autoGen, setAutoGen, issuing, error };
}