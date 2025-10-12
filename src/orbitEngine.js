const OrbitEngine = {
  /**
   * Update aircraft in orbit pattern
   */
  updateAircraftWithOrbit: (aircraft, deltaTime) => {
    if (!aircraft.orbit) {
      return aircraft;
    }

    let updatedAircraft = { ...aircraft };
    const orbit = updatedAircraft.orbit;

    // Continuous turn based on orbit direction
    const turnRate = 3; // Standard rate turn: 3°/second

    if (orbit.direction === 'RIGHT') {
      // Turn right (clockwise) - positive turn rate
      updatedAircraft.heading = (aircraft.heading + turnRate * deltaTime + 360) % 360;
    } else {
      // Turn left (counter-clockwise) - negative turn rate
      updatedAircraft.heading = (aircraft.heading - turnRate * deltaTime + 360) % 360;
    }

    // Note: Altitude is NOT managed by orbit - aircraft respects assignedAltitude from ATC commands
    // Aircraft maintains current speed and continues turning indefinitely

    return updatedAircraft;
  },

  /**
   * Initialize orbit for an aircraft
   */
  initializeOrbit: (aircraft, direction) => {
    console.log(`${aircraft.callsign}: Orbiting ${direction === 'RIGHT' ? 'right' : 'left'} in place`);

    return {
      ...aircraft,
      navigationMode: 'ORBIT',
      orbit: {
        direction: direction
      },
      // Clear all other navigation states to prevent interference
      assignedHeading: null,
      assignedRoute: null,
      routeWaypointIndex: 0,
      assignedSID: null,
      sidComplete: false,
      ilsApproach: null,
      holdingPattern: null
    };
  }
};

export { OrbitEngine };
