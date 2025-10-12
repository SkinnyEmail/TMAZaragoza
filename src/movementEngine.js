import { AIRCRAFT_PERFORMANCE } from './aircraftPerformance';
import { AIRCRAFT_STATES } from './aircraftStates';
import { CoordinateUtils } from './utils';
import { SIDEngine } from './sidEngine';
import { ILSEngine } from './ilsEngine';
import { VOREngine } from './vorEngine';
import { VisualEngine } from './visualEngine';
import { HoldingEngine } from './holdingEngine';
import { OrbitEngine } from './orbitEngine';
import { getWaypointByName } from './waypointDatabase';
import { RandomAutopilotEngine } from './randomAutopilotEngine';

class MovementEngine {
  static updateAircraft(aircraft, deltaTime, activeDeltas = {}) {
    const performance = AIRCRAFT_PERFORMANCE[aircraft.type];
    let updatedAircraft = { ...aircraft };


    // Handle navigation based on mode
    if (updatedAircraft.navigationMode === 'ILS_APPROACH' && updatedAircraft.ilsApproach) {
      // Follow ILS approach procedure
      updatedAircraft = ILSEngine.updateAircraftWithILS(updatedAircraft, deltaTime);
    } else if (updatedAircraft.navigationMode === 'VOR_APPROACH' && updatedAircraft.vorApproach) {
      // Follow VOR approach procedure
      updatedAircraft = VOREngine.updateAircraftWithVOR(updatedAircraft, deltaTime);
    } else if (updatedAircraft.navigationMode === 'VISUAL_APPROACH' && updatedAircraft.visualApproach) {
      // Follow visual approach procedure
      updatedAircraft = VisualEngine.updateAircraftWithVisual(updatedAircraft, deltaTime);
    } else if (updatedAircraft.navigationMode === 'HOLDING' && updatedAircraft.holdingPattern) {
      // Follow holding pattern
      updatedAircraft = HoldingEngine.updateAircraftWithHolding(updatedAircraft, deltaTime);
    } else if (updatedAircraft.navigationMode === 'ORBIT' && updatedAircraft.orbit) {
      // Follow orbit pattern
      updatedAircraft = OrbitEngine.updateAircraftWithOrbit(updatedAircraft, deltaTime);
    } else if (updatedAircraft.navigationMode === 'HEADING_MODE' && updatedAircraft.assignedHeading !== null) {
      // Turn toward assigned heading
      updatedAircraft.heading = MovementEngine.turnTowardsHeading(
        updatedAircraft.heading,
        updatedAircraft.assignedHeading,
        performance.turnRate,
        deltaTime
      );
    } else if (updatedAircraft.navigationMode === 'ROUTE_NAV' && updatedAircraft.assignedRoute && updatedAircraft.assignedRoute.length > 0) {
      // Follow assigned route
      updatedAircraft = MovementEngine.updateAircraftWithRoute(updatedAircraft, deltaTime, performance);
    } else if (updatedAircraft.navigationMode === 'RANDOM_VFR') {
      // Random VFR autopilot
      updatedAircraft = RandomAutopilotEngine.updateRandomAutopilot(
        updatedAircraft,
        deltaTime,
        performance,
        activeDeltas
      );
    } else if (updatedAircraft.assignedSID && !updatedAircraft.sidComplete) {
      // Follow SID procedure
      updatedAircraft = SIDEngine.updateAircraftWithSID(updatedAircraft, deltaTime);
    }

    // Handle altitude changes - transition state to DESCENDING/CLIMBING when altitude assignment changes
    if (updatedAircraft.state === AIRCRAFT_STATES.CRUISE || updatedAircraft.state === AIRCRAFT_STATES.DESCENDING || updatedAircraft.state === AIRCRAFT_STATES.CLIMBING) {
      const altitudeDifference = updatedAircraft.assignedAltitude - updatedAircraft.altitude;

      if (altitudeDifference <= -10) {
        // Need to descend (assigned altitude is at least 10 ft below current)
        if (updatedAircraft.state !== AIRCRAFT_STATES.DESCENDING && updatedAircraft.state !== AIRCRAFT_STATES.APPROACH && updatedAircraft.state !== AIRCRAFT_STATES.LANDING) {
          updatedAircraft.state = AIRCRAFT_STATES.DESCENDING;
        }
      } else if (altitudeDifference >= 10) {
        // Need to climb (assigned altitude is at least 10 ft above current)
        if (updatedAircraft.state !== AIRCRAFT_STATES.CLIMBING) {
          updatedAircraft.state = AIRCRAFT_STATES.CLIMBING;
        }
      } else {
        // Within 10 ft of assigned altitude - cruise (unless on approach/landing)
        if (updatedAircraft.state !== AIRCRAFT_STATES.APPROACH && updatedAircraft.state !== AIRCRAFT_STATES.LANDING) {
          updatedAircraft.state = AIRCRAFT_STATES.CRUISE;
        }
      }
    }

    // Handle assigned speed (only if airborne)
    if (updatedAircraft.assignedSpeed !== null &&
        updatedAircraft.state !== AIRCRAFT_STATES.PARKED &&
        updatedAircraft.state !== AIRCRAFT_STATES.TAKEOFF_ROLL) {
      const speedDifference = updatedAircraft.assignedSpeed - updatedAircraft.speed;

      if (Math.abs(speedDifference) > 1) { // 1 kt tolerance
        if (speedDifference > 0) {
          // Accelerate
          updatedAircraft.speed = Math.min(
            updatedAircraft.speed + performance.acceleration * deltaTime,
            updatedAircraft.assignedSpeed
          );
        } else {
          // Decelerate
          updatedAircraft.speed = Math.max(
            updatedAircraft.speed - performance.deceleration * deltaTime,
            updatedAircraft.assignedSpeed
          );
        }
      } else {
        updatedAircraft.speed = updatedAircraft.assignedSpeed;
      }
    }

    switch (updatedAircraft.state) {
      case AIRCRAFT_STATES.PARKED:
        // Aircraft is stationary, no updates needed
        break;

      case AIRCRAFT_STATES.TAKEOFF_ROLL:
        // Accelerate on runway until takeoff speed is reached
        updatedAircraft.speed = Math.min(
          aircraft.speed + performance.acceleration * deltaTime,
          performance.takeoffSpeed
        );

        // Check if takeoff speed reached - transition to CLIMBING
        if (updatedAircraft.speed >= performance.takeoffSpeed) {
          updatedAircraft.state = AIRCRAFT_STATES.CLIMBING;
          updatedAircraft.speed = performance.climbSpeed;
        }

        // Update position along runway heading
        updatedAircraft.position = MovementEngine.updatePosition(
          updatedAircraft.position,
          updatedAircraft.heading,
          updatedAircraft.speed,
          deltaTime
        );
        break;

      case AIRCRAFT_STATES.CLIMBING:
        // Climb at climb rate and climb speed
        updatedAircraft.altitude = Math.min(
          updatedAircraft.altitude + (performance.climbRate * deltaTime / 60), // Convert fpm to fps
          updatedAircraft.assignedAltitude
        );

        // Check if assigned altitude reached - transition to CRUISE
        if (updatedAircraft.altitude >= updatedAircraft.assignedAltitude) {
          updatedAircraft.state = AIRCRAFT_STATES.CRUISE;
          updatedAircraft.altitude = updatedAircraft.assignedAltitude;
          updatedAircraft.speed = performance.cruiseSpeed;
        }

        // Update position along current heading
        updatedAircraft.position = MovementEngine.updatePosition(
          updatedAircraft.position,
          updatedAircraft.heading,
          updatedAircraft.speed,
          deltaTime
        );
        break;

      case AIRCRAFT_STATES.CRUISE:
        // Maintain altitude and speed, continue on heading
        updatedAircraft.position = MovementEngine.updatePosition(
          updatedAircraft.position,
          updatedAircraft.heading,
          updatedAircraft.speed,
          deltaTime
        );
        break;

      case AIRCRAFT_STATES.DESCENDING:
        // Descend at descent rate
        updatedAircraft.altitude = Math.max(
          updatedAircraft.altitude - (performance.descentRate * deltaTime / 60), // Convert fpm to fps
          updatedAircraft.assignedAltitude
        );

        // Check if assigned altitude reached - transition to CRUISE (unless on ILS)
        if (updatedAircraft.altitude <= updatedAircraft.assignedAltitude) {
          if (updatedAircraft.navigationMode !== 'ILS_APPROACH') {
            updatedAircraft.state = AIRCRAFT_STATES.CRUISE;
            updatedAircraft.altitude = updatedAircraft.assignedAltitude;
            updatedAircraft.speed = performance.cruiseSpeed;
          }
        }

        // Update position along current heading
        updatedAircraft.position = MovementEngine.updatePosition(
          updatedAircraft.position,
          updatedAircraft.heading,
          updatedAircraft.speed,
          deltaTime
        );
        break;

      case AIRCRAFT_STATES.APPROACH:
        // On ILS approach - descending on glideslope
        // Descent is managed by ILS engine
        updatedAircraft.altitude = Math.max(
          updatedAircraft.altitude - (performance.descentRate * deltaTime / 60),
          updatedAircraft.assignedAltitude
        );

        // Update position along current heading
        updatedAircraft.position = MovementEngine.updatePosition(
          updatedAircraft.position,
          updatedAircraft.heading,
          updatedAircraft.speed,
          deltaTime
        );
        break;

      case AIRCRAFT_STATES.LANDING:
        // Final landing phase - deceleration and touchdown
        // Descent and speed managed by ILS engine
        updatedAircraft.altitude = Math.max(
          updatedAircraft.altitude - (performance.descentRate * deltaTime / 60),
          0
        );

        // Update position along runway heading
        updatedAircraft.position = MovementEngine.updatePosition(
          updatedAircraft.position,
          updatedAircraft.heading,
          updatedAircraft.speed,
          deltaTime
        );
        break;

      default:
        console.warn(`Unknown aircraft state: ${aircraft.state}`);
    }

    return updatedAircraft;
  }

