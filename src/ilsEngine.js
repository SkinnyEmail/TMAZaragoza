import { ARP, RUNWAY_DATA, INSTRUMENTAL_POINTS } from './constants';
import { CoordinateUtils } from './utils';
import { ILS_30R } from './ilsData';
import { AIRCRAFT_STATES } from './aircraftStates';
import { AIRCRAFT_PERFORMANCE } from './aircraftPerformance';

const ILSEngine = {
  updateAircraftWithILS: (aircraft, deltaTime) => {
    if (!aircraft.ilsApproach) {
      return aircraft;
    }

    let updatedAircraft = { ...aircraft };
    const performance = AIRCRAFT_PERFORMANCE[aircraft.type];
    const phase = aircraft.ilsApproach.phase;

    // Update based on current phase
    switch (phase) {
      case 'TO_ENTRY':
        updatedAircraft = ILSEngine.updateToEntryPhase(updatedAircraft, deltaTime, performance);
        break;
      case 'TO_ARC':
        updatedAircraft = ILSEngine.updateToArcPhase(updatedAircraft, deltaTime, performance);
        break;
      case 'ARC':
        updatedAircraft = ILSEngine.updateArcPhase(updatedAircraft, deltaTime, performance);
        break;
      case 'TO_IF':
        updatedAircraft = ILSEngine.updateToIFPhase(updatedAircraft, deltaTime, performance);
        break;
      case 'IF_TO_FAP':
        updatedAircraft = ILSEngine.updateIFToFAPPhase(updatedAircraft, deltaTime, performance);
        break;
      case 'FINAL_APPROACH':
        updatedAircraft = ILSEngine.updateFinalApproachPhase(updatedAircraft, deltaTime, performance);
        break;
      case 'LANDING':
        updatedAircraft = ILSEngine.updateLandingPhase(updatedAircraft, deltaTime, performance);
        break;
      default:
        console.warn(`Unknown ILS phase: ${phase}`);
    }

    return updatedAircraft;
  },

  /**
   * Initialize ILS approach for an aircraft
   */
  initializeILS: (aircraft, entryPoint) => {
    const entry = ILS_30R.entryPoints[entryPoint];

    if (!entry) {
      console.error(`Invalid ILS entry point: ${entryPoint}`);
      return aircraft;
    }

    let initialPhase;
    if (entry.type === 'straight') {
      // KEKAG or IF_ILS - go straight to final approach
      initialPhase = 'IF_TO_FAP';
    } else {
      // YARZU or GODPI - fly to entry point first
      initialPhase = 'TO_ENTRY';
    }

    console.log(`${aircraft.callsign}: ILS 30R cleared via ${entryPoint}`);

    // Set initial altitude based on entry point
    let initialAltitude;
    if (entry.type === 'straight') {
      // IF_ILS and KEKAG go straight to 5000
      initialAltitude = 5000;
    } else if (entryPoint === 'YARZU') {
      // YARZU maintains current altitude up to FL070 (will stay at FL070 until passing entry)
      initialAltitude = Math.min(aircraft.assignedAltitude, 7000);
    } else {
      // GODPI descends to FL050 immediately
      initialAltitude = 5000;
    }

    return {
      ...aircraft,
      navigationMode: 'ILS_APPROACH',
      ilsApproach: {
        entryPoint: entryPoint,
        phase: initialPhase,
        arcDirection: null  // Will be determined dynamically
      },
      assignedAltitude: initialAltitude
    };
  },

  /**
   * Phase 0: Flying to entry point (YARZU, KEKAG, or GODPI)
   */
  updateToEntryPhase: (aircraft, deltaTime, performance) => {
    const entryPointName = aircraft.ilsApproach.entryPoint;
    const entryPointData = INSTRUMENTAL_POINTS[entryPointName];

    // Get entry point coordinates
    const entryLatLon = CoordinateUtils.radialDistanceToLatLon(
      ARP.lat, ARP.lon,
      entryPointData.radial, entryPointData.distance
    );

    // Distance to entry point
    const distanceToEntry = ILSEngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      entryLatLon.lat, entryLatLon.lon
    );

    // Bearing to entry point
    const bearingToEntry = ILSEngine.calculateBearing(
      aircraft.position.lat, aircraft.position.lon,
      entryLatLon.lat, entryLatLon.lon
    );

    let updatedAircraft = ILSEngine.turnTowardsBearing(aircraft, bearingToEntry, performance.turnRate, deltaTime);

    // YARZU: stay at FL070 until passing entry point (within 2 NM), then descend to FL050
    // GODPI: descend to FL050 immediately
    if (entryPointName === 'YARZU') {
      if (distanceToEntry > 2.0) {
        // Still approaching YARZU - maintain FL070
        updatedAircraft.assignedAltitude = 7000;
      } else {
        // Passed YARZU - descend to FL050
        updatedAircraft.assignedAltitude = 5000;
      }
    } else {
      // GODPI - descend to FL050 immediately
      updatedAircraft.assignedAltitude = 5000;
    }

    // Gradual speed reduction based on distance to entry
    // Prevents instant deceleration when cleared for ILS
    const approachSpeed = ILS_30R.speeds[aircraft.type].approach;
    if (distanceToEntry > 10.0) {
      // Far from entry - maintain current speed (no change to assignedSpeed)
      // Let aircraft continue at cruise speed
    } else if (distanceToEntry > 5.0) {
      // 5-10 NM from entry - start reducing speed if currently faster than approach speed
      if (aircraft.speed > approachSpeed) {
        updatedAircraft.assignedSpeed = approachSpeed;
      }
    } else {
      // Within 5 NM - set approach speed
      updatedAircraft.assignedSpeed = approachSpeed;
    }

    // Within 2 NM of entry - transition to arc join
    if (distanceToEntry < 2.0) {
      console.log(`${aircraft.callsign}: Reached ${entryPointName}, joining arc`);
      updatedAircraft.ilsApproach.phase = 'TO_ARC';
    }

    return updatedAircraft;
  },

  /**
   * Phase 1: Positioning to join the 17 NM arc
   */
  updateToArcPhase: (aircraft, deltaTime, performance) => {
    // Get current radial and distance from ARP
    const currentRadial = ILSEngine.calculateBearing(
      ARP.lat, ARP.lon,
      aircraft.position.lat, aircraft.position.lon
    );
    const currentDME = ILSEngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      ARP.lat, ARP.lon
    );

    const targetRadial = 118;  // IF_ILS radial
    const arcRadius = 17.0;    // NM

    let updatedAircraft = { ...aircraft };

    // Determine shortest turn direction if not set
    if (!updatedAircraft.ilsApproach.arcDirection) {
      let radialDiff = targetRadial - currentRadial;
      // Normalize to -180 to +180
      if (radialDiff > 180) radialDiff -= 360;
      if (radialDiff < -180) radialDiff += 360;

      // Negative = turn left (CCW), Positive = turn right (CW)
      updatedAircraft.ilsApproach.arcDirection = radialDiff < 0 ? 'CCW' : 'CW';
    }

    const turnDirection = updatedAircraft.ilsApproach.arcDirection;

    let targetHeading;

    // Two-phase approach: Aggressive intercept when far, tangent following when on arc
    if (currentDME > 19.0) {
      // PHASE A: Far from arc - aggressively intercept the arc
      // Calculate an intercept point on the 17 NM arc ahead of current position
      const interceptRadial = turnDirection === 'CW'
        ? (currentRadial + 25) % 360  // 25° ahead for CW
        : (currentRadial - 25 + 360) % 360;  // 25° ahead for CCW

      // Get lat/lon of intercept point on the arc
      const interceptPoint = CoordinateUtils.radialDistanceToLatLon(
        ARP.lat, ARP.lon,
        interceptRadial,
        arcRadius
      );

      // Fly directly toward the intercept point
      targetHeading = ILSEngine.calculateBearing(
        aircraft.position.lat, aircraft.position.lon,
        interceptPoint.lat, interceptPoint.lon
      );

      console.log(`${aircraft.callsign}: Intercepting arc - DME ${currentDME.toFixed(1)}, heading to intercept at radial ${interceptRadial.toFixed(0)}°`);
    } else {
      // PHASE B: On or near arc - fly tangent to follow it
      if (turnDirection === 'CW') {
        // Clockwise: radial + 90 (fly perpendicular, turning right around arc)
        targetHeading = (currentRadial + 90) % 360;
      } else {
        // Counter-clockwise: radial - 90 (fly perpendicular, turning left around arc)
        targetHeading = (currentRadial - 90 + 360) % 360;
      }

      // DME correction for fine-tuning
      const dmeDiff = currentDME - arcRadius;
      if (dmeDiff > 1.0) {
        // Too far - turn slightly toward ARP
        targetHeading = (targetHeading - 10 + 360) % 360;
      } else if (dmeDiff < -1.0) {
        // Too close - turn slightly away from ARP
        targetHeading = (targetHeading + 10) % 360;
      }
    }

    updatedAircraft = ILSEngine.turnTowardsBearing(updatedAircraft, targetHeading, performance.turnRate, deltaTime);
    updatedAircraft.assignedAltitude = 5000;
    updatedAircraft.assignedSpeed = ILS_30R.speeds[aircraft.type].approach;

    // Check if on arc (loose tolerance: 15-19 NM is acceptable)
    const onArc = currentDME >= 15.0 && currentDME <= 19.0;

    // Transition to ARC phase when on the arc (no radial difference requirement)
    if (onArc) {
      console.log(`${aircraft.callsign}: Established on arc at ${currentRadial.toFixed(0)}°, ${currentDME.toFixed(1)} DME`);
      updatedAircraft.ilsApproach.phase = 'ARC';
    }

    return updatedAircraft;
  },

  /**
   * Phase 2: Following the arc toward IF_ILS
   */
  updateArcPhase: (aircraft, deltaTime, performance) => {
    // Get current radial and distance from ARP
    const currentRadial = ILSEngine.calculateBearing(
      ARP.lat, ARP.lon,
      aircraft.position.lat, aircraft.position.lon
    );
    const currentDME = ILSEngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      ARP.lat, ARP.lon
    );

    const targetRadial = 118;  // IF_ILS radial
    const arcRadius = 17.0;

    let updatedAircraft = { ...aircraft };

    const turnDirection = updatedAircraft.ilsApproach.arcDirection;

    // Calculate tangent heading
    let targetHeading;
    if (turnDirection === 'CW') {
      targetHeading = (currentRadial + 90) % 360;
    } else {
      targetHeading = (currentRadial - 90 + 360) % 360;
    }

    // DME correction
    const dmeDiff = currentDME - arcRadius;
    if (Math.abs(dmeDiff) > 0.5) {
      const correction = Math.min(Math.abs(dmeDiff) * 5, 15) * Math.sign(dmeDiff);
      targetHeading = (targetHeading - correction + 360) % 360;
    }

    updatedAircraft = ILSEngine.turnTowardsBearing(updatedAircraft, targetHeading, performance.turnRate, deltaTime);
    updatedAircraft.assignedAltitude = 5000;
    updatedAircraft.assignedSpeed = ILS_30R.speeds[aircraft.type].approach;

    // Check if approaching IF radial
    let radialDiff = targetRadial - currentRadial;
    if (radialDiff > 180) radialDiff -= 360;
    if (radialDiff < -180) radialDiff += 360;

    // Get distance to IF for additional exit condition
    const ifData = INSTRUMENTAL_POINTS['IF_ILS'];
    const ifPosition = CoordinateUtils.radialDistanceToLatLon(
      ARP.lat, ARP.lon,
      ifData.radial, ifData.distance
    );
    const distanceToIF = ILSEngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      ifPosition.lat, ifPosition.lon
    );

    // Exit arc when: within 25° of IF radial OR within 6 NM of IF position (loose conditions)
    if (Math.abs(radialDiff) < 50 || distanceToIF < 9) {
      console.log(`${aircraft.callsign}: Leaving arc at ${currentRadial.toFixed(0)}° (radialDiff: ${radialDiff.toFixed(1)}°, dist to IF: ${distanceToIF.toFixed(1)} NM), proceeding to IF`);
      updatedAircraft.ilsApproach.phase = 'TO_IF';
    }

    return updatedAircraft;
  },

  /**
   * Phase 3: Flying to IF_ILS
   */
  updateToIFPhase: (aircraft, deltaTime, performance) => {
    // Get IF position
    const ifData = INSTRUMENTAL_POINTS['IF_ILS'];
    const ifPosition = CoordinateUtils.radialDistanceToLatLon(
      ARP.lat, ARP.lon,
      ifData.radial, ifData.distance
    );

    // Distance and bearing to IF
    const distanceToIF = ILSEngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      ifPosition.lat, ifPosition.lon
    );

    const bearingToIF = ILSEngine.calculateBearing(
      aircraft.position.lat, aircraft.position.lon,
      ifPosition.lat, ifPosition.lon
    );

    let updatedAircraft = ILSEngine.turnTowardsBearing(aircraft, bearingToIF, performance.turnRate, deltaTime);
    updatedAircraft.assignedAltitude = 5000;
    updatedAircraft.assignedSpeed = ILS_30R.speeds[aircraft.type].approach;

    // Within 1 NM of IF - transition to IF_TO_FAP
    if (distanceToIF < 1.0) {
      console.log(`${aircraft.callsign}: Reached IF, proceeding to FAP`);
      updatedAircraft.ilsApproach.phase = 'IF_TO_FAP';
    }

    return updatedAircraft;
  },

  /**
   * Phase 4: Flying from IF to FAP (or direct localizer intercept for KEKAG)
   */
  updateIFToFAPPhase: (aircraft, deltaTime, performance) => {
    // Get runway threshold for direct localizer intercept
    const threshold = RUNWAY_DATA['30R'].threshold;

    // Calculate distance to threshold
    const distanceToThreshold = ILSEngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      threshold.lat, threshold.lon
    );

    // Intercept localizer (300° track) - relaxed logic
    const localizerTrack = ILS_30R.finalApproachTrack; // 300°

    // Calculate bearing to threshold
    const bearingToThreshold = ILSEngine.calculateBearing(
      aircraft.position.lat, aircraft.position.lon,
      threshold.lat, threshold.lon
    );

    // Use bearing to threshold for intercept (more direct and forgiving)
    let updatedAircraft = ILSEngine.turnTowardsBearing(aircraft, bearingToThreshold, performance.turnRate, deltaTime);

    // Descend to 5000 ft while approaching entry point
    updatedAircraft.assignedAltitude = 5000;

    // Speed management - only decelerate after passing entry waypoint
    let passedEntryPoint = false;
    let distanceToEntry = 0;

    if (updatedAircraft.ilsApproach.entryPoint === 'KEKAG') {
      // For KEKAG - check if we've passed it
      const kekagData = INSTRUMENTAL_POINTS['KEKAG'];
      const kekagPosition = CoordinateUtils.radialDistanceToLatLon(
        ARP.lat, ARP.lon,
        kekagData.radial, kekagData.distance
      );

      distanceToEntry = ILSEngine.calculateDistance(
        aircraft.position.lat, aircraft.position.lon,
        kekagPosition.lat, kekagPosition.lon
      );

      // Consider passed KEKAG if we're within 2 NM or already past it (closer to threshold)
      passedEntryPoint = distanceToEntry < 2 || distanceToThreshold < 18;
    } else if (updatedAircraft.ilsApproach.entryPoint === 'IF_ILS') {
      // For IF_ILS - check if we've passed it
      const ifData = INSTRUMENTAL_POINTS['IF_ILS'];
      const ifPosition = CoordinateUtils.radialDistanceToLatLon(
        ARP.lat, ARP.lon,
        ifData.radial, ifData.distance
      );

      distanceToEntry = ILSEngine.calculateDistance(
        aircraft.position.lat, aircraft.position.lon,
        ifPosition.lat, ifPosition.lon
      );

      // Consider passed IF_ILS if we're within 2 NM or already past it
      passedEntryPoint = distanceToEntry < 2 || distanceToThreshold < 12;
    } else {
      // For arc entries (YARZU/GODPI) - already past entry point when in this phase
      passedEntryPoint = true;
    }

    // Gradual speed reduction - maintain speed until passing entry point
    const approachSpeed = ILS_30R.speeds[aircraft.type].approach;
    const finalSpeed = ILS_30R.speeds[aircraft.type].final;

    if (!passedEntryPoint) {
      // Before entry point - maintain approach speed (don't slow down yet)
      if (distanceToEntry > 5.0) {
        // Far from entry - maintain current speed
        // No change to assignedSpeed
      } else {
        // Approaching entry - slow to approach speed
        updatedAircraft.assignedSpeed = approachSpeed;
      }
    } else {
      // After entry point - decelerate to final approach speed
      updatedAircraft.assignedSpeed = finalSpeed;
    }

    // Start final approach (glideslope) only after passing entry point
    const headingError = Math.abs(((aircraft.heading - localizerTrack + 180) % 360) - 180);
    const established = headingError < 45 || distanceToThreshold < 8; // Very relaxed

    if (passedEntryPoint && established && distanceToThreshold < 15) {
      console.log(`${aircraft.callsign}: Passed entry point, established on localizer, beginning glideslope descent`);
      updatedAircraft.ilsApproach.phase = 'FINAL_APPROACH';
      updatedAircraft.state = AIRCRAFT_STATES.APPROACH;
    }

    return updatedAircraft;
  },

  /**
   * Phase 5: Final approach on glideslope
   */
  updateFinalApproachPhase: (aircraft, deltaTime, performance) => {
    // Get runway threshold
    const threshold = RUNWAY_DATA['30R'].threshold;

    // Distance and bearing to threshold
    const distanceToThreshold = ILSEngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      threshold.lat, threshold.lon
    );

    const bearingToThreshold = ILSEngine.calculateBearing(
      aircraft.position.lat, aircraft.position.lon,
      threshold.lat, threshold.lon
    );

    // Maintain final approach track
    let updatedAircraft = ILSEngine.turnTowardsBearing(aircraft, bearingToThreshold, performance.turnRate, deltaTime);

    // Calculate glideslope altitude (3° = 318 ft/NM)
    const glideslopeAltitude = Math.max(distanceToThreshold * ILS_30R.descentRate, 0);
    updatedAircraft.assignedAltitude = glideslopeAltitude;
    updatedAircraft.assignedSpeed = ILS_30R.speeds[aircraft.type].final;
    updatedAircraft.state = AIRCRAFT_STATES.APPROACH;

    // Below 500 ft - transition to landing
    if (updatedAircraft.altitude < ILS_30R.landing.transitionAltitude) {
      console.log(`${aircraft.callsign}: Entering landing phase at ${Math.round(updatedAircraft.altitude)} ft`);
      updatedAircraft.ilsApproach.phase = 'LANDING';
      updatedAircraft.ilsApproach.landingElapsedTime = 0; // Start accumulating sim time
      updatedAircraft.state = AIRCRAFT_STATES.LANDING;
    }

    return updatedAircraft;
  },

  /**
   * Phase 6: Landing roll - straight line deceleration on runway
   */
  updateLandingPhase: (aircraft, deltaTime, performance) => {
    let updatedAircraft = { ...aircraft };

    // Lock runway heading at 300° - no more turning, straight line only
    const runwayHeading = ILS_30R.finalApproachTrack; // 300°
    updatedAircraft.heading = runwayHeading;
    updatedAircraft.assignedHeading = runwayHeading;

    // Descend to ground
    updatedAircraft.assignedAltitude = 0;

    // Check if touched down (altitude near zero)
    const hasTouchedDown = updatedAircraft.altitude <= 50;

    if (hasTouchedDown) {
      // On ground - decelerate rapidly in straight line
      updatedAircraft.assignedSpeed = 0;
      updatedAircraft.altitude = 0; // Lock at ground level

      // Accumulate landing time using simulation deltaTime (respects time slider)
      updatedAircraft.ilsApproach.landingElapsedTime =
        (aircraft.ilsApproach.landingElapsedTime || 0) + deltaTime;

      // After 7 seconds of simulation time on the ground, mark as landed
      if (updatedAircraft.ilsApproach.landingElapsedTime >= 7) {
        console.log(`${aircraft.callsign}: Landing roll complete (${updatedAircraft.ilsApproach.landingElapsedTime.toFixed(1)}s)`);
        updatedAircraft.landed = true;
      }
    } else {
      // Still in air - slow to touchdown speed
      updatedAircraft.assignedSpeed = ILS_30R.landing.touchdownSpeed;
    }

    return updatedAircraft;
  },

  /**
   * Helper: Turn aircraft toward target bearing
   */
  turnTowardsBearing: (aircraft, targetBearing, turnRate, deltaTime) => {
    let headingDiff = targetBearing - aircraft.heading;
    if (headingDiff > 180) headingDiff -= 360;
    if (headingDiff < -180) headingDiff += 360;

    const maxTurnThisFrame = turnRate * deltaTime;
    let newHeading = aircraft.heading;

    if (Math.abs(headingDiff) > 1) {
      const turnAmount = Math.sign(headingDiff) * Math.min(Math.abs(headingDiff), maxTurnThisFrame);
      newHeading = (aircraft.heading + turnAmount + 360) % 360;
    } else {
      newHeading = targetBearing;
    }

    return {
      ...aircraft,
      heading: newHeading,
      assignedHeading: targetBearing
    };
  },

  /**
   * Calculate great circle distance between two points (in nautical miles)
   */
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 3440.065; // Earth radius in nautical miles
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
   * Calculate bearing from point 1 to point 2
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

export { ILSEngine };
