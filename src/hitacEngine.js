import { RUNWAY_DATA } from './constants';
import { HITAC_12R, ZAR_TACAN } from './hitacData_12R';
import { AIRCRAFT_STATES } from './aircraftStates';
import { AIRCRAFT_PERFORMANCE } from './aircraftPerformance';
import { CoordinateUtils } from './utils';

const HITACEngine = {
  /**
   * Main update function for HI-TAC approach
   */
  updateAircraftWithHITAC: (aircraft, deltaTime) => {
    if (!aircraft.hitacApproach) {
      return aircraft;
    }

    let updatedAircraft = { ...aircraft };
    const performance = AIRCRAFT_PERFORMANCE[aircraft.type];
    const phase = aircraft.hitacApproach.phase;

    // Update based on current phase
    switch (phase) {
      case 'TO_AMBEL_HITAC12R':
        updatedAircraft = HITACEngine.updateToAmbelPhase(updatedAircraft, deltaTime, performance);
        break;
      case 'OUTBOUND_R281_HITAC12R':
        updatedAircraft = HITACEngine.updateOutboundR281Phase(updatedAircraft, deltaTime, performance);
        break;
      case 'TURN_TO_IF_HITAC12R':
        updatedAircraft = HITACEngine.updateTurnToIFPhase(updatedAircraft, deltaTime, performance);
        break;
      case 'IF_TO_FAF_HITAC12R':
        updatedAircraft = HITACEngine.updateIFToFAFPhase(updatedAircraft, deltaTime, performance);
        break;
      case 'FINAL_APPROACH_HITAC12R':
        updatedAircraft = HITACEngine.updateFinalApproachPhase(updatedAircraft, deltaTime, performance);
        break;
      case 'LANDING_HITAC12R':
        updatedAircraft = HITACEngine.updateLandingPhase(updatedAircraft, deltaTime);
        break;
      default:
        console.warn(`Unknown HI-TAC phase: ${phase}`);
    }

    return updatedAircraft;
  },

  /**
   * Initialize HI-TAC approach for an aircraft
   */
  initializeHITAC: (aircraft, entryType) => {
    const entry = HITAC_12R.entryTypes[entryType];

    if (!entry) {
      console.error(`Invalid HI-TAC entry type: ${entryType}`);
      return aircraft;
    }

    let initialAltitude;
    let initialPhase = entry.initialPhase;

    if (entryType === 'STRAIGHT_IN') {
      // Straight-in to IF at 6000 ft
      initialAltitude = 6000;
    } else {
      // Full procedure - immediately assign FL200
      initialAltitude = 20000;
    }

    console.log(`${aircraft.callsign}: Initialized HI-TAC 12R approach, entry: ${entryType}, phase: ${initialPhase}`);
    console.log(`  Current altitude: ${Math.round(aircraft.altitude)} ft, Assigned altitude: ${initialAltitude} ft`);

    return {
      ...aircraft,
      navigationMode: 'HITAC_APPROACH',
      hitacApproach: {
        runway: '12R',
        entryType: entryType,
        phase: initialPhase,
        hasPassedAmbel: false  // Track whether we've passed Ambel (for descent logic)
      },
      assignedAltitude: initialAltitude  // Assign target altitude (aircraft will climb/descend naturally)
      // Don't set state - let movement engine handle CLIMBING/DESCENDING based on altitude difference
    };
  },

  /**
   * PHASE 1: Navigate to Ambel IAF at FL200
   */
  updateToAmbelPhase: (aircraft, deltaTime, performance) => {
    const ambel = HITAC_12R.iaf;

    // Calculate distance to Ambel
    const distanceToAmbel = HITACEngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      ambel.lat, ambel.lon
    );

    // Calculate bearing to Ambel
    const bearingToAmbel = HITACEngine.calculateBearing(
      aircraft.position.lat, aircraft.position.lon,
      ambel.lat, ambel.lon
    );

    // Turn toward Ambel
    let updatedAircraft = HITACEngine.turnTowardsBearing(aircraft, bearingToAmbel, performance.turnRate, deltaTime);
    updatedAircraft.assignedAltitude = 20000;  // Maintain FL200
    updatedAircraft.assignedSpeed = HITAC_12R.speeds.Military.initial;

    // Within 1.0 NM of Ambel - transition to radial intercept phase
    if (distanceToAmbel < 1.0) {
      console.log(`${aircraft.callsign}: PHASE 1→2 Passed Ambel (${distanceToAmbel.toFixed(1)} NM), intercepting R-295 inbound to ZAR`);
      updatedAircraft.hitacApproach.phase = 'OUTBOUND_R281_HITAC12R';
      updatedAircraft.hitacApproach.hasPassedAmbel = true;
    }

    return updatedAircraft;
  },

  /**
   * PHASE 2: Intercept and track R-295 inbound to ZAR, descend to 6000 ft
   * Logic: Same as VOR 30R radial intercept
   * - R-295 FROM ZAR means heading 115° TO ZAR when established
   * - Turn to IF when reaching 20 DME from ZAR
   * - Calculate descent to reach IF at 6000 ft
   */
  updateOutboundR281Phase: (aircraft, deltaTime, performance) => {
    const zar = ZAR_TACAN;
    const targetRadial = 295; // Radial 295° FROM ZAR
    const inboundHeading = 115; // Heading TO ZAR when established on radial (295 - 180 = 115)
    const turnDME = 20.0; // Turn to IF at 20 DME

    // Calculate current DME from ZAR
    const currentDME = HITACEngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      zar.lat, zar.lon
    );

    // Calculate current radial FROM ZAR (where aircraft is positioned)
    const currentRadial = HITACEngine.calculateBearing(
      zar.lat, zar.lon,
      aircraft.position.lat, aircraft.position.lon
    );

    // Calculate angular difference from target radial
    let radialDiff = targetRadial - currentRadial;
    if (radialDiff > 180) radialDiff -= 360;
    if (radialDiff < -180) radialDiff += 360;

    // Calculate cross-track error (perpendicular distance from R-281 line)
    const crossTrackError = currentDME * Math.sin(radialDiff * Math.PI / 180);

    // Determine if ON radial (within 0.5 NM tolerance)
    const onRadial = Math.abs(crossTrackError) < HITAC_12R.radialIntercept.tolerance;

    let targetHeading;

    if (!onRadial) {
      // NOT on radial - intercept it
      // Create waypoint ahead on R-281 to fly toward
      const interceptDistance = Math.max(currentDME - 5, turnDME); // Don't go past 20 DME
      const interceptPoint = CoordinateUtils.radialDistanceToLatLon(
        zar.lat, zar.lon,
        targetRadial,
        interceptDistance
      );

      // Fly toward the intercept point (this gets us ONTO the radial)
      targetHeading = HITACEngine.calculateBearing(
        aircraft.position.lat, aircraft.position.lon,
        interceptPoint.lat, interceptPoint.lon
      );
    } else {
      // ON radial - fly inbound heading to ZAR
      targetHeading = inboundHeading; // Heading 079° TO ZAR
    }

    // Turn toward target heading
    let updatedAircraft = HITACEngine.turnTowardsBearing(aircraft, targetHeading, performance.turnRate, deltaTime);

    // Smart descent from FL200 to 6000 ft to reach IF at correct altitude
    const ifPosition = HITAC_12R.intermediatefix;
    const distanceToIF = HITACEngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      ifPosition.lat, ifPosition.lon
    );

    // Calculate required descent rate to reach IF at 6000 ft
    const targetAltitudeAtIF = 6000;
    const currentAltitude = aircraft.altitude;
    const altitudeDifference = currentAltitude - targetAltitudeAtIF;

    if (altitudeDifference > 0 && distanceToIF > 0.1) {
      // Need to descend - calculate descent rate in ft/NM
      const descentRate = altitudeDifference / distanceToIF;
      // Apply descent gradually
      const descentThisFrame = descentRate * (aircraft.speed / 3600) * deltaTime;
      updatedAircraft.assignedAltitude = Math.max(targetAltitudeAtIF, currentAltitude - descentThisFrame * 60);
    } else {
      // Already at or below 6000 ft
      updatedAircraft.assignedAltitude = targetAltitudeAtIF;
    }

    updatedAircraft.assignedSpeed = HITAC_12R.speeds.Military.initial;

    // Reached 20 DME - turn left to IF
    if (currentDME <= turnDME) {
      console.log(`${aircraft.callsign}: PHASE 2→3 At ${currentDME.toFixed(1)} DME from ZAR, turning left to IF`);
      updatedAircraft.hitacApproach.phase = 'TURN_TO_IF_HITAC12R';
    }

    return updatedAircraft;
  },

  /**
   * PHASE 3: Turn left and fly direct to IF, continue descent to 6000 ft
   */
  updateTurnToIFPhase: (aircraft, deltaTime, performance) => {
    const ifPosition = HITAC_12R.intermediatefix;

    // Calculate distance to IF
    const distanceToIF = HITACEngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      ifPosition.lat, ifPosition.lon
    );

    // Calculate bearing to IF
    const bearingToIF = HITACEngine.calculateBearing(
      aircraft.position.lat, aircraft.position.lon,
      ifPosition.lat, ifPosition.lon
    );

    // Turn toward IF
    let updatedAircraft = HITACEngine.turnTowardsBearing(aircraft, bearingToIF, performance.turnRate, deltaTime);

    // Continue smart descent to 6000 ft
    const targetAltitudeAtIF = 6000;
    const currentAltitude = aircraft.altitude;
    const altitudeDifference = currentAltitude - targetAltitudeAtIF;

    if (altitudeDifference > 0 && distanceToIF > 0.1) {
      const descentRate = altitudeDifference / distanceToIF;
      const descentThisFrame = descentRate * (aircraft.speed / 3600) * deltaTime;
      updatedAircraft.assignedAltitude = Math.max(targetAltitudeAtIF, currentAltitude - descentThisFrame * 60);
    } else {
      updatedAircraft.assignedAltitude = targetAltitudeAtIF;
    }

    updatedAircraft.assignedSpeed = HITAC_12R.speeds.Military.intermediate;

    // Within 2.0 NM of IF - transition to IF-to-FAF phase (increased for high-speed military aircraft)
    if (distanceToIF < 2.0) {
      console.log(`${aircraft.callsign}: PHASE 3→4 Reached IF at ${aircraft.altitude.toFixed(0)} ft (${distanceToIF.toFixed(1)} NM), turning right to FAF`);
      updatedAircraft.hitacApproach.phase = 'IF_TO_FAF_HITAC12R';
    }

    return updatedAircraft;
  },

  /**
   * PHASE 4: Turn right from IF to FAF, descend from 6000 ft to 2800 ft
   */
  updateIFToFAFPhase: (aircraft, deltaTime, performance) => {
    const fafPosition = HITAC_12R.faf;

    // Calculate distance to FAF
    const distanceToFAF = HITACEngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      fafPosition.lat, fafPosition.lon
    );

    // Calculate bearing to FAF
    const bearingToFAF = HITACEngine.calculateBearing(
      aircraft.position.lat, aircraft.position.lon,
      fafPosition.lat, fafPosition.lon
    );

    // Turn toward FAF
    let updatedAircraft = HITACEngine.turnTowardsBearing(aircraft, bearingToFAF, performance.turnRate, deltaTime);

    // Smart descent from 6000 ft to 2800 ft to reach FAF at correct altitude
    const targetAltitudeAtFAF = 2800;
    const currentAltitude = aircraft.altitude;
    const altitudeDifference = currentAltitude - targetAltitudeAtFAF;

    if (altitudeDifference > 0 && distanceToFAF > 0.1) {
      const descentRate = altitudeDifference / distanceToFAF;
      const descentThisFrame = descentRate * (aircraft.speed / 3600) * deltaTime;
      updatedAircraft.assignedAltitude = Math.max(targetAltitudeAtFAF, currentAltitude - descentThisFrame * 60);
    } else {
      updatedAircraft.assignedAltitude = targetAltitudeAtFAF;
    }

    updatedAircraft.assignedSpeed = HITAC_12R.speeds.Military.intermediate;

    // Within 2.0 NM of FAF - transition to final approach phase (increased for high-speed military aircraft)
    if (distanceToFAF < 2.0) {
      console.log(`${aircraft.callsign}: PHASE 4→5 Passed FAF at ${aircraft.altitude.toFixed(0)} ft (${distanceToFAF.toFixed(1)} NM), beginning final approach`);
      updatedAircraft.hitacApproach.phase = 'FINAL_APPROACH_HITAC12R';
      updatedAircraft.state = AIRCRAFT_STATES.APPROACH;
    }

    return updatedAircraft;
  },

  /**
   * PHASE 5: Final approach from FAF (2800 ft) to threshold
   * Descend on glideslope to runway 12R
   */
  updateFinalApproachPhase: (aircraft, deltaTime, performance) => {
    const runway = RUNWAY_DATA['12R'];
    const threshold = runway.threshold;

    // Calculate distance to threshold
    const distanceToThreshold = HITACEngine.calculateDistance(
      aircraft.position.lat, aircraft.position.lon,
      threshold.lat, threshold.lon
    );

    // Calculate bearing to threshold (should be close to runway heading 120°)
    const bearingToThreshold = HITACEngine.calculateBearing(
      aircraft.position.lat, aircraft.position.lon,
      threshold.lat, threshold.lon
    );

    // Turn toward runway heading
    let updatedAircraft = HITACEngine.turnTowardsBearing(aircraft, bearingToThreshold, performance.turnRate, deltaTime);

    // Distance-based glideslope descent (AGL - Above Ground Level)
    // 300 ft/NM descent rate, descending to ground level
    const altitudeAGL = distanceToThreshold * HITAC_12R.descentRate;
    const targetAltitude = Math.max(0, altitudeAGL); // Minimum 0 AGL (ground level)

    updatedAircraft.assignedAltitude = targetAltitude;
    updatedAircraft.assignedSpeed = HITAC_12R.speeds.Military.final;
    updatedAircraft.state = AIRCRAFT_STATES.APPROACH; // Ensure proper state for descent

    // Below 300 ft - transition to landing phase (lower than VOR for military precision)
    if (updatedAircraft.altitude < 300) {
      console.log(`${aircraft.callsign}: PHASE 5→6 Transitioning to landing phase at ${Math.round(updatedAircraft.altitude)} ft`);
      updatedAircraft.hitacApproach.phase = 'LANDING_HITAC12R';
      updatedAircraft.hitacApproach.landingElapsedTime = 0;
      updatedAircraft.state = AIRCRAFT_STATES.LANDING;
    }

    return updatedAircraft;
  },

  /**
   * PHASE 6: Landing rollout - delete aircraft after 7 seconds on ground
   */
  updateLandingPhase: (aircraft, deltaTime) => {
    const runway = RUNWAY_DATA['12R'];
    const runwayHeading = runway.heading;

    let updatedAircraft = { ...aircraft };

    // Lock heading to runway
    updatedAircraft.heading = runwayHeading;
    updatedAircraft.assignedHeading = runwayHeading;

    // Descend to ground
    updatedAircraft.assignedAltitude = 0;

    // Check if touched down (altitude <= 50 ft means on ground)
    const hasTouchedDown = updatedAircraft.altitude <= 50;

    if (hasTouchedDown) {
      // Aircraft is on the ground - slow down and accumulate landing time
      updatedAircraft.assignedSpeed = 0;
      updatedAircraft.altitude = 0;

      // Accumulate time on ground
      updatedAircraft.hitacApproach.landingElapsedTime =
        (aircraft.hitacApproach.landingElapsedTime || 0) + deltaTime;

      console.log(`${aircraft.callsign}: On ground, rollout time: ${updatedAircraft.hitacApproach.landingElapsedTime.toFixed(1)}s / 7s`);

      // After 7 seconds on ground, mark as landed (will be deleted by game loop)
      if (updatedAircraft.hitacApproach.landingElapsedTime >= HITAC_12R.landing.rolloutTime) {
        console.log(`${aircraft.callsign}: Landed on runway 12R via HI-TAC (${updatedAircraft.hitacApproach.landingElapsedTime.toFixed(1)}s)`);
        updatedAircraft.landed = true;
      }
    } else {
      // Still in the air - maintain final approach speed
      console.log(`${aircraft.callsign}: Landing phase - altitude ${Math.round(updatedAircraft.altitude)} ft, descending to runway`);
      updatedAircraft.assignedSpeed = HITAC_12R.landing.touchdownSpeed;
    }

    return updatedAircraft;
  },

  /**
   * Calculate great circle distance in nautical miles
   */
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 3440.065; // Earth radius in NM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Calculate bearing from point 1 to point 2 in degrees
   */
  calculateBearing: (lat1, lon1, lat2, lon2) => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  },

  /**
   * Turn aircraft toward target bearing
   */
  turnTowardsBearing: (aircraft, targetBearing, turnRate, deltaTime) => {
    let currentHeading = aircraft.heading;
    let diff = targetBearing - currentHeading;

    // Normalize to [-180, 180]
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    // Apply turn rate limit
    const maxTurn = turnRate * deltaTime;
    if (Math.abs(diff) <= maxTurn) {
      currentHeading = targetBearing;
    } else {
      currentHeading += Math.sign(diff) * maxTurn;
    }

    // Normalize heading to [0, 360)
    currentHeading = (currentHeading + 360) % 360;

    return {
      ...aircraft,
      heading: currentHeading,
      assignedHeading: targetBearing
    };
  }
};

export { HITACEngine };
