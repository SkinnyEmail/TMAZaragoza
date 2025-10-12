// Comprehensive waypoint database for Zaragoza TMA
// Aggregates all waypoints from SIDs, Visual Points, Instrumental Points, and Special Fixes

import { CoordinateUtils } from './utils';
import { ARP, VISUAL_POINTS, INSTRUMENTAL_POINTS } from './constants';
import { SIDS } from './sidData';

// ZRZ NDB coordinates (defined in sidData but needed here)
const ZRZ_LAT = 41 + 43/60 + 50/3600;
const ZRZ_LON = -(1 + 11/60 + 36/3600);

// Calculate waypoint positions from ARP using radial and distance
const calculateWaypoint = (radial, distance) => {
  return CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, radial, distance);
};

// Calculate waypoint from ZRZ using radial and distance (for future use)
// eslint-disable-next-line no-unused-vars
const calculateFromZRZ = (radial, distance) => {
  return CoordinateUtils.radialDistanceToLatLon(ZRZ_LAT, ZRZ_LON, radial, distance);
};

/**
 * Comprehensive waypoint database
 * Structure: { name: string, type: string, lat: number, lon: number, source: string }
 */
const WAYPOINT_DATABASE = {};

// ========== Add Visual Points ==========
Object.entries(VISUAL_POINTS).forEach(([name, data]) => {
  const coords = calculateWaypoint(data.radial, data.distance);
  WAYPOINT_DATABASE[name.toUpperCase()] = {
    name: name.toUpperCase(),
    type: 'VISUAL',
    lat: coords.lat,
    lon: coords.lon,
    source: 'Visual Points'
  };
});

// ========== Add Instrumental Points ==========
Object.entries(INSTRUMENTAL_POINTS).forEach(([name, data]) => {
  const coords = calculateWaypoint(data.radial, data.distance);
  WAYPOINT_DATABASE[name.toUpperCase()] = {
    name: name.toUpperCase(),
    type: 'FIX',
    lat: coords.lat,
    lon: coords.lon,
    source: 'Instrumental Points'
  };
});

// ========== Add ZRZ NDB (special case) ==========
WAYPOINT_DATABASE['ZRZ'] = {
  name: 'ZRZ',
  type: 'NDB',
  lat: ZRZ_LAT,
  lon: ZRZ_LON,
  source: 'Zaragoza NDB'
};

// ========== Extract all unique waypoints from SIDs ==========
Object.values(SIDS).forEach(sid => {
  sid.waypoints.forEach(waypoint => {
    const wpName = waypoint.name.toUpperCase();
    // Only add if not already in database (to preserve more detailed entries)
    if (!WAYPOINT_DATABASE[wpName]) {
      WAYPOINT_DATABASE[wpName] = {
        name: wpName,
        type: waypoint.type || 'FIX',
        lat: waypoint.lat,
        lon: waypoint.lon,
        source: `SID: ${sid.designator}`
      };
    }
  });
});

// ========== Manually add ARP (Aerodrome Reference Point) ==========
WAYPOINT_DATABASE['ARP'] = {
  name: 'ARP',
  type: 'AIRPORT',
  lat: ARP.lat,
  lon: ARP.lon,
  source: 'Aerodrome Reference Point'
};

/**
 * Get waypoint by name (case-insensitive)
 * @param {string} name - Waypoint name
 * @returns {Object|null} Waypoint object or null if not found
 */
const getWaypointByName = (name) => {
  return WAYPOINT_DATABASE[name.toUpperCase()] || null;
};

/**
 * Get all waypoint names (sorted alphabetically)
 * @returns {Array<string>} Array of waypoint names
 */
const getAllWaypointNames = () => {
  return Object.keys(WAYPOINT_DATABASE).sort();
};

/**
 * Search waypoints by partial name (case-insensitive)
 * @param {string} query - Search query
 * @returns {Array<Object>} Array of matching waypoints
 */
const searchWaypoints = (query) => {
  const upperQuery = query.toUpperCase();
  return Object.values(WAYPOINT_DATABASE)
    .filter(wp => wp.name.includes(upperQuery))
    .sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Validate a comma-separated route string
 * @param {string} routeString - Comma-separated waypoint names (e.g., "ZRZ, FESTA, ALEPO")
 * @returns {Object} { valid: boolean, waypoints: Array<Object>, errors: Array<string> }
 */
const validateRoute = (routeString) => {
  const result = {
    valid: true,
    waypoints: [],
    errors: []
  };

  if (!routeString || routeString.trim() === '') {
    result.valid = false;
    result.errors.push('Route string is empty');
    return result;
  }

  // Split by comma and trim whitespace
  const waypointNames = routeString
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0);

  if (waypointNames.length === 0) {
    result.valid = false;
    result.errors.push('No waypoints found in route');
    return result;
  }

  // Validate each waypoint
  waypointNames.forEach((name, index) => {
    const waypoint = getWaypointByName(name);
    if (waypoint) {
      result.waypoints.push(waypoint);
    } else {
      result.valid = false;
      result.errors.push(`Waypoint "${name}" not found (position ${index + 1})`);
    }
  });

  return result;
};

export {
  WAYPOINT_DATABASE,
  getWaypointByName,
  getAllWaypointNames,
  searchWaypoints,
  validateRoute
};
