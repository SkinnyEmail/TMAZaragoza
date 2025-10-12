// Standard Instrument Departure (SID) procedures for Zaragoza (LEZG)
// Data extracted from AIP España AD 2-LEZG SID charts

import { CoordinateUtils } from './utils';
import { ARP } from './constants';

// ZRZ NDB coordinates
const ZRZ_LAT = 41 + 43/60 + 50/3600;  // 41°43'50"N
const ZRZ_LON = -(1 + 11/60 + 36/3600); // 001°11'36"W

// Calculate waypoint positions from ARP using radial and distance
const calculateWaypoint = (radial, distance) => {
  return CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, radial, distance);
};

// Calculate waypoint from ZRZ using radial and distance
const calculateFromZRZ = (radial, distance) => {
  return CoordinateUtils.radialDistanceToLatLon(ZRZ_LAT, ZRZ_LON, radial, distance);
};

const SIDS = {
  'ALEPO2B': {
    name: 'ALEPO TWO BRAVO',
    designator: 'ALEPO2B',
    runways: ['30R', '30L'],
    description: 'Climb runway heading to ZRZ (2000 ft min). Turn right 317° to ALEPO (FL100 min).',
    waypoints: [
      {
        name: 'ZRZ',
        type: 'NDB',
        lat: ZRZ_LAT,
        lon: ZRZ_LON,
        frequency: '389 kHz'
      },
      {
        name: 'ALEPO',
        type: 'FIX',
        ...calculateWaypoint(317, 57.7), // Radial 317°, 57.7 NM from ARP
        frequency: null
      }
    ],
    finalAltitude: 24000,                // FL240
    restrictions: ['Subject to LED107 activity'],
    notes: []
  },

  'CMA2E': {
    name: 'CMA TWO ECHO',
    designator: 'CMA2E',
    runways: ['30R', '30L'],
    description: 'Climb runway heading to ZRZ. Turn left 167° to FESTA (4000 ft min). Turn right R-014 to CMA (FL100 min).',
    waypoints: [
      {
        name: 'ZRZ',
        type: 'NDB',
        lat: ZRZ_LAT,
        lon: ZRZ_LON,
        frequency: '389 kHz'
      },
      {
        name: 'FESTA',
        type: 'FIX',
        ...calculateFromZRZ(167, 30),    // 167° from ZRZ, ~30 NM (estimated)
        frequency: null
      },
      {
        name: 'CMA',
        type: 'VOR/DME',
        ...calculateWaypoint(192, 56.5), // Radial 192°, 56.5 NM from ARP
        frequency: null
      }
    ],
    finalAltitude: 23000,                // FL230
    restrictions: [],
    notes: []
  },

  'GRAUS1M': {
    name: 'GRAUS ONE MIKE',
    designator: 'GRAUS1M',
    runways: ['30R', '30L'],
    description: 'Climb runway heading to ZRZ. Turn right 355° to EMBEX. Turn right 093° to TON. Turn left 085° to GRAUS.',
    waypoints: [
      {
        name: 'ZRZ',
        type: 'NDB',
        lat: ZRZ_LAT,
        lon: ZRZ_LON,
        frequency: '389 kHz'
      },
      {
        name: 'EMBEX',
        type: 'FIX',
        ...calculateWaypoint(334, 19.6), // Radial 334°, 19.6 NM from ARP
        frequency: null
      },
      {
        name: 'TON',
        type: 'NDB',
        ...calculateWaypoint(60, 29.0),  // Radial 60°, 29.0 NM from ARP
        frequency: null
      },
      {
        name: 'GRAUS',
        type: 'FIX',
        ...calculateWaypoint(75, 66.7),  // Radial 75°, 66.7 NM from ARP
        frequency: null
      }
    ],
    finalAltitude: 20000,                // FL200
    restrictions: [],
    notes: []
  },

  'MARIO1D': {
    name: 'MARIO ONE DELTA',
    designator: 'MARIO1D',
    runways: ['30R', '30L'],
    description: 'Climb runway heading to ZRZ. Turn right 355° to EMBEX. Turn right 093° to TON. Turn left 035° to MARIO.',
    waypoints: [
      {
        name: 'ZRZ',
        type: 'NDB',
        lat: ZRZ_LAT,
        lon: ZRZ_LON,
        frequency: '389 kHz'
      },
      {
        name: 'EMBEX',
        type: 'FIX',
        ...calculateWaypoint(334, 19.6), // Radial 334°, 19.6 NM from ARP
        frequency: null
      },
      {
        name: 'TON',
        type: 'NDB',
        ...calculateWaypoint(60, 29.0),  // Radial 60°, 29.0 NM from ARP
        frequency: null
      },
      {
        name: 'MARIO',
        type: 'FIX',
        ...calculateWaypoint(46, 48.4),  // Radial 46°, 48.4 NM from ARP
        frequency: null
      }
    ],
    finalAltitude: 24000,                // FL240
    restrictions: [],
    notes: []
  },

  'PONEN1B': {
    name: 'PONEN ONE BRAVO',
    designator: 'PONEN1B',
    runways: ['30R', '30L'],
    description: 'Climb runway heading to ZRZ. Turn left to 10 DME arc. Follow arc to R-293 MLA to PONEN (6500 ft min).',
    waypoints: [
      {
        name: 'ZRZ',
        type: 'NDB',
        lat: ZRZ_LAT,
        lon: ZRZ_LON,
        frequency: '389 kHz'
      },
      {
        name: 'PONEN',
        type: 'FIX',
        ...calculateWaypoint(133, 29.4), // Radial 133°, 29.4 NM from ARP
        frequency: null
      },
      {
        name: 'MLA',
        type: 'VOR/DME',
        ...calculateWaypoint(122, 62.6), // Radial 122°, 62.6 NM from ARP
        frequency: null
      }
    ],
    finalAltitude: 18000,                // FL180
    restrictions: ['Minimum climb gradient 5.7% up to 6500 ft'],
    notes: []
  },

  'SURCO1D': {
    name: 'SURCO ONE DELTA',
    designator: 'SURCO1D',
    runways: ['30R', '30L'],
    description: 'Climb runway heading to ZRZ. Turn right 355° to EMBEX. Turn right 058° to follow R-027 to SURCO.',
    waypoints: [
      {
        name: 'ZRZ',
        type: 'NDB',
        lat: ZRZ_LAT,
        lon: ZRZ_LON,
        frequency: '389 kHz'
      },
      {
        name: 'EMBEX',
        type: 'FIX',
        ...calculateWaypoint(334, 19.6), // Radial 334°, 19.6 NM from ARP
        frequency: null
      },
      {
        name: 'SURCO',
        type: 'FIX',
        ...calculateWaypoint(27, 45.3),  // Radial 27°, 45.3 NM from ARP
        frequency: null
      }
    ],
    finalAltitude: 24000,                // FL240
    restrictions: [],
    notes: []
  },

  'SURCO1E': {
    name: 'SURCO ONE ECHO',
    designator: 'SURCO1E',
    runways: ['30R', '30L'],
    description: 'Climb runway heading to ZRZ. Turn right 355° to EMBEX. Turn right 093° to TON. Turn left 354° to SURCO.',
    waypoints: [
      {
        name: 'ZRZ',
        type: 'NDB',
        lat: ZRZ_LAT,
        lon: ZRZ_LON,
        frequency: '389 kHz'
      },
      {
        name: 'EMBEX',
        type: 'FIX',
        ...calculateWaypoint(334, 19.6), // Radial 334°, 19.6 NM from ARP
        frequency: null
      },
      {
        name: 'TON',
        type: 'NDB',
        ...calculateWaypoint(60, 29.0),  // Radial 60°, 29.0 NM from ARP
        frequency: null
      },
      {
        name: 'SURCO',
        type: 'FIX',
        ...calculateWaypoint(27, 45.3),  // Radial 27°, 45.3 NM from ARP
        frequency: null
      }
    ],
    finalAltitude: 24000,                // FL240
    restrictions: [],
    notes: []
  },

  // ========== RUNWAY 12L/12R SIDs ==========

  'CMA3D': {
    name: 'CALAMOCHA THREE DELTA',
    designator: 'CMA3D',
    runways: ['12L', '12R'],
    description: 'Climb R-117 ZAR to BUROV (2000 ft min). Turn right heading 228° to R-014 CMA to FESTA (4000 ft min). Follow R-014 CMA to CMA (FL100 min).',
    waypoints: [
      {
        name: 'BUROV',
        type: 'FIX',
        ...calculateWaypoint(117, 8),    // Radial 117°, ~8 NM from ARP (estimated)
        frequency: null
      },
      {
        name: 'FESTA',
        type: 'FIX',
        ...calculateFromZRZ(167, 30),    // 167° from ZRZ, ~30 NM (estimated)
        frequency: null
      },
      {
        name: 'CMA',
        type: 'VOR/DME',
        ...calculateWaypoint(192, 56.5), // Radial 192°, 56.5 NM from ARP
        frequency: null
      }
    ],
    finalAltitude: 23000,                // FL230
    restrictions: ['Cross BUROV at 2000 ft or above', 'Cross FESTA at 4000 ft or above'],
    notes: []
  },

  'GRAUS2H': {
    name: 'GRAUS TWO HOTEL',
    designator: 'GRAUS2H',
    runways: ['12L', '12R'],
    description: 'Climb R-117 ZAR to BUROV (2000 ft min). Turn left track 039° TON to TON (TRL or above). Turn right track 085° to GRAUS.',
    waypoints: [
      {
        name: 'BUROV',
        type: 'FIX',
        ...calculateWaypoint(117, 8),    // Radial 117°, ~8 NM from ARP (estimated)
        frequency: null
      },
      {
        name: 'TON',
        type: 'NDB',
        ...calculateWaypoint(60, 29.0),  // Radial 60°, 29.0 NM from ARP
        frequency: null
      },
      {
        name: 'GRAUS',
        type: 'FIX',
        ...calculateWaypoint(75, 66.7),  // Radial 75°, 66.7 NM from ARP
        frequency: null
      }
    ],
    finalAltitude: 20000,                // FL200
    restrictions: ['Cross BUROV at 2000 ft or above'],
    notes: []
  },

  'MARIO2C': {
    name: 'MARIO TWO CHARLIE',
    designator: 'MARIO2C',
    runways: ['12L', '12R'],
    description: 'Climb R-117 ZAR to BUROV (2000 ft min). Turn left track 039° TON to TON (TRL or above). Turn left track 035° to MARIO.',
    waypoints: [
      {
        name: 'BUROV',
        type: 'FIX',
        ...calculateWaypoint(117, 8),    // Radial 117°, ~8 NM from ARP (estimated)
        frequency: null
      },
      {
        name: 'TON',
        type: 'NDB',
        ...calculateWaypoint(60, 29.0),  // Radial 60°, 29.0 NM from ARP
        frequency: null
      },
      {
        name: 'MARIO',
        type: 'FIX',
        ...calculateWaypoint(46, 48.4),  // Radial 46°, 48.4 NM from ARP
        frequency: null
      }
    ],
    finalAltitude: 24000,                // FL240
    restrictions: ['Cross BUROV at 2000 ft or above'],
    notes: []
  },

  'PONEN2A': {
    name: 'PONEN TWO ALPHA',
    designator: 'PONEN2A',
    runways: ['12L', '12R'],
    description: 'Climb R-117 ZAR to BUROV (2000 ft min). Heading 134° to intercept R-293 MLA to PONEN.',
    waypoints: [
      {
        name: 'BUROV',
        type: 'FIX',
        ...calculateWaypoint(117, 8),    // Radial 117°, ~8 NM from ARP (estimated)
        frequency: null
      },
      {
        name: 'PONEN',
        type: 'FIX',
        ...calculateWaypoint(133, 29.4), // Radial 133°, 29.4 NM from ARP
        frequency: null
      },
      {
        name: 'MLA',
        type: 'VOR/DME',
        ...calculateWaypoint(122, 62.6), // Radial 122°, 62.6 NM from ARP
        frequency: null
      }
    ],
    finalAltitude: 18000,                // FL180
    restrictions: ['Cross BUROV at 2000 ft or above'],
    notes: []
  },

  'SURCO2C': {
    name: 'SURCO TWO CHARLIE',
    designator: 'SURCO2C',
    runways: ['12L', '12R'],
    description: 'Climb R-117 ZAR to BUROV (2000 ft min). Turn left track 039° TON to TON (TRL or above). Turn left track 354° to SURCO.',
    waypoints: [
      {
        name: 'BUROV',
        type: 'FIX',
        ...calculateWaypoint(117, 8),    // Radial 117°, ~8 NM from ARP (estimated)
        frequency: null
      },
      {
        name: 'TON',
        type: 'NDB',
        ...calculateWaypoint(60, 29.0),  // Radial 60°, 29.0 NM from ARP
        frequency: null
      },
      {
        name: 'SURCO',
        type: 'FIX',
        ...calculateWaypoint(27, 45.3),  // Radial 27°, 45.3 NM from ARP
        frequency: null
      }
    ],
    finalAltitude: 24000,                // FL240
    restrictions: ['Cross BUROV at 2000 ft or above'],
    notes: []
  },

  'BARDENAS_RWY12': {
    name: 'BARDENAS DEPARTURE',
    designator: 'BARDENAS_RWY12',
    runways: ['12L', '12R'],
    isMilitary: true,
    description: 'Climb R-122 ZZA to 10 DME (4000 ft max). Turn left heading 036° to R-091 (5000 ft min). Arc 20 DME to VICTOR (FL070 min). Heading 293° to R-343/26 DME. Direct to BARDENAS.',
    waypoints: [
      {
        name: '10DME_122',
        type: 'FIX',
        ...calculateWaypoint(122, 10),   // Radial 122°, 10 DME from ARP
        frequency: null
      },
      {
        name: 'R091_INT',
        type: 'FIX',
        ...calculateWaypoint(91, 15),    // Radial 91°, ~15 NM (estimated intercept)
        frequency: null
      },
      {
        name: 'VICTOR',
        type: 'FIX',
        ...calculateWaypoint(67, 20),    // Radial 67°, 20 DME on arc (estimated)
        frequency: null
      },
      {
        name: 'BARDENAS',
        type: 'FIX',
        ...calculateWaypoint(333, 36),   // Radial 333°, 36 DME from ARP
        frequency: null
      }
    ],
    finalAltitude: 24000,                // FL240
    restrictions: ['Cross 10 DME at 4000 ft or below', 'Cross R-091 at 5000 ft or above', 'Max speed 280 kt over BARDENAS between 6000-FL080'],
    notes: []
  },

  'TANGO_RWY12': {
    name: 'TANGO DEPARTURE',
    designator: 'TANGO_RWY12',
    runways: ['12L', '12R'],
    isMilitary: true,
    description: 'Climb R-122 ZZA to 9.4 DME (2500 ft min). Turn right heading 177° to R-140 (4000 ft min). Direct to TANGO (FL080 min). Follow R-288 MLA to MLA.',
    waypoints: [
      {
        name: '9.4DME_122',
        type: 'FIX',
        ...calculateWaypoint(122, 9.4),  // Radial 122°, 9.4 DME from ARP
        frequency: null
      },
      {
        name: 'R140_INT',
        type: 'FIX',
        ...calculateWaypoint(140, 18),   // Radial 140°, ~18 NM (estimated intercept)
        frequency: null
      },
      {
        name: 'TANGO',
        type: 'FIX',
        ...calculateWaypoint(140, 35),   // Radial 140°, ~35 NM (estimated)
        frequency: null
      },
      {
        name: 'MLA',
        type: 'VOR/DME',
        ...calculateWaypoint(122, 62.6), // Radial 122°, 62.6 NM from ARP
        frequency: null
      }
    ],
    finalAltitude: 24000,                // FL240
    restrictions: ['Cross 9.4 DME at 2500 ft or above', 'Cross R-140 at 4000 ft or above', 'Cross TANGO at FL080 or above'],
    notes: []
  },

  // ========== RUNWAY 30L/30R SIDs (Additional) ==========

  'BARDENAS_RWY30': {
    name: 'BARDENAS DEPARTURE',
    designator: 'BARDENAS_RWY30',
    runways: ['30L', '30R'],
    isMilitary: true,
    description: 'Climb R-302 ZZA to 10 DME (4000 ft max). Turn right heading 002° to R-343/26 DME. Turn left direct to BARDENAS.',
    waypoints: [
      {
        name: '10DME_302',
        type: 'FIX',
        ...calculateWaypoint(302, 10),   // Radial 302°, 10 DME from ARP
        frequency: null
      },
      {
        name: 'R343_26DME',
        type: 'FIX',
        ...calculateWaypoint(343, 26),   // Radial 343°, 26 DME from ARP
        frequency: null
      },
      {
        name: 'BARDENAS',
        type: 'FIX',
        ...calculateWaypoint(333, 36),   // Radial 333°, 36 DME from ARP
        frequency: null
      }
    ],
    finalAltitude: 24000,                // FL240
    restrictions: ['Cross 10 DME at 4000 ft or below', 'Max speed 280 kt over BARDENAS between 6000-FL080'],
    notes: []
  },

  'TANGO_RWY30': {
    name: 'TANGO DEPARTURE',
    designator: 'TANGO_RWY30',
    runways: ['30L', '30R'],
    isMilitary: true,
    description: 'Climb R-302 ZZA to 5 DME (1700 ft min). Turn left heading 167°. Cross R-272 (3100 ft min). Direct to FESTA (FL070 min). Heading 107° to TANGO (FL080 min). Follow R-288 MLA to MLA.',
    waypoints: [
      {
        name: '5DME_302',
        type: 'FIX',
        ...calculateWaypoint(302, 5),    // Radial 302°, 5 DME from ARP
        frequency: null
      },
      {
        name: 'R272_INT',
        type: 'FIX',
        ...calculateWaypoint(272, 12),   // Radial 272°, ~12 NM (estimated)
        frequency: null
      },
      {
        name: 'FESTA',
        type: 'FIX',
        ...calculateWaypoint(188, 14.2), // Radial 188°, 14.2 DME from ARP
        frequency: null
      },
      {
        name: 'TANGO',
        type: 'FIX',
        ...calculateWaypoint(140, 35),   // Radial 140°, ~35 NM (estimated, same as RWY12)
        frequency: null
      },
      {
        name: 'MLA',
        type: 'VOR/DME',
        ...calculateWaypoint(122, 62.6), // Radial 122°, 62.6 NM from ARP
        frequency: null
      }
    ],
    finalAltitude: 24000,                // FL240
    restrictions: ['Cross 5 DME at 1700 ft or above', 'Cross R-272 at 3100 ft or above', 'Cross FESTA at FL070 or above', 'Cross TANGO at FL080 or above'],
    notes: []
  },

  'VICTOR_RWY30': {
    name: 'VICTOR DEPARTURE',
    designator: 'VICTOR_RWY30',
    runways: ['30L', '30R'],
    isMilitary: true,
    description: 'Climb R-324 ZZA to 20 DME (FL080 min). Turn right arc 20 DME to VICTOR. Turn left track 099° TON to TON. Turn left track 085° to GRAUS.',
    waypoints: [
      {
        name: '20DME_324',
        type: 'FIX',
        ...calculateWaypoint(324, 20),   // Radial 324°, 20 DME from ARP
        frequency: null
      },
      {
        name: 'VICTOR',
        type: 'FIX',
        ...calculateWaypoint(67, 20),    // Radial 67°, 20 DME on arc (same as BARDENAS)
        frequency: null
      },
      {
        name: 'TON',
        type: 'NDB',
        ...calculateWaypoint(60, 29.0),  // Radial 60°, 29.0 NM from ARP
        frequency: null
      },
      {
        name: 'GRAUS',
        type: 'FIX',
        ...calculateWaypoint(75, 66.7),  // Radial 75°, 66.7 NM from ARP
        frequency: null
      }
    ],
    finalAltitude: 20000,                // FL200
    restrictions: ['Cross 20 DME at FL080 or above'],
    notes: []
  },

  'ZULU_RWY12': {
    name: 'ZULU DEPARTURE',
    designator: 'ZULU_RWY12',
    runways: ['12L', '12R'],
    isMilitary: true,
    description: 'Climb R-123 ZZA to 9.4 DME (2500 ft min). Turn right heading 282° to R-149 (3100 ft min). Intercept R-248/15 DME (4300 ft min). Direct to ZULU (FL080 min).',
    waypoints: [
      {
        name: '9.4DME_123',
        type: 'FIX',
        ...calculateWaypoint(123, 9.4),  // Radial 123°, 9.4 DME from ARP
        frequency: null
      },
      {
        name: 'R149_INT',
        type: 'FIX',
        ...calculateWaypoint(149, 14),   // Radial 149°, ~14 NM (estimated intercept)
        frequency: null
      },
      {
        name: 'R248_15DME',
        type: 'FIX',
        ...calculateWaypoint(248, 15),   // Radial 248°, 15 DME from ARP
        frequency: null
      },
      {
        name: 'ZULU',
        type: 'FIX',
        ...calculateWaypoint(248, 28),   // Radial 248°, ~28 NM (estimated)
        frequency: null
      }
    ],
    finalAltitude: 24000,                // FL240
    restrictions: ['Cross 9.4 DME at 2500 ft or above', 'Cross R-149 at 3100 ft or above', 'Cross R-248/15 DME at 4300 ft or above', 'Cross ZULU at FL080 or above', 'Pamplona transition: Cross R-317 at FL240 or above'],
    notes: []
  },

  'ZULU_RWY30': {
    name: 'ZULU DEPARTURE',
    designator: 'ZULU_RWY30',
    runways: ['30L', '30R'],
    isMilitary: true,
    description: 'Climb R-303 ZZA to 5 DME (1700 ft min). Turn left heading 219° to intercept R-248/15 DME (4300 ft min). Direct to ZULU (FL080 min).',
    waypoints: [
      {
        name: '5DME_303',
        type: 'FIX',
        ...calculateWaypoint(303, 5),    // Radial 303°, 5 DME from ARP
        frequency: null
      },
      {
        name: 'R248_15DME',
        type: 'FIX',
        ...calculateWaypoint(248, 15),   // Radial 248°, 15 DME from ARP
        frequency: null
      },
      {
        name: 'ZULU',
        type: 'FIX',
        ...calculateWaypoint(248, 28),   // Radial 248°, ~28 NM (estimated, same as RWY12)
        frequency: null
      }
    ],
    finalAltitude: 24000,                // FL240
    restrictions: ['Cross 5 DME at 1700 ft or above', 'Cross R-248/15 DME at 4300 ft or above', 'Cross ZULU at FL080 or above'],
    notes: []
  }
};

/**
 * Get SIDs available for a specific runway
 * @param {string} runway - Runway identifier (e.g., '30R', '30L', '12L', '12R')
 * @returns {Array} Array of SID objects
 */
const getSIDsForRunway = (runway) => {
  return Object.values(SIDS).filter(sid => sid.runways.includes(runway));
};

/**
 * Get a specific SID by designator
 * @param {string} designator - SID designator (e.g., 'ALEPO2B')
 * @returns {Object|null} SID object or null if not found
 */
const getSIDByDesignator = (designator) => {
  return SIDS[designator] || null;
};

export { SIDS, getSIDsForRunway, getSIDByDesignator };
