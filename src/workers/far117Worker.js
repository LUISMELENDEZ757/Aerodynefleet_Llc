/**
 * FAR Part 117 Compliance Worker
 * Offloads crew fatigue and duty time calculations to prevent UI blocking
 */

self.onmessage = (event) => {
  const { payload, type } = event.data;

  if (type === 'check_far117') {
    const result = checkFAR117Compliance(payload);
    self.postMessage({ type: 'far117_result', result, id: event.data.id });
  } else if (type === 'calculate_fatigue') {
    const result = calculateFatigueMetrics(payload);
    self.postMessage({ type: 'fatigue_result', result, id: event.data.id });
  }
};

function checkFAR117Compliance(data) {
  const {
    crewType, // 'pilot' or 'flight_attendant'
    flightHours,
    dutyPeriodHours,
    restHoursPrior,
    acclimationDays,
    flightLegsToday,
    consecutiveDutyDays,
  } = data;

  // FAR 117 limits (simplified)
  const limits = crewType === 'pilot'
    ? {
        maxFlightHours: 8,
        maxDutyPeriod: 9,
        minRestRequired: 10,
        maxConsecutiveDuty: 7,
        minRestBetweenDuties: 10,
      }
    : {
        maxFlightHours: 10,
        maxDutyPeriod: 14,
        minRestRequired: 9,
        maxConsecutiveDuty: 5,
        minRestBetweenDuties: 9,
      };

  const legalStatus = {
    flightHoursOK: flightHours <= limits.maxFlightHours,
    dutyPeriodOK: dutyPeriodHours <= limits.maxDutyPeriod,
    restOK: restHoursPrior >= limits.minRestRequired,
    consecutiveDutyOK: consecutiveDutyDays <= limits.maxConsecutiveDuty,
  };

  const allLegal = Object.values(legalStatus).every(v => v);
  const nearLimit = !allLegal && Object.values(legalStatus).filter(v => !v).length === 1;

  return {
    status: allLegal ? 'legal' : nearLimit ? 'near_limit' : 'illegal',
    details: legalStatus,
    violations: Object.entries(legalStatus)
      .filter(([, value]) => !value)
      .map(([key]) => key),
    hoursRemaining: {
      flightHours: Math.max(0, limits.maxFlightHours - flightHours),
      dutyPeriod: Math.max(0, limits.maxDutyPeriod - dutyPeriodHours),
    },
  };
}

function calculateFatigueMetrics(data) {
  const {
    hoursSleptLastNight,
    hoursAwake,
    flightDurations, // array of flight hours
    legNumber,
    acclimationDays,
    circadianDisruptionFactor,
  } = data;

  // Fatigue scoring (0-100)
  let fatigueScore = 0;

  // Sleep debt (0-30 points)
  const sleepDebt = Math.max(0, 8 - hoursSleptLastNight);
  fatigueScore += Math.min(30, sleepDebt * 3);

  // Hours awake (0-30 points)
  fatigueScore += Math.min(30, hoursAwake * 0.75);

  // Flight leg accumulation (0-20 points)
  fatigueScore += Math.min(20, legNumber * 2);

  // Circadian disruption (0-20 points)
  fatigueScore += circadianDisruptionFactor * 20;

  // Acclimation impact (0-10 points)
  if (acclimationDays < 3) {
    fatigueScore += (3 - acclimationDays) * 3;
  }

  fatigueScore = Math.min(100, Math.round(fatigueScore));

  const fatigueLevel =
    fatigueScore < 20 ? 'low'
    : fatigueScore < 40 ? 'moderate'
    : fatigueScore < 70 ? 'high'
    : 'critical';

  return {
    score: fatigueScore,
    level: fatigueLevel,
    breakdown: {
      sleepDebt: Math.min(30, sleepDebt * 3),
      hoursAwake: Math.min(30, hoursAwake * 0.75),
      legAccumulation: Math.min(20, legNumber * 2),
      circadianDisruption: circadianDisruptionFactor * 20,
      acclimationImpact: acclimationDays < 3 ? (3 - acclimationDays) * 3 : 0,
    },
    recommendation:
      fatigueScore > 70 ? 'Recommend rest or crew change'
      : fatigueScore > 50 ? 'Monitor closely'
      : 'Within acceptable limits',
  };
}