  /**
   * Updates aircraft position based on heading and speed
   * @param {Object} position - Current position {lat, lon}
   * @param {number} heading - Heading in degrees
   * @param {number} speed - Speed in knots
   * @param {number} deltaTime - Time elapsed in seconds
   * @returns {Object} New position {lat, lon}
   */
  static updatePosition(position, heading, speed, deltaTime) {
    // Calculate distance traveled in nautical miles
    // speed is in knots (nautical miles per hour)
    // deltaTime is in seconds
    const distanceNM = speed * (deltaTime / 3600);

    // Use CoordinateUtils to calculate new position
    return CoordinateUtils.radialDistanceToLatLon(
      position.lat,
      position.lon,
      heading,
      distanceNM
    );
  }

  /**
   * Gradually turns aircraft heading toward target heading
   * @param {number} currentHeading - Current heading in degrees (0-360)
   * @param {number} targetHeading - Target heading in degrees (0-360)
   * @param {number} turnRate - Turn rate in degrees per second
   * @param {number} deltaTime - Time elapsed in seconds
   * @returns {number} New heading in degrees (0-360)
   */
  static turnTowardsHeading(currentHeading, targetHeading, turnRate, deltaTime) {
    // Calculate heading difference (shortest turn direction)
    let headingDiff = targetHeading - currentHeading;
    if (headingDiff > 180) headingDiff -= 360;
    if (headingDiff < -180) headingDiff += 360;

    // Calculate maximum turn this frame
    const maxTurnThisFrame = turnRate * deltaTime;

    // Apply turn (clamped to not overshoot)
    if (Math.abs(headingDiff) > 1) { // 1° tolerance
      const turnAmount = Math.sign(headingDiff) * Math.min(Math.abs(headingDiff), maxTurnThisFrame);
      return (currentHeading + turnAmount + 360) % 360;
    } else {
      return targetHeading;
    }
  }

