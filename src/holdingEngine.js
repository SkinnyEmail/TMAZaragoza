import { GeometryUtils } from './geometryUtils';

const HoldingEngine = {
  /**
   * Update aircraft in holding pattern
   */
  updateAircraftWithHolding: (aircraft, deltaTime) => {
    if (!aircraft.holdingPattern) {
      return aircraft;
    }

    let updatedAircraft = { ...aircraft };
    const holding = updatedAircraft.holdingPattern;
    const phase = holding.phase;

    // Note: Altitude is NOT managed by holding - aircraft respects assignedAltitude from ATC commands

    // Update based on current phase
    switch (phase) {
      case 'TO_FIX':
        updatedAircraft = HoldingEngine.updateToFixPhase(updatedAircraft, deltaTime);
        break;
      case 'INBOUND':
        updatedAircraft = HoldingEngine.updateInboundPhase(updatedAircraft, deltaTime);
        break;
      case 'TURN_INBOUND':
        updatedAircraft = HoldingEngine.updateTurnInboundPhase(updatedAircraft, deltaTime);
        break;
      case 'OUTBOUND':
        updatedAircraft = HoldingEngine.updateOutboundPhase(updatedAircraft, deltaTime);
        break;
      case 'TURN_OUTBOUND':
        updatedAircraft = HoldingEngine.updateTurnOutboundPhase(updatedAircraft, deltaTime);
        break;
      default:
        console.warn(`Unknown holding phase: ${phase}`);
    }

    return updatedAircraft;
  },

  /**
   * Initialize holding pattern for an aircraft
   */
  initializeHolding: (aircraft, fixName, fixLat, fixLon, inboundTrack, turnDirection, legTime) => {
    // Determine initial phase
    let initialPhase = 'TO_FIX';

    // If already at fix (within 0.5 NM), skip TO_FIX phase
    const distanceToFix = GeometryUtils.calculateDistance(
      aircraft.position.lat,
      aircraft.position.lon,
      fixLat,
      fixLon
    );

    if (distanceToFix < 0.5) {
      initialPhase = 'INBOUND';
    }

    console.log(`${aircraft.callsign}: Holding at ${fixName || 'present position'}, inbound track ${inboundTrack}°, ${turnDirection} turns`);

    return {
      ...aircraft,
      navigationMode: 'HOLDING',
      holdingPattern: {
        fixName: fixName,
        fixLat: fixLat,
        fixLon: fixLon,
        inboundTrack: inboundTrack,
        turnDirection: turnDirection,
        legTime: legTime,
        phase: initialPhase,
        elapsedSimTime: 0  // Accumulates simulation deltaTime
      }
    };
  },

  /**
   * Phase: Flying to the holding fix
   */
  updateToFixPhase: (aircraft, deltaTime) => {
    const holding = aircraft.holdingPattern;

    // Calculate distance and bearing to fix
    const distanceToFix = GeometryUtils.calculateDistance(
      aircraft.position.lat,
      aircraft.position.lon,
      holding.fixLat,
      holding.fixLon
    );

    const bearingToFix = GeometryUtils.calculateBearing(
      aircraft.position.lat,
      aircraft.position.lon,
      holding.fixLat,
      holding.fixLon
    );

    // Turn towards fix
    const updatedAircraft = HoldingEngine.turnTowardsBearing(aircraft, bearingToFix, deltaTime);

    // Check if reached fix (within 0.5 NM)
    if (distanceToFix < 0.5) {
      console.log(`${aircraft.callsign}: Reached holding fix, beginning inbound leg`);
      updatedAircraft.holdingPattern.phase = 'INBOUND';
      updatedAircraft.holdingPattern.elapsedSimTime = 0; // Reset timer for inbound leg
    }

    return updatedAircraft;
  },

  /**
   * Phase: Flying inbound to the fix
   */
  updateInboundPhase: (aircraft, deltaTime) => {
    const holding = aircraft.holdingPattern;

    // Fly the inbound track
    const updatedAircraft = HoldingEngine.turnTowardsBearing(aircraft, holding.inboundTrack, deltaTime);

    // Calculate distance to fix
    const distanceToFix = GeometryUtils.calculateDistance(
      aircraft.position.lat,
      aircraft.position.lon,
      holding.fixLat,
      holding.fixLon
    );

    // When crossing the fix (within 0.3 NM), start turn to outbound
    if (distanceToFix < 0.3) {
      console.log(`${aircraft.callsign}: Crossing fix, turning to outbound`);
      updatedAircraft.holdingPattern.phase = 'TURN_INBOUND';
    }

    return updatedAircraft;
  },

  /**
   * Phase: Turning from inbound to outbound at the fix
   */
  updateTurnInboundPhase: (aircraft, deltaTime) => {
    const holding = aircraft.holdingPattern;

    // Calculate outbound track
    const outboundTrack = (holding.inboundTrack + 180) % 360;

    // Turn towards outbound track
    const updatedAircraft = HoldingEngine.turnTowardsBearing(aircraft, outboundTrack, deltaTime);

    // Check if turn complete (within 5° of outbound track)
    const headingDiff = Math.abs(((updatedAircraft.heading - outboundTrack + 180) % 360) - 180);

    if (headingDiff < 5) {
      console.log(`${aircraft.callsign}: Turn complete, flying outbound`);
      updatedAircraft.holdingPattern.phase = 'OUTBOUND';
      updatedAircraft.holdingPattern.elapsedSimTime = 0; // Reset timer for outbound leg
    }

    return updatedAircraft;
  },

  /**
   * Phase: Flying outbound from the fix
   */
  updateOutboundPhase: (aircraft, deltaTime) => {
    const holding = aircraft.holdingPattern;

    // Calculate outbound track
    const outboundTrack = (holding.inboundTrack + 180) % 360;

    // Fly the outbound track
    const updatedAircraft = HoldingEngine.turnTowardsBearing(aircraft, outboundTrack, deltaTime);

    // Accumulate simulation time
    updatedAircraft.holdingPattern.elapsedSimTime += deltaTime;

    // Check if leg time elapsed (convert legTime from minutes to seconds)
    const legTimeSeconds = holding.legTime * 60;
    if (updatedAircraft.holdingPattern.elapsedSimTime >= legTimeSeconds) {
      console.log(`${aircraft.callsign}: Outbound leg complete (${updatedAircraft.holdingPattern.elapsedSimTime.toFixed(1)}s), turning back to inbound`);
      updatedAircraft.holdingPattern.phase = 'TURN_OUTBOUND';
    }

    return updatedAircraft;
  },

  /**
   * Phase: Turning from outbound back to inbound
   */
  updateTurnOutboundPhase: (aircraft, deltaTime) => {
    const holding = aircraft.holdingPattern;

    // Turn back to inbound track
    const updatedAircraft = HoldingEngine.turnTowardsBearing(aircraft, holding.inboundTrack, deltaTime);

    // Check if turn complete (within 5° of inbound track)
    const headingDiff = Math.abs(((updatedAircraft.heading - holding.inboundTrack + 180) % 360) - 180);

    if (headingDiff < 5) {
      console.log(`${aircraft.callsign}: Turn complete, returning inbound to fix`);
      updatedAircraft.holdingPattern.phase = 'INBOUND';
      updatedAircraft.holdingPattern.elapsedSimTime = 0; // Reset timer for inbound leg
    }

    return updatedAircraft;
  },

  /**
   * Helper: Turn aircraft towards target bearing
   */
  turnTowardsBearing: (aircraft, targetBearing, deltaTime) => {
    const turnRate = 3; // Standard rate turn: 3°/second

    let headingDiff = targetBearing - aircraft.heading;
    if (headingDiff > 180) headingDiff -= 360;
    if (headingDiff < -180) headingDiff += 360;

    const maxTurnThisFrame = turnRate * deltaTime;
    let newHeading = aircraft.heading;

    // Respect turn direction for holding pattern turns
    if (aircraft.holdingPattern && (aircraft.holdingPattern.phase === 'TURN_INBOUND' || aircraft.holdingPattern.phase === 'TURN_OUTBOUND')) {
      const turnDirection = aircraft.holdingPattern.turnDirection;

      // Force turn direction
      if (turnDirection === 'RIGHT') {
        // Always turn right (clockwise)
        if (headingDiff < 0) {
          headingDiff += 360; // Make it positive to force right turn
        }
      } else {
        // Always turn left (counter-clockwise)
        if (headingDiff > 0) {
          headingDiff -= 360; // Make it negative to force left turn
        }
      }
    }

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
  }
};

export { HoldingEngine };
