/**
 * Scheduling Calculations Worker
 * Offloads pairing generation, bid processing, and schedule optimization
 */

self.onmessage = (event) => {
  const { payload, type } = event.data;

  if (type === 'generate_pairings') {
    const result = generatePairings(payload);
    self.postMessage({ type: 'pairings_result', result, id: event.data.id });
  } else if (type === 'process_bids') {
    const result = processBids(payload);
    self.postMessage({ type: 'bids_result', result, id: event.data.id });
  } else if (type === 'validate_schedule') {
    const result = validateSchedule(payload);
    self.postMessage({ type: 'schedule_result', result, id: event.data.id });
  }
};

function generatePairings(data) {
  const { flights, crewAvailable, constraints } = data;
  const pairings = [];

  // Group consecutive flights into potential pairings
  let currentPairing = [];
  let currentDutyTime = 0;

  for (let i = 0; i < flights.length; i++) {
    const flight = flights[i];
    const flightDuration = parseFloat(flight.duration) || 2;

    // Check if adding this flight violates constraints
    const wouldExceedDuty = currentDutyTime + flightDuration > constraints.maxDutyPeriod;
    const wouldExceedRest = i > 0 && flights[i - 1].sta > flight.std - 1; // Less than 1 hour turnaround

    if (currentPairing.length > 0 && (wouldExceedDuty || wouldExceedRest)) {
      // Finalize current pairing
      pairings.push({
        id: `pair_${pairings.length}`,
        flights: [...currentPairing],
        totalDuty: currentDutyTime,
        startTime: currentPairing[0].std,
        endTime: currentPairing[currentPairing.length - 1].sta,
        feasible: true,
      });
      currentPairing = [];
      currentDutyTime = 0;
    }

    currentPairing.push(flight);
    currentDutyTime += flightDuration;
  }

  // Add final pairing
  if (currentPairing.length > 0) {
    pairings.push({
      id: `pair_${pairings.length}`,
      flights: [...currentPairing],
      totalDuty: currentDutyTime,
      startTime: currentPairing[0].std,
      endTime: currentPairing[currentPairing.length - 1].sta,
      feasible: true,
    });
  }

  return { pairings, totalPairings: pairings.length };
}

function processBids(data) {
  const { bids, crewList, pairings } = data;
  const assignments = [];
  const unassignedPairings = [...pairings];

  // Sort bids by priority (preferential order)
  const sortedBids = [...bids].sort((a, b) => a.preferenceOrder - b.preferenceOrder);

  for (const bid of sortedBids) {
    // Find matching pairing for this bid
    const matchingPairing = unassignedPairings.find(p => {
      const pairingStartDate = new Date(p.startTime).toDateString();
      const bidDate = new Date(bid.dateRange.start).toDateString();
      return pairingStartDate === bidDate;
    });

    if (matchingPairing) {
      assignments.push({
        crewMemberId: bid.crewMemberId,
        pairingId: matchingPairing.id,
        status: 'assigned',
        bidRank: bid.preferenceOrder,
      });

      // Remove assigned pairing from unassigned list
      const idx = unassignedPairings.findIndex(p => p.id === matchingPairing.id);
      if (idx > -1) unassignedPairings.splice(idx, 1);
    }
  }

  return {
    assignments,
    assignedCount: assignments.length,
    unassignedCount: unassignedPairings.length,
    coverageRate: ((assignments.length / pairings.length) * 100).toFixed(1),
  };
}

function validateSchedule(data) {
  const { flights, assignments, crewList } = data;
  const violations = [];

  // Check crew rest violations
  const crewFlights = {};
  flights.forEach(flight => {
    const assignedCrew = assignments.find(a => {
      const pairing = a.pairing || {};
      return pairing.flights && pairing.flights.some(f => f.id === flight.id);
    });

    if (assignedCrew) {
      if (!crewFlights[assignedCrew.crewMemberId]) {
        crewFlights[assignedCrew.crewMemberId] = [];
      }
      crewFlights[assignedCrew.crewMemberId].push(flight);
    }
  });

  // Validate rest between assignments
  for (const [crewId, crewAssignments] of Object.entries(crewFlights)) {
    const sorted = crewAssignments.sort((a, b) => new Date(a.sta) - new Date(b.sta));

    for (let i = 1; i < sorted.length; i++) {
      const prevEnd = new Date(sorted[i - 1].sta);
      const nextStart = new Date(sorted[i].std);
      const restHours = (nextStart - prevEnd) / (1000 * 60 * 60);

      if (restHours < 10) {
        violations.push({
          type: 'insufficient_rest',
          crewId,
          restProvided: restHours.toFixed(1),
          restRequired: 10,
          severity: 'high',
        });
      }
    }
  }

  return {
    valid: violations.length === 0,
    violationCount: violations.length,
    violations,
  };
}