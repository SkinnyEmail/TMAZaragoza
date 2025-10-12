// ILS Approach Procedure Data for Runway 30R

const ILS_30R = {
  runway: '30R',
  finalApproachTrack: 300,  // Magnetic track for final approach
  glideslopeAngle: 3.0,     // Degrees
  descentRate: 318,         // ft/NM at 3° glideslope (approximately 318 ft/NM)

  // Entry points (IAF - Initial Approach Fixes)
  entryPoints: {
    YARZU: {
      name: 'YARZU',
      altitude: 7000,  // FL070
      type: 'arc'      // Enters via arc
    },
    KEKAG: {
      name: 'KEKAG',
      altitude: 5000,  // FL050
      type: 'straight' // Direct to IF, no arc
    },
    GODPI: {
      name: 'GODPI',
      altitude: 5000,  // FL050
      type: 'arc'      // Enters via arc (same as YARZU but FL50)
    },
    IF_ILS: {
      name: 'IF_ILS',
      altitude: 5000,  // Straight-in at 5000 ft
      type: 'straight' // Direct to IF, no arc
    }
  },

  // Arc parameters (for YARZU, KEKAG, GODPI entries)
  arc: {
    center: 'ARP',       // Arc centered on ZAR VOR/DME (at ARP)
    radius: 17.0,        // NM
    altitude: 5000,      // ft
    interceptRadial: 118 // Radial where IF_ILS is located (transition off arc here)
  },

  // Intermediate Fix
  intermediateFixDistance: 14.4,  // DME from ZAR (in NM)
  intermediateFixAltitude: 5000,  // ft

  // Final Approach Point
  finalApproachPointDistance: 6.8, // DME from ILS (in NM from threshold)
  finalApproachPointAltitude: 5000, // ft (begin descent here)

  // Approach speeds by aircraft type
  speeds: {
    VFR: {
      initial: 120,    // kt - maintain cruise
      approach: 100,   // kt - on arc/intermediate
      final: 80        // kt - final approach
    },
    IFR: {
      initial: 250,    // kt - maintain cruise
      approach: 180,   // kt - on arc/intermediate
      final: 140       // kt - final approach
    },
    Military: {
      initial: 350,    // kt - maintain cruise
      approach: 200,   // kt - on arc/intermediate
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

export { ILS_30R };
