// ========== FILE: constants.js ==========
const ARP = {
  lat: 41 + 39/60 + 58/3600,
  lon: -(1 + 2/60 + 30/3600)
};

const TMA_VERTICES = [
  { radial: 337, distance: 62 },
  { radial: 259, distance: 69 },
  { radial: 242, distance: 80 },
  { radial: 200, distance: 40 },
  { radial: 120, distance: 55 },
  { radial: 77, distance: 59 }
];

const CTR_RECTANGLE = [
  { lat: 41 + 38/60 + 37/3600, lon: -(0 + 53/60 + 27/3600) },
  { lat: 41 + 35/60 + 25/3600, lon: -(0 + 45/60 + 50/3600) },
  { lat: 41 + 31/60 + 55/3600, lon: -(0 + 48/60 + 30/3600) },
  { lat: 41 + 35/60 + 2/3600, lon: -(0 + 56/60 + 4/3600) }
];

const DELTAS = {
  'LED50': [
    { radial: 335, distance: 57.9 },
    { radial: 322, distance: 52.2 },
    { radial: 329, distance: 26.2 },
    { radial: 352, distance: 31.4 }
  ],
  'Area C': [
    { radial: 268, distance: 61 },
    { radial: 259, distance: 69 },
    { radial: 247, distance: 75.5 },
    { radial: 212, distance: 19.7 },
    { radial: 269, distance: 20.5 }
  ],
  'A123': [
    { radial: 360, distance: 19.5 },
    { radial: 37, distance: 20 },
    { radial: 70, distance: 20 },
    { radial: 94, distance: 20 },
    { radial: 95, distance: 53 },
    { radial: 77, distance: 59 },
    { radial: 357, distance: 46 }
  ],
  'LED70': [
    { radial: 343, distance: 12.5 },
    { radial: 3, distance: 15 },
    { radial: 17, distance: 16.7 },
    { radial: 35, distance: 12.8 },
    { radial: 49, distance: 9.8 },
    { radial: 69, distance: 9.5 },
    { radial: 80, distance: 7.6 },
    { radial: 338, distance: 9.6 }
  ]
};

const CIRCLE_DELTAS = {
  'LED107': { radial: 311, distance: 32.6, radius: 5.0 }
};

const VISUAL_POINTS = {
  'RN': { radial: 341, distance: 6.7 },
  'Q': { radial: 280, distance: 8.2 },
  'S': { radial: 209, distance: 6.0 },
  'P': { radial: 190, distance: 12.1 },
  'M': { radial: 94, distance: 12.0 },
  'E': { radial: 86, distance: 12.8 }
};

const INSTRUMENTAL_POINTS = {
  'Ponen': { radial: 133, distance: 29.4 },
  'Alepo': { radial: 317, distance: 57.7 },
  'CMA': { radial: 192, distance: 56.5 },
  'Graus': { radial: 75, distance: 66.7 },
  'Mario': { radial: 46, distance: 48.4 },
  'TON': { radial: 60, distance: 29.0 },
  'Surco': { radial: 27, distance: 45.3 },
  'Embex': { radial: 334, distance: 19.6 },
  'Ambel': { radial: 284, distance: 30.8 },
  'Ronko': { radial: 2, distance: 50.5 },
  'Possy': { radial: 67, distance: 58.4 },
  'Lobar': { radial: 87, distance: 61.1 },
  'Serox': { radial: 110, distance: 29.2 },
  'Caspe': { radial: 114, distance: 60 },
  'MLA': { radial: 122, distance: 62.6 },
  // ILS 30R Approach Points
  'YARZU': { radial: 164.38, distance: 19.5 },
  'KEKAG': { radial: 118.55, distance: 19.5 },
  'GODPI': { radial: 78.19, distance: 20.0 },
  'IF_ILS': { radial: 118.51, distance: 14.4 },
  // VOR 30R Approach Points
  'IF_VOR30R': { radial: 108, distance: 16.0 },
  'FAF_VOR30R': { radial: 108, distance: 6.0 },
  // Huesca points (navigable with _HUE suffix)
  'W1_HUE': { radial: 32, distance: 30.0 },
  'SW_HUE': { radial: 58, distance: 29.5 },
  'S1_HUE': { radial: 81, distance: 40.7 },
  'HUE_HUE': { radial: 58, distance: 40.9 },
  'W_HUE': { radial: 50, distance: 36.9 },
  'N_HUE': { radial: 49, distance: 43.1 },
  'E_HUE': { radial: 56, distance: 46.6 },
  'S_HUE': { radial: 60, distance: 38.7 }
};

const HUESCA_ZONE = [
  { radial: 32, distance: 27.6 },
  { radial: 33, distance: 42.7 },
  { radial: 68, distance: 52.3 },
  { radial: 81, distance: 40.7 }
];

const RUNWAY_DATA = {
  '12L': { heading: 120, threshold: { lat: 41 + 40/60 + 8.62/3600, lon: -(1 + 2/60 + 23.40/3600) } },
  '30R': { heading: 300, threshold: { lat: 41 + 39/60 + 19.42/3600, lon: -(1 + 0/60 + 29.94/3600) } },
  '12R': { heading: 120, threshold: { lat: 41 + 40/60 + 48.74/3600, lon: -(1 + 4/60 + 56.54/3600) } },
  '30L': { heading: 300, threshold: { lat: 41 + 39/60 + 48.46/3600, lon: -(1 + 2/60 + 37.37/3600) } }
};

// ILS Final Approach Point (FAP) - uses lat/lon coordinates
const FAP_ILS_30R = {
  lat: 41 + 35/60 + 55/3600,  // 41°35'55"N
  lon: -(0 + 52/60 + 39/3600)  // 000°52'39"W
};

const AIRCRAFT_TYPES = {
  'VFR': { color: '#4ade80', maxSpeed: 250, cruiseSpeed: 120, turnRate: 3 },  // Softer green (was #00ff00)
  'IFR': { color: '#00d4ff', maxSpeed: 450, cruiseSpeed: 250, turnRate: 2 },  // Brighter cyan for visibility
  'Military': { color: '#ff6600', maxSpeed: 600, cruiseSpeed: 350, turnRate: 4 }
};

export { ARP, TMA_VERTICES, CTR_RECTANGLE, DELTAS, CIRCLE_DELTAS, VISUAL_POINTS, INSTRUMENTAL_POINTS, HUESCA_ZONE, RUNWAY_DATA, AIRCRAFT_TYPES, FAP_ILS_30R };