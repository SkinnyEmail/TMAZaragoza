// Aircraft state constants

const AIRCRAFT_STATES = {
  PARKED: 'PARKED',               // On runway, speed = 0, awaiting takeoff clearance
  TAKEOFF_ROLL: 'TAKEOFF_ROLL',   // Accelerating on runway
  CLIMBING: 'CLIMBING',           // Airborne, climbing to assigned altitude
  CRUISE: 'CRUISE',               // At assigned altitude, maintaining heading/speed
  DESCENDING: 'DESCENDING',       // Descending to assigned altitude
  APPROACH: 'APPROACH',           // On ILS approach, descending on glideslope
  LANDING: 'LANDING'              // Final landing phase (below 500 ft)
};

export { AIRCRAFT_STATES };
