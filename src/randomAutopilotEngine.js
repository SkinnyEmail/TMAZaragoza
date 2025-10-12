// Random VFR Autopilot Engine
// Generates random flight paths while avoiding restricted airspace

import { ARP } from './constants';
import { CoordinateUtils } from './utils';
import { GeometryUtils } from './geometryUtils';

const RandomAutopilotEngine = {
  /**
   * Generate a random safe waypoint within TMA bounds
   * @param {Object} currentPos - Current position {lat, lon}
   * @param {Object} activeDeltas - Active delta status
   * @param {number} minDistance - Minimum distance from current position (NM)
   * @param {number} maxDistance - Maximum distance from current position (NM)
   * @returns {Object|null} Waypoint {lat, lon, name} or null if no safe point found
   */
  generateRandomWaypoint: (currentPos, activeDeltas, minDistance = 3, maxDistance = 10) => {
    const MAX_ATTEMPTS = 20; // Try up to 20 times to find safe waypoint

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      // Generate random distance and bearing
      const distance = minDistance + Math.random() * (maxDistance - minDistance);
      const bearing = Math.random() * 360;

      // Calculate waypoint position
      const waypoint = CoordinateUtils.radialDistanceToLatLon(
        currentPos.lat,
        currentPos.lon,
        bearing,
        distance
      );

      // Check if waypoint is within TMA bounds (approximate)
      const distanceFromARP = GeometryUtils.calculateDistance(
        waypoint.lat,
        waypoint.lon,
        ARP.lat,
        ARP.lon
      );

      // Keep within ~60 NM of ARP (rough TMA boundary)
      if (distanceFromARP > 60) continue;

      // Check if waypoint is in restricted airspace
      if (GeometryUtils.isPointInRestrictedAirspace(waypoint.lat, waypoint.lon, activeDeltas)) {
        continue; // This waypoint is in restricted airspace, try again
      }

      // Valid waypoint found!
      return {
        lat: waypoint.lat,
        lon: waypoint.lon,
        name: `RND${Math.floor(Math.random() * 1000)}`
      };
    }

    // Failed to find safe waypoint after max attempts
    console.warn('RandomAutopilot: Failed to generate safe waypoint after', MAX_ATTEMPTS, 'attempts');
    return null;
  },

  /**
   * Update aircraft in random VFR autopilot mode
   * @param {Object} aircraft - Aircraft object
   * @param {number} deltaTime - Time elapsed (seconds)
   * @param {Object} performance - Aircraft performance data
   * @param {Object} activeDeltas - Active delta status
   * @returns {Object} Updated aircraft object
   */
  updateRandomAutopilot: (aircraft, deltaTime, performance, activeDeltas) => {
    let updatedAircraft = { ...aircraft };

    // Initialize random autopilot data if not present
    if (!updatedAircraft.randomWaypoint) {
      // Generate initial waypoint
      const waypoint = RandomAutopilotEngine.generateRandomWaypoint(
        aircraft.position,
        activeDeltas
      );

      if (!waypoint) {
        // Couldn't generate waypoint, maintain current heading
        console.warn(`${aircraft.callsign}: Random autopilot failed to initialize, maintaining heading`);
        return updatedAircraft;
      }

      updatedAircraft.randomWaypoint = waypoint;
      console.log(`${aircraft.callsign}: Random autopilot initialized, proceeding to ${waypoint.name}`);
    }

    // Calculate distance to current random waypoint
    const distanceToWaypoint = GeometryUtils.calculateDistance(
      aircraft.position.lat,
      aircraft.position.lon,
      updatedAircraft.randomWaypoint.lat,
      updatedAircraft.randomWaypoint.lon
    );

    // Calculate bearing to waypoint
    const bearingToWaypoint = GeometryUtils.calculateBearing(
      aircraft.position.lat,
      aircraft.position.lon,
      updatedAircraft.randomWaypoint.lat,
      updatedAircraft.randomWaypoint.lon
    );

    // Turn toward waypoint
    const turnRate = performance.turnRate;
    let headingDiff = bearingToWaypoint - aircraft.heading;
    if (headingDiff > 180) headingDiff -= 360;
    if (headingDiff < -180) headingDiff += 360;

    const maxTurnThisFrame = turnRate * deltaTime;

    if (Math.abs(headingDiff) > 1) {
      const turnAmount = Math.sign(headingDiff) * Math.min(Math.abs(headingDiff), maxTurnThisFrame);
      updatedAircraft.heading = (aircraft.heading + turnAmount + 360) % 360;
    } else {
      updatedAircraft.heading = bearingToWaypoint;
    }

    // Waypoint proximity threshold: 0.5 NM
    const WAYPOINT_THRESHOLD = 0.5;

    // Check if we've reached the waypoint
    if (distanceToWaypoint <= WAYPOINT_THRESHOLD) {
      console.log(`${aircraft.callsign}: Reached random waypoint ${updatedAircraft.randomWaypoint.name}`);

      // Generate new random waypoint
      const newWaypoint = RandomAutopilotEngine.generateRandomWaypoint(
        updatedAircraft.position,
        activeDeltas
      );

      if (newWaypoint) {
        updatedAircraft.randomWaypoint = newWaypoint;
        console.log(`${aircraft.callsign}: New random waypoint ${newWaypoint.name} at bearing ${Math.round(GeometryUtils.calculateBearing(updatedAircraft.position.lat, updatedAircraft.position.lon, newWaypoint.lat, newWaypoint.lon))}°`);
      } else {
        // Failed to generate new waypoint, maintain current heading
        console.warn(`${aircraft.callsign}: Failed to generate new random waypoint, maintaining heading`);
      }
    }

    return updatedAircraft;
  },

  /**
   * Check if aircraft's current position is safe (not in restricted airspace)
   * @param {Object} aircraft - Aircraft object
   * @param {Object} activeDeltas - Active delta status
   * @returns {boolean}
   */
  isAircraftPositionSafe: (aircraft, activeDeltas) => {
    return !GeometryUtils.isPointInRestrictedAirspace(
      aircraft.position.lat,
      aircraft.position.lon,
      activeDeltas
    );
  }
};

export { RandomAutopilotEngine };
