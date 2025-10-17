// Visual Approach Traffic Pattern Data
import { ARP } from './constants';
import { CoordinateUtils } from './utils';

const VISUAL_PATTERNS = {
  '30R_RIGHT': {
    runway: '30R',
    patternName: 'Runway 30 (Right Pattern)',
    runwayHeading: 300,

    // Waypoints from ARP using exact radial/distance specifications
    downwindWaypoint: CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, 349, 2.6),
    baseWaypoint: CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, 83, 3.8),
    finalWaypoint: CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, 106, 3.3),

    // Speed profile (progressive deceleration)
    speeds: {
      atzEntry: 150,      // kt - speed when entering ATZ
      downwind: 150,      // kt - at downwind waypoint
      base: 120,          // kt - at base waypoint
      final: 100,         // kt - at final waypoint
      finalApproach: 80,  // kt - on final approach to threshold
      touchdown: 50       // kt - landing speed
    },

    // Altitude profile (progressive descent)
    altitudes: {
      atzEntry: 800,      // ft (FL008) - altitude when entering ATZ
      downwind: 800,      // ft - at downwind waypoint
      base: 600,          // ft - at base waypoint
      final: 400,         // ft - at final waypoint
      threshold: 0        // ft - runway level
    },

    // Deceleration rate
    decelerationRate: 4,  // kt/s - how quickly to slow down

    // Descent rate for final approach
    descentRate: 300,     // ft/NM - glideslope (~3°)

    entryPoints: {
      DOWNWIND: {
        name: 'Downwind',
        description: 'Full pattern via downwind (349°/2.6NM)'
      },
      BASE: {
        name: 'Base',
        description: 'Direct entry to base (083°/3.8NM)'
      },
      FINAL: {
        name: 'Final',
        description: 'Straight-in via final point (106°/3.3NM)'
      }
    }
  },

  '12L_LEFT': {
    runway: '12L',
    patternName: 'Runway 12L (Left Pattern)',
    runwayHeading: 120,

    // Waypoints from ARP using exact radial/distance specifications
    downwindWaypoint: CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, 95, 2.6),
    baseWaypoint: CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, 354, 2.8),
    finalWaypoint: CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, 320, 1.2),

    // Speed profile (progressive deceleration) - same as 30R
    speeds: {
      atzEntry: 150,      // kt - speed when entering ATZ
      downwind: 150,      // kt - at downwind waypoint
      base: 120,          // kt - at base waypoint
      final: 100,         // kt - at final waypoint
      finalApproach: 80,  // kt - on final approach to threshold
      touchdown: 50       // kt - landing speed
    },

    // Altitude profile (progressive descent) - same as 30R
    altitudes: {
      atzEntry: 800,      // ft (FL008) - altitude when entering ATZ
      downwind: 800,      // ft - at downwind waypoint
      base: 600,          // ft - at base waypoint
      final: 400,         // ft - at final waypoint
      threshold: 0        // ft - runway level
    },

    // Deceleration rate
    decelerationRate: 4,  // kt/s - how quickly to slow down

    // Descent rate for final approach
    descentRate: 300,     // ft/NM - glideslope (~3°)

    entryPoints: {
      DOWNWIND: {
        name: 'Downwind',
        description: 'Full pattern via downwind (095°/2.6NM)'
      },
      BASE: {
        name: 'Base',
        description: 'Direct entry to left base (354°/2.8NM)'
      },
      FINAL: {
        name: 'Final',
        description: 'Straight-in via final point (320°/1.2NM)'
      }
    }
  },

  '30L_LEFT': {
    runway: '30L',
    patternName: 'Runway 30L (Left Pattern)',
    runwayHeading: 300,

    // Waypoints from ARP using exact radial/distance specifications
    downwindWaypoint: CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, 262, 3.3),
    baseWaypoint: CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, 176, 2.0),
    finalWaypoint: CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, 135, 0.7),

    // Speed profile (progressive deceleration)
    speeds: {
      atzEntry: 150,      // kt - speed when entering ATZ
      downwind: 150,      // kt - at downwind waypoint
      base: 120,          // kt - at base waypoint
      final: 100,         // kt - at final waypoint
      finalApproach: 80,  // kt - on final approach to threshold
      touchdown: 50       // kt - landing speed
    },

    // Altitude profile (progressive descent)
    altitudes: {
      atzEntry: 800,      // ft (FL008) - altitude when entering ATZ
      downwind: 800,      // ft - at downwind waypoint
      base: 600,          // ft - at base waypoint
      final: 400,         // ft - at final waypoint
      threshold: 0        // ft - runway level
    },

    // Deceleration rate
    decelerationRate: 4,  // kt/s - how quickly to slow down

    // Descent rate for final approach
    descentRate: 300,     // ft/NM - glideslope (~3°)

    entryPoints: {
      DOWNWIND: {
        name: 'Downwind',
        description: 'Full pattern via downwind (276°/3.1NM)'
      },
      BASE: {
        name: 'Base',
        description: 'Direct entry to left base (194°/1.9NM)'
      },
      FINAL: {
        name: 'Final',
        description: 'Straight-in via final point (135°/0.7NM)'
      }
    }
  },

  '12R_RIGHT': {
    runway: '12R',
    patternName: 'Runway 12R (Right Pattern)',
    runwayHeading: 120,

    // Waypoints from ARP using exact radial/distance specifications
    downwindWaypoint: CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, 179, 2.0),
    baseWaypoint: CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, 285, 3.8),
    finalWaypoint: CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, 300, 2.5),

    // Speed profile (progressive deceleration)
    speeds: {
      atzEntry: 150,      // kt - speed when entering ATZ
      downwind: 150,      // kt - at downwind waypoint
      base: 120,          // kt - at base waypoint
      final: 100,         // kt - at final waypoint
      finalApproach: 80,  // kt - on final approach to threshold
      touchdown: 50       // kt - landing speed
    },

    // Altitude profile (progressive descent)
    altitudes: {
      atzEntry: 800,      // ft (FL008) - altitude when entering ATZ
      downwind: 800,      // ft - at downwind waypoint
      base: 600,          // ft - at base waypoint
      final: 400,         // ft - at final waypoint
      threshold: 0        // ft - runway level
    },

    // Deceleration rate
    decelerationRate: 4,  // kt/s - how quickly to slow down

    // Descent rate for final approach
    descentRate: 300,     // ft/NM - glideslope (~3°)

    entryPoints: {
      DOWNWIND: {
        name: 'Downwind',
        description: 'Full pattern via downwind (179°/2.0NM)'
      },
      BASE: {
        name: 'Base',
        description: 'Direct entry to right base (285°/3.8NM)'
      },
      FINAL: {
        name: 'Final',
        description: 'Straight-in via final point (300°/2.5NM)'
      }
    }
  }
};

// Landing parameters
const VISUAL_LANDING = {
  touchdownSpeed: 50,           // kt - target speed at touchdown
  decelerationRate: 30,         // kt/s - deceleration during landing rollout
  transitionAltitude: 200       // ft - switch to LANDING state below this
};

export { VISUAL_PATTERNS, VISUAL_LANDING };
