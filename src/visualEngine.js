import { RUNWAY_DATA, ARP } from './constants';
import { VISUAL_PATTERNS, VISUAL_LANDING } from './visualData';
import { AIRCRAFT_STATES } from './aircraftStates';
import { AIRCRAFT_PERFORMANCE } from './aircraftPerformance';
import { GeometryUtils } from './geometryUtils';

const VisualEngine = {
  /**
   * Check if aircraft is inside ATZ (circle of 4.32 NM radius centered at ARP)
   */
  isInATZ: (lat, lon) => {
    const ATZ_RADIUS_NM = 4.32;
    const distance = GeometryUtils.calculateDistance(lat, lon, ARP.lat, ARP.lon);
    return distance <= ATZ_RADIUS_NM;
  },

  updateAircraftWithVisual: (aircraft, deltaTime) => {
    if (!aircraft.visualApproach) {
      return aircraft;
    }

    let updatedAircraft = { ...aircraft };
    const performance = AIRCRAFT_PERFORMANCE[aircraft.type];
    const phase = aircraft.visualApproach.phase;

    // Update based on current phase
    switch (phase) {
      case 'TO_DOWNWIND':
        updatedAircraft = VisualEngine.updateToDownwindPhase(updatedAircraft, deltaTime, performance);
        break;
      case 'TO_BASE':
        updatedAircraft = VisualEngine.updateToBasePhase(updatedAircraft, deltaTime, performance);
        break;
      case 'TO_FINAL':
        updatedAircraft = VisualEngine.updateToFinalPhase(updatedAircraft, deltaTime, performance);
        break;
      case 'FINAL_APPROACH':
        updatedAircraft = VisualEngine.updateFinalApproachPhase(updatedAircraft, deltaTime, performance);
        break;
      case 'LANDING':
        updatedAircraft = VisualEngine.updateLandingPhase(updatedAircraft, deltaTime);
        break;
      default:
        console.warn(`Unknown Visual phase: ${phase}`);
    }

    return updatedAircraft;
  },

  /**
   * Initialize visual approach for an aircraft
   */
  initializeVisual: (aircraft, runway, entryPoint) => {
    // Select pattern based on runway
    const pattern = VISUAL_PATTERNS[runway];

    if (!pattern) {
      console.error(`Visual approach pattern not found for runway: ${runway}`);
      return aircraft;
    }

    let initialPhase;

    // Determine initial phase based on entry point
    if (entryPoint === 'DOWNWIND') {
      initialPhase = 'TO_DOWNWIND';
    } else if (entryPoint === 'BASE') {
      initialPhase = 'TO_BASE';
    } else if (entryPoint === 'FINAL') {
      initialPhase = 'TO_FINAL';
    } else {
      console.error(`Invalid entry point: ${entryPoint}`);
      return aircraft;
    }

    console.log(`${aircraft.callsign}: Visual approach ${pattern.patternName} cleared via ${entryPoint}`);

    return {
      ...aircraft,
      navigationMode: 'VISUAL_APPROACH',
      visualApproach: {
        runway: pattern.runway,
        entryPoint: entryPoint,
        phase: initialPhase,
        pattern: pattern,
        hasEnteredATZ: false  // Track ATZ entry for speed management
      }
    };
  },

  /**
   * Phase 1: Navigate to downwind waypoint
   */
  updateToDownwindPhase: (aircraft, deltaTime, performance) => {
    const pattern = aircraft.visualApproach.pattern;
    const downwindWaypoint = pattern.downwindWaypoint;

    // Calculate distance and bearing to downwind waypoint
    const distanceToWaypoint = VisualEngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      downwindWaypoint.lat, downwindWaypoint.lon
    );

    const bearingToWaypoint = VisualEngine.calculateBearing(
      aircraft.position.lat, aircraft.position.lon,
      downwindWaypoint.lat, downwindWaypoint.lon
    );

    // Turn toward waypoint
    let updatedAircraft = VisualEngine.turnTowardsBearing(aircraft, bearingToWaypoint, performance.turnRate, deltaTime);

    // Check if entering ATZ for the first time
    const isInATZ = VisualEngine.isInATZ(aircraft.position.lat, aircraft.position.lon);
    if (isInATZ && !aircraft.visualApproach.hasEnteredATZ) {
      console.log(`${aircraft.callsign}: Entering ATZ - reducing to 150kt and FL008`);
      updatedAircraft.visualApproach.hasEnteredATZ = true;
    }

    // Speed and altitude management
    if (updatedAircraft.visualApproach.hasEnteredATZ || isInATZ) {
      // Only assign 150kt if aircraft is faster - don't accelerate slower aircraft
      if (updatedAircraft.speed > pattern.speeds.atzEntry) {
        updatedAircraft.assignedSpeed = pattern.speeds.atzEntry;
      }
      updatedAircraft.assignedAltitude = pattern.altitudes.atzEntry;

      // Progressive deceleration
      updatedAircraft = VisualEngine.applyDeceleration(updatedAircraft, pattern.speeds.downwind, pattern.decelerationRate, deltaTime);
    }

    // Within 0.4 NM of waypoint - transition to base
    if (distanceToWaypoint < 0.4) {
      console.log(`${aircraft.callsign}: Downwind waypoint reached, proceeding to base`);
      updatedAircraft.visualApproach.phase = 'TO_BASE';
    }

    return updatedAircraft;
  },

  /**
   * Phase 2: Navigate to base waypoint
   */
  updateToBasePhase: (aircraft, deltaTime, performance) => {
    const pattern = aircraft.visualApproach.pattern;
    const baseWaypoint = pattern.baseWaypoint;

    // Calculate distance and bearing to base waypoint
    const distanceToWaypoint = VisualEngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      baseWaypoint.lat, baseWaypoint.lon
    );

    const bearingToWaypoint = VisualEngine.calculateBearing(
      aircraft.position.lat, aircraft.position.lon,
      baseWaypoint.lat, baseWaypoint.lon
    );

    // Turn toward waypoint
    let updatedAircraft = VisualEngine.turnTowardsBearing(aircraft, bearingToWaypoint, performance.turnRate, deltaTime);

    // Target base speed and altitude
    updatedAircraft.assignedSpeed = pattern.speeds.base;
    updatedAircraft.assignedAltitude = pattern.altitudes.base;

    // Progressive deceleration
    updatedAircraft = VisualEngine.applyDeceleration(updatedAircraft, pattern.speeds.base, pattern.decelerationRate, deltaTime);

    // Within 0.4 NM of waypoint - transition to final
    if (distanceToWaypoint < 0.4) {
      console.log(`${aircraft.callsign}: Base waypoint reached, proceeding to final`);
      updatedAircraft.visualApproach.phase = 'TO_FINAL';
    }

    return updatedAircraft;
  },

  /**
   * Phase 3: Navigate to final waypoint
   */
  updateToFinalPhase: (aircraft, deltaTime, performance) => {
    const pattern = aircraft.visualApproach.pattern;
    const finalWaypoint = pattern.finalWaypoint;

    // Calculate distance and bearing to final waypoint
    const distanceToWaypoint = VisualEngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      finalWaypoint.lat, finalWaypoint.lon
    );

    const bearingToWaypoint = VisualEngine.calculateBearing(
      aircraft.position.lat, aircraft.position.lon,
      finalWaypoint.lat, finalWaypoint.lon
    );

    // Turn toward waypoint
    let updatedAircraft = VisualEngine.turnTowardsBearing(aircraft, bearingToWaypoint, performance.turnRate, deltaTime);

    // Target final speed and altitude
    updatedAircraft.assignedSpeed = pattern.speeds.final;
    updatedAircraft.assignedAltitude = pattern.altitudes.final;

    // Progressive deceleration
    updatedAircraft = VisualEngine.applyDeceleration(updatedAircraft, pattern.speeds.final, pattern.decelerationRate, deltaTime);

    // Within 0.5 NM of waypoint - transition to final approach
    if (distanceToWaypoint < 0.5) {
      console.log(`${aircraft.callsign}: Final waypoint reached, established on final approach`);
      updatedAircraft.visualApproach.phase = 'FINAL_APPROACH';
    }

    return updatedAircraft;
  },

  /**
   * Phase 4: Final approach to runway threshold
   */
  updateFinalApproachPhase: (aircraft, deltaTime, performance) => {
    const pattern = aircraft.visualApproach.pattern;
    const threshold = RUNWAY_DATA[pattern.runway].threshold;

    // Calculate distance to threshold
    const distanceToThreshold = VisualEngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      threshold.lat, threshold.lon
    );

    const bearingToThreshold = VisualEngine.calculateBearing(
      aircraft.position.lat, aircraft.position.lon,
      threshold.lat, threshold.lon
    );

    // Maintain course to threshold
    let updatedAircraft = VisualEngine.turnTowardsBearing(aircraft, bearingToThreshold, performance.turnRate, deltaTime);

    // Calculate glideslope altitude
    const glideslopeAltitude = Math.max(distanceToThreshold * pattern.descentRate, 0);
    updatedAircraft.assignedAltitude = glideslopeAltitude;
    updatedAircraft.assignedSpeed = pattern.speeds.finalApproach;
    updatedAircraft.state = AIRCRAFT_STATES.APPROACH;

    // Progressive deceleration
    updatedAircraft = VisualEngine.applyDeceleration(updatedAircraft, pattern.speeds.finalApproach, pattern.decelerationRate, deltaTime);

    // Below transition altitude - switch to landing
    if (updatedAircraft.altitude < VISUAL_LANDING.transitionAltitude) {
      console.log(`${aircraft.callsign}: Entering landing phase at ${Math.round(updatedAircraft.altitude)} ft`);
      updatedAircraft.visualApproach.phase = 'LANDING';
      updatedAircraft.visualApproach.landingElapsedTime = 0;
      updatedAircraft.state = AIRCRAFT_STATES.LANDING;
    }

    return updatedAircraft;
  },

  /**
   * Phase 5: Landing rollout
   */
  updateLandingPhase: (aircraft, deltaTime) => {
    let updatedAircraft = { ...aircraft };
    const pattern = aircraft.visualApproach.pattern;

    // Lock runway heading
    const runwayHeading = RUNWAY_DATA[pattern.runway].heading;
    updatedAircraft.heading = runwayHeading;
    updatedAircraft.assignedHeading = runwayHeading;

    // Descend to ground
    updatedAircraft.assignedAltitude = 0;

    // Check if touched down
    const hasTouchedDown = updatedAircraft.altitude <= 50;

    if (hasTouchedDown) {
      updatedAircraft.altitude = 0;
      updatedAircraft.assignedAltitude = 0;

      // Decelerate on ground
      if (!updatedAircraft.visualApproach.landingElapsedTime) {
        updatedAircraft.visualApproach.landingElapsedTime = 0;
      }

      updatedAircraft.visualApproach.landingElapsedTime += deltaTime;
      const decelerationAmount = VISUAL_LANDING.decelerationRate * deltaTime;
      updatedAircraft.speed = Math.max(0, updatedAircraft.speed - decelerationAmount);
      updatedAircraft.assignedSpeed = 0;

      // Mark as landed and schedule deletion after 7 seconds
      if (updatedAircraft.speed === 0) {
        updatedAircraft.state = AIRCRAFT_STATES.PARKED;

        // Track when aircraft stopped
        if (!updatedAircraft.visualApproach.stoppedTime) {
          updatedAircraft.visualApproach.stoppedTime = 0;
          console.log(`${aircraft.callsign}: Landed on runway ${pattern.runway}`);
        }

        updatedAircraft.visualApproach.stoppedTime += deltaTime;

        // Delete aircraft after 7 seconds on ground
        if (updatedAircraft.visualApproach.stoppedTime >= 7) {
          updatedAircraft.shouldDelete = true;
          console.log(`${aircraft.callsign}: Vacated runway, deleting aircraft`);
        }
      }
    } else {
      // Still in air - slow to touchdown speed
      updatedAircraft.assignedSpeed = VISUAL_LANDING.touchdownSpeed;
    }

    return updatedAircraft;
  },

  /**
   * Apply progressive deceleration
   */
  applyDeceleration: (aircraft, targetSpeed, decelerationRate, deltaTime) => {
    const updatedAircraft = { ...aircraft };

    if (updatedAircraft.speed > targetSpeed) {
      // Gradually reduce speed
      const speedReduction = decelerationRate * deltaTime;
      updatedAircraft.speed = Math.max(targetSpeed, updatedAircraft.speed - speedReduction);
    }

    return updatedAircraft;
  },

  /**
   * Utility: Calculate great circle distance in NM
   */
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 3440.065; // Earth radius in NM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  /**
   * Utility: Calculate bearing from point 1 to point 2
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
  },

  /**
   * Utility: Turn aircraft toward target bearing
   */
  turnTowardsBearing: (aircraft, targetBearing, turnRate, deltaTime) => {
    let headingDiff = targetBearing - aircraft.heading;
    if (headingDiff > 180) headingDiff -= 360;
    if (headingDiff < -180) headingDiff += 360;

    const maxTurn = turnRate * deltaTime;
    const turnAmount = Math.max(-maxTurn, Math.min(maxTurn, headingDiff));

    return {
      ...aircraft,
      heading: (aircraft.heading + turnAmount + 360) % 360,
      assignedHeading: targetBearing
    };
  }
};

export { VisualEngine };
