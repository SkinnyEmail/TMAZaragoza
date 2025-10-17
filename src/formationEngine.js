import { GeometryUtils } from './geometryUtils';
import { CoordinateUtils } from './utils';

/**
 * Formation Engine
 * Handles trail formation logic where wingmen follow their leader
 */
class FormationEngine {
  // Trail separation distance (0.5 NM between aircraft)
  static TRAIL_SEPARATION_NM = 0.5;

  /**
   * Update formation member to follow leader in trail formation
   * Trail members simply match the leader's heading, speed, and altitude
   * They follow naturally without aggressive navigation to specific positions
   * @param {Object} aircraft - The trail member aircraft
   * @param {Object} leader - The formation leader aircraft
   * @param {number} deltaTime - Time delta in seconds
   * @param {Object} performance - Aircraft performance characteristics
   * @returns {Object} Updated aircraft
   */
  static updateFormationTrail(aircraft, leader, deltaTime, performance) {
    let updatedAircraft = { ...aircraft };

    // Copy the leader's exact heading (no smooth turning needed)
    updatedAircraft.heading = leader.heading;

    // Copy leader's speed and altitude (actual values, not assignments)
    updatedAircraft.speed = leader.speed;
    updatedAircraft.altitude = leader.altitude;
    updatedAircraft.assignedAltitude = leader.assignedAltitude;
    updatedAircraft.assignedSpeed = leader.assignedSpeed;

    // Copy leader's state
    updatedAircraft.state = leader.state;

    // Copy leader's navigation mode and commands so trail follows same procedures
    updatedAircraft.navigationMode = leader.navigationMode;
    updatedAircraft.assignedHeading = leader.assignedHeading;
    updatedAircraft.assignedSID = leader.assignedSID;
    updatedAircraft.sidWaypointIndex = leader.sidWaypointIndex;
    updatedAircraft.sidComplete = leader.sidComplete;
    updatedAircraft.assignedRoute = leader.assignedRoute;
    updatedAircraft.routeWaypointIndex = leader.routeWaypointIndex;

    // Calculate trail position: behind leader by (formationPosition × separation distance)
    // This ensures natural spacing without aggressive maneuvering
    const separation = FormationEngine.TRAIL_SEPARATION_NM * aircraft.formationPosition;
    const trailBearing = (leader.heading + 180) % 360; // Opposite of leader's heading

    updatedAircraft.position = CoordinateUtils.radialDistanceToLatLon(
      leader.position.lat,
      leader.position.lon,
      trailBearing,
      separation
    );

    return updatedAircraft;
  }

  /**
   * Turn aircraft toward target heading
   * @param {number} currentHeading - Current heading in degrees
   * @param {number} targetHeading - Target heading in degrees
   * @param {number} turnRate - Turn rate in degrees per second
   * @param {number} deltaTime - Time delta in seconds
   * @returns {number} New heading
   */
  static turnTowardsHeading(currentHeading, targetHeading, turnRate, deltaTime) {
    // Calculate shortest turn direction
    let headingDifference = targetHeading - currentHeading;

    // Normalize to -180 to 180
    if (headingDifference > 180) {
      headingDifference -= 360;
    } else if (headingDifference < -180) {
      headingDifference += 360;
    }

    // Calculate turn amount (limited by turn rate)
    const maxTurn = turnRate * deltaTime;
    const turnAmount = Math.max(-maxTurn, Math.min(maxTurn, headingDifference));

    // Apply turn
    let newHeading = currentHeading + turnAmount;

    // Normalize to 0-360
    if (newHeading < 0) {
      newHeading += 360;
    } else if (newHeading >= 360) {
      newHeading -= 360;
    }

    return newHeading;
  }
}

export { FormationEngine };
