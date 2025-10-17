// VOR RWY 30R Approach Data
// Based on Spanish AIP chart LE_AD_2_LEZG_IAC_11
// Non-precision approach using ZAR VOR/DME (113.00 MHz)

const VOR_30R = {
  runway: '30R',
  procedureName: 'VOR RWY 30R',
  finalApproachTrack: 288,  // Heading TO VOR (R-108 FROM + 180°)
  descentRate: 318,  // ft/NM at 2.95° glideslope
  descentAngle: 2.95,  // degrees

  // IAF - Initial Approach Fix (ZAR VOR/DME)
  // Starting point for full procedure
  iaf: {
    name: 'ZAR VOR',
    lat: 41 + 39/60 + 28.4/3600,
    lon: -(1 + 1/60 + 51.1/3600),
    altitude: 5000,
    dme: 0  // At the VOR
  },

  // IF - Intermediate Fix
  // 16.0 DME from ZAR on R-108
  intermediatefix: {
    name: 'IF_VOR30R',
    dme: 16.0,
    radial: 108,  // FROM ZAR (heading TO ZAR is 288°)
    altitude: 5000,
    lat: 41 + 34/60 + 29.7/3600,
    lon: -(0 + 41/60 + 34.2/3600)
  },

  // FAF - Final Approach Fix
  // 6.0 DME from ZAR on R-108
  faf: {
    name: 'FAF_VOR30R',
    dme: 6.0,
    radial: 108,
    altitude: 2400,
    lat: 41 + 37/60 + 36.8/3600,
    lon: -(0 + 54/60 + 14.2/3600)
  },

  // MAPT - Missed Approach Point
  // Used as minimum altitude reference (no missed approach implementation)
  mapt: {
    dme: 2.0,
    radial: 108,
    altitude: 1330,  // Minimum descent altitude
    lat: 41 + 38/60 + 51.2/3600,
    lon: -(0 + 59/60 + 18.5/3600)
  },

  // Speed profile (knots)
  speeds: {
    VFR: {
      initial: 120,
      intermediate: 100,  // IF to FAF
      final: 80           // FAF to threshold
    },
    IFR: {
      initial: 250,
      intermediate: 180,  // IF to FAF
      final: 140          // FAF to threshold
    },
    Military: {
      initial: 350,
      intermediate: 200,  // IF to FAF
      final: 160          // FAF to threshold
    }
  },

  // Altitude profile based on DME from ZAR
  // Used for step-down altitude guidance
  altitudeTable: [
    { dme: 16.0, altitude: 5000 },  // IF
    { dme: 6.0, altitude: 2400 },   // FAF
    { dme: 5.0, altitude: 2140 },
    { dme: 4.0, altitude: 1830 },
    { dme: 3.0, altitude: 1520 },
    { dme: 2.0, altitude: 1330 },   // MAPT
    { dme: 0.0, altitude: 834 }     // Threshold elevation
  ],

  // Entry options
  entryTypes: {
    FULL: {
      name: 'Full Procedure',
      description: 'Via ZAR VOR',
      initialPhase: 'TO_IF'
    },
    STRAIGHT_IN: {
      name: 'Straight-In',
      description: 'Direct to IF (16 DME)',
      initialPhase: 'TO_IF'
    }
  },

  // Landing parameters
  landing: {
    transitionAltitude: 500,  // ft - switch to landing phase below this
    touchdownSpeed: 50,       // kt
    decelerationRate: 30      // kt/s
  }
};

export { VOR_30R };
