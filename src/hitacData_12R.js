// HI-TAC RWY 12R Approach Data (High TACAN)
// Military-only precision approach using ZAR TACAN
// Based on Spanish military approach procedures for LEZG

import { CoordinateUtils } from './utils';
import { ARP } from './constants';

// ZAR TACAN coordinates (same as ZAR VOR)
const ZAR_TACAN = {
  lat: 41 + 39/60 + 28.4/3600,
  lon: -(1 + 1/60 + 51.1/3600)
};

const HITAC_12R = {
  runway: '12R',
  procedureName: 'HI-TAC RWY 12R',
  finalApproachTrack: 120,  // Runway 12R heading
  descentRate: 300,  // ft/NM (approximate for military approach)
  descentAngle: 3.0,  // degrees (approximate)

  // IAF - Initial Approach Fix (Ambel)
  // Starting point for full procedure at FL200
  // Ambel coordinates: radial 284° at 30.8 NM from ARP
  iaf: {
    name: 'Ambel',
    radial: 284,  // FROM ARP
    distance: 30.8,  // NM from ARP
    // Calculated coordinates from ARP (41°39'58"N 001°02'30"W) using radial/distance
    lat: 41.788285,  // 41°47'17.8"N
    lon: -1.709244,  // 001°42'33.3"W
    altitude: 20000  // FL200
  },

  // Radial intercept parameters
  radialIntercept: {
    radial: 295,  // FROM ZAR (inbound heading 115° TO ZAR)
    inboundHeading: 115,  // Reciprocal of 295° (heading TO ZAR when established)
    turnDME: 20.0,  // Turn to IF when at 20 DME from ZAR
    tolerance: 0.5  // Cross-track error tolerance in NM
  },

  // IF - Intermediate Fix
  // 16.0 DME from ZAR on R-295
  intermediatefix: {
    name: 'IF_HITAC12R',
    dme: 16.0,
    // Calculated coordinates: R-295 at 16.0 NM from ZAR
    lat: 41.770057,  // 41°46'12.2"N
    lon: -1.354690,  // 001°21'16.9"W
    altitude: 6000,  // Must reach IF at 6000 ft
    radial: 295  // FROM ZAR (for reference)
  },

  // FAF - Final Approach Fix
  // 7.7 DME from ZAR on R-300
  faf: {
    name: 'FAF_HITAC12R',
    dme: 7.7,
    // Calculated coordinates: R-300 at 7.7 NM from ZAR
    lat: 41.721916,  // 41°43'18.9"N
    lon: -1.179665,  // 001°10'46.8"W
    altitude: 2800,  // Must reach FAF at 2800 ft
    radial: 300  // FROM ZAR (for reference)
  },

  // Speed profile (knots) - Military only (F-18 type aircraft)
  speeds: {
    Military: {
      initial: 350,        // At FL200 (Ambel to radial intercept)
      intermediate: 250,   // IF to FAF
      final: 180           // FAF to threshold
    }
  },

  // Altitude profile based on phase
  // Dynamic descent calculations in engine
  altitudeProfile: {
    ambel: 20000,      // FL200 at IAF
    radialIntercept: 20000,  // Maintain FL200 until passing Ambel
    ifEntry: 6000,     // Must be at 6000 ft at IF
    fafEntry: 2800,    // Must be at 2800 ft at FAF
    threshold: 850     // Runway 12R threshold elevation (approximate)
  },

  // Entry options
  entryTypes: {
    FULL: {
      name: 'Full Procedure',
      description: 'Via Ambel IAF',
      initialPhase: 'TO_AMBEL_HITAC12R'
    },
    STRAIGHT_IN: {
      name: 'Straight-In',
      description: 'Direct to IF (16 DME at 6000 ft)',
      initialPhase: 'TURN_TO_IF_HITAC12R'
    }
  },

  // Landing parameters
  landing: {
    transitionAltitude: 1000,  // ft - switch to landing phase below this
    touchdownSpeed: 140,       // kt (military aircraft)
    decelerationRate: 40,      // kt/s (faster deceleration for military)
    rolloutTime: 7             // seconds before deletion
  }
};

export { HITAC_12R, ZAR_TACAN };
