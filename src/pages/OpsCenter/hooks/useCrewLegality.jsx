import { useMemo } from 'react';

// FAR Part 117 limits
const FAR117 = {
  maxFlightDutyPeriod: 9,   // hours (simplified, unaugmented)
  maxFlightTime:       8,   // hours per duty period
  minRest:             10,  // hours between duties
};

/**
 * Derives per-crew legality analysis from raw CrewAssignment records.
 * Returns enriched crew list with violation details and summary stats.
 */
export function useCrewLegality(crew = []) {
  const enriched = useMemo(() => crew.map(c => {
    const violations = [];

    // Flight time check
    if (c.total_flight_time_today > FAR117.maxFlightTime) {
      violations.push(`Flight time ${c.total_flight_time_today}h exceeds ${FAR117.maxFlightTime}h limit`);
    }

    // Rest check
    if (c.rest_hours_prior != null && c.rest_hours_prior < FAR117.minRest) {
      violations.push(`Only ${c.rest_hours_prior}h rest (min ${FAR117.minRest}h required)`);
    }

    // Duty period check (derive from duty_start / duty_end if available)
    let dutyHours = null;
    if (c.duty_start && c.duty_end) {
      const [sh, sm] = c.duty_start.split(':').map(Number);
      const [eh, em] = c.duty_end.split(':').map(Number);
      dutyHours = ((eh * 60 + em) - (sh * 60 + sm) + 1440) % 1440 / 60;
      if (dutyHours > FAR117.maxFlightDutyPeriod) {
        violations.push(`Duty period ${dutyHours.toFixed(1)}h exceeds ${FAR117.maxFlightDutyPeriod}h FDP`);
      }
    }

    const derivedStatus =
      violations.length > 0
        ? 'illegal'
        : c.rest_hours_prior != null && c.rest_hours_prior < FAR117.minRest + 2
          ? 'near_limit'
          : c.legal_status || 'legal';

    return { ...c, violations, dutyHours, derivedStatus };
  }), [crew]);

  const illegal   = enriched.filter(c => c.derivedStatus === 'illegal');
  const nearLimit = enriched.filter(c => c.derivedStatus === 'near_limit');
  const legal     = enriched.filter(c => c.derivedStatus === 'legal');

  return { enriched, illegal, nearLimit, legal, limits: FAR117 };
}