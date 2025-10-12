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
      if (entryPoint === 'IF_ILS') {
        // Straight-in from IF_ILS - need to fly to IF_ILS first
        initialPhase = 'TO_IF';
      } else {
        // KEKAG - go straight to final approach (already on localizer)
        initialPhase = 'IF_TO_FAP';
      }
    } else {
      // YARZU or GODPI - fly to entry point first
      initialPhase = 'TO_ENTRY';
    }

    console.log(`${aircraft.callsign}: ILS 30R cleared via ${entryPoint}`);

    // Set initial altitude based on entry point
    let initialAltitude;
    if (entryPoint === 'IF_ILS') {
      // Straight-in from IF_ILS - descend to 4500 ft
      initialAltitude = 4500;
    } else if (entry.type === 'straight') {
      // KEKAG goes to 5000
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

    // Calculate an intercept point on the arc
    // Pick a point 20-30° ahead on the arc in the direction we need to fly
    let interceptRadial;
    if (turnDirection === 'CW') {
      // Flying clockwise, intercept ahead
      interceptRadial = currentRadial + 25;
    } else {
      // Flying counter-clockwise, intercept ahead
      interceptRadial = currentRadial - 25;
    }

    // Get the intercept point coordinates (on the arc at 17 NM)
    const interceptPoint = CoordinateUtils.radialDistanceToLatLon(
      ARP.lat, ARP.lon,
      interceptRadial, arcRadius
    );

    // Fly directly toward the intercept point
    const bearingToIntercept = ILSEngine.calculateBearing(
      aircraft.position.lat, aircraft.position.lon,
      interceptPoint.lat, interceptPoint.lon
    );

    updatedAircraft = ILSEngine.turnTowardsBearing(updatedAircraft, bearingToIntercept, performance.turnRate, deltaTime);
    updatedAircraft.assignedAltitude = 5000;

    // Check if on arc (loose tolerance: 15-19 NM is acceptable)
    const onArc = currentDME >= 15.0 && currentDME <= 19.0;

    // Transition to ARC phase when on arc
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
    if (Math.abs(radialDiff) < 25 || distanceToIF < 6) {
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

    // Set altitude based on entry point
    if (aircraft.ilsApproach.entryPoint === 'IF_ILS') {
      updatedAircraft.assignedAltitude = 4500;
    } else {
      updatedAircraft.assignedAltitude = 5000;
    }

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

    // Descend to 5000 ft while approaching KEKAG
    updatedAircraft.assignedAltitude = 5000;

    // Check if we've passed KEKAG (for direct KEKAG entries)
    let passedKekag = true; // Default true for IF_ILS entries
    if (updatedAircraft.ilsApproach.entryPoint === 'KEKAG') {
      const kekagData = INSTRUMENTAL_POINTS['KEKAG'];
      const kekagPosition = CoordinateUtils.radialDistanceToLatLon(
        ARP.lat, ARP.lon,
        kekagData.radial, kekagData.distance
      );

      const distanceToKekag = ILSEngine.calculateDistance(
        aircraft.position.lat, aircraft.position.lon,
        kekagPosition.lat, kekagPosition.lon
      );

      // Consider passed KEKAG if we're within 3 NM or already past it (closer to threshold)
      passedKekag = distanceToKekag < 3 || distanceToThreshold < 18;
    }

    // Start final approach (glideslope) only after passing KEKAG
    const headingError = Math.abs(((aircraft.heading - localizerTrack + 180) % 360) - 180);
    const established = headingError < 45 || distanceToThreshold < 8; // Very relaxed

    if (passedKekag && established && distanceToThreshold < 15) {
      console.log(`${aircraft.callsign}: Passed entry point, established on localizer, beginning glideslope descent`);
      updatedAircraft.ilsApproach.phase = 'FINAL_APPROACH';
      updatedAircraft.state = AIRCRAFT_STATES.APPROACH;
      updatedAircraft.assignedSpeed = ILS_30R.speeds[aircraft.type].final;
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

      // Accumulate simulation time
      updatedAircraft.ilsApproach.landingElapsedTime =
        (aircraft.ilsApproach.landingElapsedTime || 0) + deltaTime;

      // Check if 7 seconds have passed (simulation time)
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