  /**
   * Updates aircraft following an assigned route
   * @param {Object} aircraft - The aircraft object
   * @param {number} deltaTime - Time elapsed since last update (seconds)
   * @param {Object} performance - Aircraft performance object
   * @returns {Object} Updated aircraft object
   */
  static updateAircraftWithRoute(aircraft, deltaTime, performance) {
    // Check if route is valid
    if (!aircraft.assignedRoute || aircraft.assignedRoute.length === 0) {
      return aircraft;
    }

    const currentWaypointIndex = aircraft.routeWaypointIndex || 0;

    // Check if route is complete
    if (currentWaypointIndex >= aircraft.assignedRoute.length) {
      console.log(`${aircraft.callsign}: Route complete`);
      return {
        ...aircraft,
        assignedRoute: null,
        routeWaypointIndex: 0,
        navigationMode: 'SID_NAV' // Resume SID navigation if available
      };
    }

    // Get current waypoint
    const waypointName = aircraft.assignedRoute[currentWaypointIndex];

    // Check if this is a drawn route with actual waypoint coordinates
    let waypoint;
    if (aircraft.drawnRouteWaypoints && aircraft.drawnRouteWaypoints.length > currentWaypointIndex) {
      waypoint = aircraft.drawnRouteWaypoints[currentWaypointIndex];
    } else {
      waypoint = getWaypointByName(waypointName);
    }

    if (!waypoint) {
      console.warn(`${aircraft.callsign}: Waypoint ${waypointName} not found`);
      return aircraft;
    }

    // Calculate distance to waypoint
    const distanceToWaypoint = SIDEngine.calculateDistance(
      aircraft.position.lat,
      aircraft.position.lon,
      waypoint.lat,
      waypoint.lon
    );

    // Calculate bearing to waypoint
    const bearingToWaypoint = SIDEngine.calculateBearing(
      aircraft.position.lat,
      aircraft.position.lon,
      waypoint.lat,
      waypoint.lon
    );

    // Turn toward waypoint
    const newHeading = MovementEngine.turnTowardsHeading(
      aircraft.heading,
      bearingToWaypoint,
      performance.turnRate,
      deltaTime
    );

    // Waypoint proximity threshold: 0.5 NM
    const WAYPOINT_THRESHOLD = 0.5;

    // Check if we've reached the waypoint
    if (distanceToWaypoint <= WAYPOINT_THRESHOLD) {
      console.log(`${aircraft.callsign}: Crossed ${waypointName} at ${Math.round(aircraft.altitude)} ft`);

      // Move to next waypoint
      return {
        ...aircraft,
        heading: newHeading,
        routeWaypointIndex: currentWaypointIndex + 1
      };
    }

    // Return updated aircraft with new heading
    return {
      ...aircraft,
      heading: newHeading
    };
  }
}

export default MovementEngine;
