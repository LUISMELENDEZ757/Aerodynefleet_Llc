/**
 * Global Time Engine for Aerodyne Operations
 * Handles Zulu ↔ Local conversions, station offsets, DST, crew legality timing
 */

// ICAO station timezone offsets (simplified — production would use Intl API)
export const STATION_OFFSETS = {
  'KEWR': -5,  // EST
  'KJFK': -5,  // EST
  'KORD': -6,  // CST
  'KMCO': -5,  // EST
  'KLAX': -8,  // PST
  'KSFO': -8,  // PST
  'KDFW': -6,  // CST
  'KATL': -5,  // EST
  'KBOS': -5,  // EST
  'KDCA': -5,  // EST
  'KSEA': -8,  // PST
  'KDEN': -7,  // MST
  'KTPA': -5,  // EST
  'KMDW': -6,  // CST
  'KIAH': -6,  // CST
  'KLAS': -8,  // PST
  'KMIA': -5,  // EST
  'KPHX': -7,  // MST
  'KBWI': -5,  // EST
  'KPHL': -5,  // EST
};

export class TimeEngine {
  /**
   * Get current Zulu (UTC) time
   */
  static getZulu() {
    return new Date();
  }

  /**
   * Convert Zulu time to local time for a station
   * @param {Date|string} zuluTime - Zulu time
   * @param {string} station - ICAO station code (e.g., 'KEWR')
   * @returns {Date} Local time
   */
  static zuluToLocal(zuluTime, station) {
    const zulu = typeof zuluTime === 'string' ? new Date(zuluTime) : zuluTime;
    const offset = STATION_OFFSETS[station] || 0;
    const localTime = new Date(zulu.getTime() + offset * 60 * 60 * 1000);
    return localTime;
  }

  /**
   * Convert local time to Zulu for a station
   * @param {Date|string} localTime - Local time
   * @param {string} station - ICAO station code
   * @returns {Date} Zulu time
   */
  static localToZulu(localTime, station) {
    const local = typeof localTime === 'string' ? new Date(localTime) : localTime;
    const offset = STATION_OFFSETS[station] || 0;
    const zuluTime = new Date(local.getTime() - offset * 60 * 60 * 1000);
    return zuluTime;
  }

  /**
   * Format time as HH:MM Z (Zulu) or HH:MM L (local)
   * @param {Date} date - Date to format
   * @param {string} station - ICAO station (optional, for local)
   * @param {boolean} useZulu - True for Zulu, false for local
   * @returns {string} Formatted time
   */
  static formatTime(date, station, useZulu = true) {
    let displayTime = date;
    if (!useZulu && station) {
      displayTime = this.zuluToLocal(date, station);
    }
    const h = String(displayTime.getHours()).padStart(2, '0');
    const m = String(displayTime.getMinutes()).padStart(2, '0');
    return `${h}:${m} ${useZulu ? 'Z' : 'L'}`;
  }

  /**
   * Calculate crew legality remaining hours
   * FAR 117: Max 9 hours flight duty in 24-hour period
   * @param {number} hoursFlownLast24 - Hours flown in last 24 hours
   * @param {number} restHoursSince - Hours rested since last flight
   * @returns {object} {legal: boolean, hoursRemaining: number, status: string}
   */
  static checkCrewLegality(hoursFlownLast24, restHoursSince) {
    const maxFlightDuty = 9;
    const hoursRemaining = Math.max(0, maxFlightDuty - hoursFlownLast24);
    const legal = hoursRemaining > 0 && restHoursSince >= 10;

    return {
      legal,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10,
      status: !legal ? 'illegal' : hoursRemaining <= 2 ? 'near_limit' : 'legal',
    };
  }

  /**
   * Calculate block time (OUT → IN)
   * @param {string} outTime - HH:MM
   * @param {string} inTime - HH:MM
   * @returns {number} Minutes (handles midnight crossing)
   */
  static calcBlockTime(outTime, inTime) {
    const [oh, om] = outTime.split(':').map(Number);
    const [ih, im] = inTime.split(':').map(Number);

    const outMinutes = oh * 60 + om;
    let inMinutes = ih * 60 + im;

    if (inMinutes < outMinutes) {
      inMinutes += 24 * 60; // Midnight crossing
    }

    return inMinutes - outMinutes;
  }

  /**
   * Calculate delay propagation (cascade effect)
   * @param {number} delayMinutes - Initial delay
   * @returns {number} Propagated delay accounting for turnaround buffers
   */
  static calcPropagatedDelay(delayMinutes) {
    // Typical turnaround buffer is 40 min for domestic narrowbody
    const turnaroundBuffer = 40;
    if (delayMinutes <= turnaroundBuffer) {
      return 0; // Can recover
    }
    return delayMinutes - turnaroundBuffer;
  }

  /**
   * Get time until crew goes illegal
   * @param {number} hoursFlownLast24
   * @param {Date} nextFlightTime - Scheduled departure
   * @returns {number} Minutes until illegal
   */
  static minutesUntilIllegal(hoursFlownLast24, nextFlightTime) {
    const maxFlightDuty = 9;
    const hoursRemaining = maxFlightDuty - hoursFlownLast24;
    const now = new Date();
    const minutesAvailable = hoursRemaining * 60;
    const minutesUntilFlight = (nextFlightTime - now) / 60000;

    return Math.max(0, minutesAvailable - minutesUntilFlight);
  }
}