import { RUNWAY_DATA } from './constants';
import { VOR_12R } from './vorData';
import { AIRCRAFT_STATES } from './aircraftStates';
import { AIRCRAFT_PERFORMANCE } from './aircraftPerformance';

const VOREngine = {
  updateAircraftWithVOR: (aircraft, deltaTime) => {
    if (!aircraft.vorApproach) {
      return aircraft;
    }

    let updatedAircraft = { ...aircraft };
    const performance = AIRCRAFT_PERFORMANCE[aircraft.type];
    const phase = aircraft.vorApproach.phase;

    // Update based on current phase
    switch (phase) {
      case 'TO_VOR':
        updatedAircraft = VOREngine.updateToVORPhase(updatedAircraft, deltaTime, performance);
        break;
      case 'OUTBOUND':
        updatedAircraft = VOREngine.updateOutboundPhase(updatedAircraft, deltaTime, performance);
        break;
      case 'TO_IF':
        updatedAircraft = VOREngine.updateToIFPhase(updatedAircraft, deltaTime, performance);
        break;
      case 'FAF_INBOUND':
        updatedAircraft = VOREngine.updateFAFInboundPhase(updatedAircraft, deltaTime, performance);
        break;
      case 'FINAL_APPROACH':
        updatedAircraft = VOREngine.updateFinalApproachPhase(updatedAircraft, deltaTime, performance);
        break;
      case 'LANDING':
        updatedAircraft = VOREngine.updateLandingPhase(updatedAircraft, deltaTime, performance);
        break;
      default:
        console.warn(`Unknown VOR phase: ${phase}`);
    }

    return updatedAircraft;
  },

  /**
   * Initialize VOR approach for an aircraft
   */
  initializeVOR: (aircraft, entryPoint) => {
    const entry = VOR_12R.entryPoints[entryPoint];

    if (!entry) {
      console.error(`Invalid VOR entry point: ${entryPoint}`);
      return aircraft;
    }

    let initialPhase;
    if (entry.type === 'straight') {
      // Straight-in to IF - skip VOR and outbound leg
      initialPhase = 'TO_IF';
    } else {
      // Full procedure - start at VOR
      initialPhase = 'TO_VOR';
    }

    console.log(`${aircraft.callsign}: VOR 12R cleared via ${entryPoint}`);

    return {
      ...aircraft,
      navigationMode: 'VOR_APPROACH',
      vorApproach: {
        entryPoint: entryPoint,
        phase: initialPhase
      },
      assignedAltitude: 5000
    };
  },

  /**
   * Phase 1: Fly to VOR (full procedure only)
   */
  updateToVORPhase: (aircraft, deltaTime, performance) => {
    const vor = VOR_12R.vor;

    // Calculate distance and bearing to VOR
    const distanceToVOR = VOREngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      vor.lat, vor.lon
    );

    const bearingToVOR = VOREngine.calculateBearing(
      aircraft.position.lat, aircraft.position.lon,
      vor.lat, vor.lon
    );

    // Turn toward VOR
    let updatedAircraft = VOREngine.turnTowardsBearing(aircraft, bearingToVOR, performance.turnRate, deltaTime);
    updatedAircraft.assignedAltitude = 5000;

    // Within 1 NM of VOR - transition to outbound
    if (distanceToVOR < 1.0) {
      console.log(`${aircraft.callsign}: Over VOR, proceeding outbound on radial ${vor.outboundRadial}`);
      updatedAircraft.vorApproach.phase = 'OUTBOUND';
    }

    return updatedAircraft;
  },

  /**
   * Phase 2: Outbound on radial 300° to 18 DME (IF)
   */
  updateOutboundPhase: (aircraft, deltaTime, performance) => {
    const vor = VOR_12R.vor;
    const outboundTrack = vor.outboundRadial; // 300°

    // Calculate current DME from VOR
    const currentDME = VOREngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      vor.lat, vor.lon
    );

    // Turn to outbound track
    let updatedAircraft = VOREngine.turnTowardsBearing(aircraft, outboundTrack, performance.turnRate, deltaTime);
    updatedAircraft.assignedAltitude = 5000;

    // Check if reached IF (18 DME)
    if (currentDME >= VOR_12R.intermediateFixDistance) {
      console.log(`${aircraft.callsign}: Reached IF at ${currentDME.toFixed(1)} DME, turning inbound`);
      updatedAircraft.vorApproach.phase = 'FAF_INBOUND';
    }

    return updatedAircraft;
  },

  /**
   * Phase 3: Direct to IF (straight-in entries)
   */
  updateToIFPhase: (aircraft, deltaTime, performance) => {
    const ifPosition = VOR_12R.intermediateFixPosition;

    // Calculate distance and bearing to IF
    const distanceToIF = VOREngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      ifPosition.lat, ifPosition.lon
    );

    const bearingToIF = VOREngine.calculateBearing(
      aircraft.position.lat, aircraft.position.lon,
      ifPosition.lat, ifPosition.lon
    );

    // Turn toward IF
    let updatedAircraft = VOREngine.turnTowardsBearing(aircraft, bearingToIF, performance.turnRate, deltaTime);
    updatedAircraft.assignedAltitude = 5000;

    // Within 1 NM of IF - transition to FAF inbound
    if (distanceToIF < 1.0) {
      console.log(`${aircraft.callsign}: Reached IF, proceeding to FAF`);
      updatedAircraft.vorApproach.phase = 'FAF_INBOUND';
    }

    return updatedAircraft;
  },

  /**
   * Phase 4: Inbound from IF to FAF (18 DME to 8.9 DME)
   */
  updateFAFInboundPhase: (aircraft, deltaTime, performance) => {
    const vor = VOR_12R.vor;
    const threshold = RUNWAY_DATA['12R'].threshold;

    // Calculate current DME from VOR
    const currentDME = VOREngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      vor.lat, vor.lon
    );

    // Calculate bearing to threshold for more direct approach
    const bearingToThreshold = VOREngine.calculateBearing(
      aircraft.position.lat, aircraft.position.lon,
      threshold.lat, threshold.lon
    );

    // Use bearing to threshold (more forgiving)
    let updatedAircraft = VOREngine.turnTowardsBearing(aircraft, bearingToThreshold, performance.turnRate, deltaTime);
    updatedAircraft.assignedAltitude = 5000;

    // Check if reached FAF (8.9 DME or closer)
    if (currentDME <= VOR_12R.finalApproachFixDistance) {
      console.log(`${aircraft.callsign}: Reached FAF at ${currentDME.toFixed(1)} DME, beginning final descent`);
      updatedAircraft.vorApproach.phase = 'FINAL_APPROACH';
      updatedAircraft.state = AIRCRAFT_STATES.APPROACH;
      // Start speed reduction on final approach
      updatedAircraft.assignedSpeed = VOR_12R.speeds[aircraft.type].final;
    }

    return updatedAircraft;
  },

  /**
   * Phase 5: Final approach with glideslope descent
   */
  updateFinalApproachPhase: (aircraft, deltaTime, performance) => {
    const vor = VOR_12R.vor;
    const threshold = RUNWAY_DATA['12R'].threshold;

    // Calculate distance from VOR and threshold
    const currentDME = VOREngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      vor.lat, vor.lon
    );

    const distanceToThreshold = VOREngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      threshold.lat, threshold.lon
    );

    const bearingToThreshold = VOREngine.calculateBearing(
      aircraft.position.lat, aircraft.position.lon,
      threshold.lat, threshold.lon
    );

    // Maintain final approach track - use bearing to threshold to allow course corrections
    let updatedAircraft = VOREngine.turnTowardsBearing(aircraft, bearingToThreshold, performance.turnRate, deltaTime);

    // Calculate target altitude based on stepdown fixes
    let targetAltitude = 2900; // Default to FAF altitude
    for (let i = 0; i < VOR_12R.stepdownFixes.length; i++) {
      const fix = VOR_12R.stepdownFixes[i];
      if (currentDME <= fix.dme) {
        targetAltitude = fix.altitude;
      }
    }

    // Below MAPt distance, use distance-based glideslope to threshold
    if (currentDME < 3.7) {
      const glideslopeAltitude = Math.max(distanceToThreshold * VOR_12R.descentRate, 0);
      targetAltitude = Math.min(targetAltitude, glideslopeAltitude);
    }

    updatedAircraft.assignedAltitude = targetAltitude;
    updatedAircraft.assignedSpeed = VOR_12R.speeds[aircraft.type].final;
    updatedAircraft.state = AIRCRAFT_STATES.APPROACH;

    // Below 500 ft - transition to landing
    if (updatedAircraft.altitude < VOR_12R.landing.transitionAltitude) {
      console.log(`${aircraft.callsign}: Entering landing phase at ${Math.round(updatedAircraft.altitude)} ft`);
      updatedAircraft.vorApproach.phase = 'LANDING';
      updatedAircraft.vorApproach.landingElapsedTime = 0; // Start accumulating sim time
      updatedAircraft.state = AIRCRAFT_STATES.LANDING;
    }

    return updatedAircraft;
  },

  /**
   * Phase 6: Landing rollout
   */
  updateLandingPhase: (aircraft, deltaTime) => {
    let updatedAircraft = { ...aircraft };

    // Lock runway heading at 120° - no more turning, straight line only
    const runwayHeading = RUNWAY_DATA['12R'].heading; // 120°
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
      updatedAircraft.vorApproach.landingElapsedTime =
        (aircraft.vorApproach.landingElapsedTime || 0) + deltaTime;

      // After 7 seconds on the ground, mark as landed
      if (updatedAircraft.vorApproach.landingElapsedTime >= 7) {
        console.log(`${aircraft.callsign}: Landing roll complete (${updatedAircraft.vorApproach.landingElapsedTime.toFixed(1)}s)`);
        updatedAircraft.landed = true;
      }
    } else {
      // Still in air - slow to touchdown speed
      updatedAircraft.assignedSpeed = VOR_12R.landing.touchdownSpeed;
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
    let newHeading;
    if (Math.abs(headingDiff) <= maxTurn) {
      newHeading = targetBearing;
    } else {
      newHeading = aircraft.heading + Math.sign(headingDiff) * maxTurn;
    }

    return {
      ...aircraft,
      heading: (newHeading + 360) % 360
    };
  }
};

export { VOREngine };
