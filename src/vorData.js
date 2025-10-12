// VOR Approach Procedure Data for Runway 12R

const VOR_12R = {
  runway: '12R',
  finalApproachTrack: 120,  // Magnetic track for final approach
  glideslopeAngle: 3.10,    // Degrees
  descentRate: 340,         // ft/NM at 3.10° glideslope (approximately 340 ft/NM)

  // Entry points
  entryPoints: {
    VOR: {
      name: 'VOR',
      altitude: 5000,      // FL050
      type: 'full'         // Full procedure from VOR
    },
    IF_VOR: {
      name: 'IF_VOR',
      altitude: 5000,      // FL050
      type: 'straight'     // Straight-in to Intermediate Fix
    }
  },

  // VOR/DME ZAR position (same as ARP)
  vor: {
    lat: 41 + 39/60 + 28/3600,    // 41°39'28"N
    lon: -(1 + 1/60 + 51/3600),   // 001°01'51"W
    outboundRadial: 319,           // Radial 319° outbound
    inboundTrack: 120              // Track 120° inbound
  },

  // Intermediate Fix (IF)
  intermediateFixDistance: 18.0,  // DME from VOR (in NM)
  intermediateFixAltitude: 5000,  // ft
  intermediateFixPosition: {
    lat: 41 + 48/60 + 27/3600,    // 41°48'27"N
    lon: -(1 + 22/60 + 41/3600)   // 001°22'41"W
  },

  // Final Approach Fix (FAF)
  finalApproachFixDistance: 8.9,  // DME from VOR (in NM)
  finalApproachFixAltitude: 2900, // ft (begin descent here)
  finalApproachFixPosition: {
    lat: 41 + 43/60 + 50/3600,    // 41°43'50"N
    lon: -(1 + 12/60 + 8/3600)    // 001°12'08"W
  },

  // Stepdown fixes (DME from VOR and corresponding altitudes)
  stepdownFixes: [
    { dme: 8.9, altitude: 2900 },  // FAF
    { dme: 7.0, altitude: 2610 },
    { dme: 5.0, altitude: 2290 },
    { dme: 3.7, altitude: 2070 }   // Missed Approach Point (MAPt)
  ],

  // Approach speeds by aircraft type
  speeds: {
    VFR: {
      initial: 120,    // kt - maintain cruise
      approach: 100,   // kt - intermediate segment
      final: 80        // kt - final approach
    },
    IFR: {
      initial: 250,    // kt - maintain cruise
      approach: 180,   // kt - intermediate segment
      final: 140       // kt - final approach
    },
    Military: {
      initial: 350,    // kt - maintain cruise
      approach: 200,   // kt - intermediate segment
      final: 160       // kt - final approach
    }
  },

  // Landing parameters
  landing: {
    touchdownSpeed: 50,     // kt - target speed at touchdown
    decelerationRate: 30,   // kt/s - deceleration in landing phase
    transitionAltitude: 500 // ft - switch to LANDING state below this
  }
};

export { VOR_12R };
