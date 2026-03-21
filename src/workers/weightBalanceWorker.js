/**
 * Weight & Balance Calculation Worker
 * Offloads CG, ZFW, and envelope validation to prevent UI blocking
 */

self.onmessage = (event) => {
  const { payload, type } = event.data;

  if (type === 'calculate_wb') {
    const result = calculateWeightBalance(payload);
    self.postMessage({ type: 'wb_result', result, id: event.data.id });
  }
};

function calculateWeightBalance(data) {
  const {
    aircraftType,
    oew,
    oewArm,
    paxData, // array of { station, weight, count }
    cargoData, // array of { station, weight }
    fuelWeight,
    fuelArm,
    mtow,
    mlw,
    mzfw,
    cgMin,
    cgMax,
  } = data;

  // Calculate total pax weight and moment
  let totalPaxWeight = 0;
  let totalPaxMoment = 0;
  paxData.forEach(({ station, weight, count }) => {
    const stationWeight = weight * count;
    totalPaxWeight += stationWeight;
    totalPaxMoment += stationWeight * station;
  });

  // Calculate total cargo weight and moment
  let totalCargoWeight = 0;
  let totalCargoMoment = 0;
  cargoData.forEach(({ station, weight }) => {
    totalCargoWeight += weight;
    totalCargoMoment += weight * station;
  });

  // Calculate ZFW and moment
  const zfw = oew + totalPaxWeight + totalCargoWeight;
  const zfwMoment = oew * oewArm + totalPaxMoment + totalCargoMoment;
  const zfwCg = zfw > 0 ? zfwMoment / zfw : 0;

  // Calculate TOW and moment
  const tow = zfw + fuelWeight;
  const towMoment = zfwMoment + fuelWeight * fuelArm;
  const towCg = tow > 0 ? towMoment / tow : 0;

  // Envelope validation
  const zfwExceeded = zfw > mzfw;
  const towExceeded = tow > mtow;
  const cgOutOfRange = zfwCg < cgMin || zfwCg > cgMax;

  return {
    zfw,
    tow,
    zfwCg: parseFloat(zfwCg.toFixed(2)),
    towCg: parseFloat(towCg.toFixed(2)),
    fuelWeight,
    paxWeight: totalPaxWeight,
    cargoWeight: totalCargoWeight,
    envelopeStatus: {
      zfwValid: !zfwExceeded,
      towValid: !towExceeded,
      cgValid: !cgOutOfRange,
      allValid: !zfwExceeded && !towExceeded && !cgOutOfRange,
    },
    exceeded: {
      zfw: zfwExceeded ? zfw - mzfw : 0,
      tow: towExceeded ? tow - mtow : 0,
    },
  };
}