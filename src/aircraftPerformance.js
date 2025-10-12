// Aircraft performance characteristics for different types

const AIRCRAFT_PERFORMANCE = {
  'VFR': {
    takeoffSpeed: 80,        // Rotation/liftoff speed in knots
    acceleration: 3,         // Acceleration rate in knots per second (ground)
    deceleration: 2,         // Deceleration rate in knots per second
    climbRate: 500,          // Climb rate in feet per minute
    descentRate: 500,        // Descent rate in feet per minute
    climbSpeed: 100,         // Speed maintained during climb in knots
    maxSpeed: 250,           // Maximum speed in knots
    cruiseSpeed: 120,        // Cruise speed in knots
    turnRate: 3              // Turn rate in degrees per second (standard rate)
  },
  'IFR': {
    takeoffSpeed: 150,       // Rotation/liftoff speed in knots
    acceleration: 5,         // Acceleration rate in knots per second (ground)
    deceleration: 3,         // Deceleration rate in knots per second
    climbRate: 2200,         // Climb rate in feet per minute (typical for 737-800)
    descentRate: 2000,       // Descent rate in feet per minute
    climbSpeed: 250,         // Speed maintained during climb in knots
    maxSpeed: 450,           // Maximum speed in knots
    cruiseSpeed: 250,        // Cruise speed in knots
    turnRate: 1.5            // Turn rate in degrees per second (half rate for heavy jets)
  },
  'Military': {
    takeoffSpeed: 180,       // Rotation/liftoff speed in knots
    acceleration: 8,         // Acceleration rate in knots per second (ground)
    deceleration: 5,         // Deceleration rate in knots per second
    climbRate: 12000,        // Climb rate in feet per minute (realistic for fighter jets)
    descentRate: 6000,       // Descent rate in feet per minute
    climbSpeed: 350,         // Speed maintained during climb in knots
    maxSpeed: 600,           // Maximum speed in knots
    cruiseSpeed: 350,        // Cruise speed in knots
    turnRate: 6              // Turn rate in degrees per second (rate two for fighters)
  }
};

export { AIRCRAFT_PERFORMANCE };
