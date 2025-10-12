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
   * @param {Object} aircraft - The trail member aircraft
   * @param {Object} leader - The formation leader aircraft
   * @param {number} deltaTime - Time delta in seconds
   * @param {Object} performance - Aircraft performance characteristics
   * @returns {Object} Updated aircraft
   */
  static updateFormationTrail(aircraft, leader, deltaTime, performance) {
    let updatedAircraft = { ...aircraft };

    // Calculate target position: behind leader by separation distance × formation position
    const separation = FormationEngine.TRAIL_SEPARATION_NM * aircraft.formationPosition;

    // Bearing opposite to leader's heading (trail behind)
    const trailBearing = (leader.heading + 180) % 360;

    // Calculate target position behind leader
    const targetPosition = CoordinateUtils.radialDistanceToLatLon(
      leader.position.lat,
      leader.position.lon,
      trailBearing,
      separation
    );

    // Calculate bearing from current position to target position
    const bearingToTarget = GeometryUtils.calculateBearing(
      aircraft.position.lat,
      aircraft.position.lon,
      targetPosition.lat,
      targetPosition.lon
    );

    // Turn toward target position
    updatedAircraft.heading = FormationEngine.turnTowardsHeading(
      aircraft.heading,
      bearingToTarget,
      performance.turnRate,
      deltaTime
    );

    // Match leader's altitude and speed (copy assignments, not actual values for smooth following)
    updatedAircraft.assignedAltitude = leader.assignedAltitude;
    updatedAircraft.assignedSpeed = leader.assignedSpeed;

    // Copy leader's state
    updatedAircraft.state = leader.state;

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
