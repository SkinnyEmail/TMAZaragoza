import { getSIDByDesignator } from './sidData';
import { AIRCRAFT_STATES } from './aircraftStates';
import { AIRCRAFT_PERFORMANCE } from './aircraftPerformance';

const SIDEngine = {
  /**
   * Updates aircraft following a SID procedure
   * @param {Object} aircraft - The aircraft object
   * @param {number} deltaTime - Time elapsed since last update (seconds)
   * @returns {Object} Updated aircraft object
   */
  updateAircraftWithSID: (aircraft, deltaTime) => {
    // Only process SID if aircraft has one assigned and hasn't completed it
    if (!aircraft.assignedSID || aircraft.sidComplete) {
      return aircraft;
    }

    // Don't process SID if aircraft is still parked
    if (aircraft.state === AIRCRAFT_STATES.PARKED) {
      return aircraft;
    }

    const sid = getSIDByDesignator(aircraft.assignedSID);
    if (!sid) {
      console.warn(`SID not found: ${aircraft.assignedSID}`);
      return aircraft;
    }

    // Get current waypoint
    const waypointIndex = aircraft.sidWaypointIndex || 0;
    if (waypointIndex >= sid.waypoints.length) {
      // SID complete
      return SIDEngine.completeSID(aircraft, sid);
    }

    const currentWaypoint = sid.waypoints[waypointIndex];

    // Calculate distance to current waypoint in nautical miles
    const distanceToWaypoint = SIDEngine.calculateDistance(
      aircraft.position.lat,
      aircraft.position.lon,
      currentWaypoint.lat,
      currentWaypoint.lon
    );

    // Calculate bearing TO the current waypoint
    const bearingToWaypoint = SIDEngine.calculateBearing(
      aircraft.position.lat,
      aircraft.position.lon,
      currentWaypoint.lat,
      currentWaypoint.lon
    );

    let updatedAircraft = { ...aircraft };

    // Gradually turn toward the waypoint using aircraft turn rate
    const performance = AIRCRAFT_PERFORMANCE[aircraft.type];
    const turnRate = performance.turnRate; // degrees per second

    // Calculate heading difference (shortest turn direction)
    let headingDiff = bearingToWaypoint - aircraft.heading;
    if (headingDiff > 180) headingDiff -= 360;
    if (headingDiff < -180) headingDiff += 360;

    // Calculate maximum turn this frame
    const maxTurnThisFrame = turnRate * deltaTime;

    // Apply turn (clamped to not overshoot)
    if (Math.abs(headingDiff) > 1) { // 1° tolerance
      const turnAmount = Math.sign(headingDiff) * Math.min(Math.abs(headingDiff), maxTurnThisFrame);
      updatedAircraft.heading = (aircraft.heading + turnAmount + 360) % 360;
    } else {
      updatedAircraft.heading = bearingToWaypoint;
    }

    // Waypoint proximity threshold: 0.5 NM
    const WAYPOINT_THRESHOLD = 0.5;

    // Check if we've reached the waypoint
    if (distanceToWaypoint <= WAYPOINT_THRESHOLD) {
      // Log waypoint crossing
      console.log(
        `${aircraft.callsign}: Crossed ${currentWaypoint.name} at ${Math.round(updatedAircraft.altitude)} ft`
      );

      // Move to next waypoint
      updatedAircraft.sidWaypointIndex = waypointIndex + 1;

      // Check if this was the last waypoint
      if (updatedAircraft.sidWaypointIndex >= sid.waypoints.length) {
        return SIDEngine.completeSID(updatedAircraft, sid);
      }

      // For next waypoint, calculate bearing
      const nextWaypoint = sid.waypoints[updatedAircraft.sidWaypointIndex];
      const bearingToNext = SIDEngine.calculateBearing(
        updatedAircraft.position.lat,
        updatedAircraft.position.lon,
        nextWaypoint.lat,
        nextWaypoint.lon
      );

      // Don't snap to new heading - let gradual turn handle it on next update
      console.log(
        `${aircraft.callsign}: Proceeding to ${nextWaypoint.name}, ` +
        `turning to heading ${Math.round(bearingToNext)}°`
      );

      return updatedAircraft;
    }

    // Return updated aircraft with new heading toward waypoint
    return updatedAircraft;
  },

  /**
   * Marks SID as complete and transitions aircraft to appropriate state
   * @param {Object} aircraft - The aircraft object
   * @param {Object} sid - The SID definition
   * @returns {Object} Updated aircraft object
   */
  completeSID: (aircraft, sid) => {
    const updatedAircraft = { ...aircraft };
    updatedAircraft.sidComplete = true;

    // Set final altitude from SID
    if (aircraft.altitude >= sid.finalAltitude) {
      updatedAircraft.state = AIRCRAFT_STATES.CRUISE;
      updatedAircraft.altitude = Math.max(aircraft.altitude, sid.finalAltitude);
    } else {
      // Still climbing to final altitude
      updatedAircraft.assignedAltitude = sid.finalAltitude;
      updatedAircraft.state = AIRCRAFT_STATES.CLIMBING;
    }

    console.log(
      `${aircraft.callsign}: SID ${sid.designator} complete. ` +
      `Final altitude: ${sid.finalAltitude} ft`
    );

    return updatedAircraft;
  },

  /**
   * Calculates great circle distance between two lat/lon points in nautical miles
   * @param {number} lat1 - Latitude of point 1 (decimal degrees)
   * @param {number} lon1 - Longitude of point 1 (decimal degrees)
   * @param {number} lat2 - Latitude of point 2 (decimal degrees)
   * @param {number} lon2 - Longitude of point 2 (decimal degrees)
   * @returns {number} Distance in nautical miles
   */
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Calculates bearing from one point to another (for future use)
   * @param {number} lat1 - Latitude of point 1 (decimal degrees)
   * @param {number} lon1 - Longitude of point 1 (decimal degrees)
   * @param {number} lat2 - Latitude of point 2 (decimal degrees)
   * @param {number} lon2 - Longitude of point 2 (decimal degrees)
   * @returns {number} Bearing in degrees (0-360)
   */
  calculateBearing: (lat1, lon1, lat2, lon2) => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }
};

export { SIDEngine };
