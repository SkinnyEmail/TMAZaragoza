// Geometry utilities for airspace collision detection

import { ARP, CTR_RECTANGLE, DELTAS, CIRCLE_DELTAS, RUNWAY_DATA } from './constants';
import { CoordinateUtils } from './utils';

const GeometryUtils = {
  /**
   * Check if a point is inside a polygon using ray-casting algorithm
   * @param {number} lat - Latitude of point
   * @param {number} lon - Longitude of point
   * @param {Array} polygon - Array of {lat, lon} vertices
   * @returns {boolean} True if point is inside polygon
   */
  isPointInPolygon: (lat, lon, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lon, yi = polygon[i].lat;
      const xj = polygon[j].lon, yj = polygon[j].lat;

      const intersect = ((yi > lat) !== (yj > lat))
          && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  },

  /**
   * Check if point is inside CTR (Control Zone)
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {boolean}
   */
  isPointInCTR: (lat, lon) => {
    return GeometryUtils.isPointInPolygon(lat, lon, CTR_RECTANGLE);
  },

  /**
   * Check if point is inside any Delta (restricted area)
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {Object} activeDeltas - Object with delta names as keys and boolean active status
   * @returns {boolean}
   */
  isPointInAnyDelta: (lat, lon, activeDeltas) => {
    // Check polygon deltas
    for (const [, deltaVertices] of Object.entries(DELTAS)) {
      // Convert radial/distance to lat/lon
      const polygon = deltaVertices.map(vertex =>
        CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, vertex.radial, vertex.distance)
      );

      if (GeometryUtils.isPointInPolygon(lat, lon, polygon)) {
        return true; // Point is in this delta (we check all deltas, not just active ones)
      }
    }

    // Check circular deltas
    for (const [, deltaData] of Object.entries(CIRCLE_DELTAS)) {
      const center = CoordinateUtils.radialDistanceToLatLon(
        ARP.lat,
        ARP.lon,
        deltaData.radial,
        deltaData.distance
      );

      // Calculate distance from point to delta center
      const distance = GeometryUtils.calculateDistance(lat, lon, center.lat, center.lon);

      if (distance <= deltaData.radius) {
        return true; // Point is inside circular delta
      }
    }

    return false;
  },

  /**
   * Check if point is inside any runway prolongation corridor
   * Corridor: ±2 NM width, 20 NM length extension from runway threshold
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {boolean}
   */
  isPointInRunwayProlongation: (lat, lon) => {
    const CORRIDOR_WIDTH_NM = 2; // ±2 NM from centerline
    const CORRIDOR_LENGTH_NM = 20; // 20 NM extension

    for (const [, runwayData] of Object.entries(RUNWAY_DATA)) {
      const threshold = runwayData.threshold;
      const heading = runwayData.heading;

      // Calculate distance from point to runway threshold
      const distanceToThreshold = GeometryUtils.calculateDistance(
        lat, lon, threshold.lat, threshold.lon
      );

      // Only check if point is reasonably close (within 25 NM)
      if (distanceToThreshold > 25) continue;

      // Calculate bearing from threshold to point
      const bearingToPoint = GeometryUtils.calculateBearing(
        threshold.lat, threshold.lon, lat, lon
      );

      // Calculate angle difference from runway heading
      let angleDiff = bearingToPoint - heading;
      if (angleDiff > 180) angleDiff -= 360;
      if (angleDiff < -180) angleDiff += 360;

      // Check if point is roughly along runway heading (±90° cone to cover both directions)
      if (Math.abs(angleDiff) < 90 || Math.abs(angleDiff) > 270) {
        // Calculate perpendicular distance from centerline
        const perpendicularDist = distanceToThreshold * Math.sin(angleDiff * Math.PI / 180);

        // Check if within corridor width
        if (Math.abs(perpendicularDist) <= CORRIDOR_WIDTH_NM) {
          // Calculate distance along centerline
          const alongTrackDist = distanceToThreshold * Math.cos(angleDiff * Math.PI / 180);

          // Check if within corridor length (0 to 20 NM ahead of threshold)
          if (alongTrackDist >= 0 && alongTrackDist <= CORRIDOR_LENGTH_NM) {
            return true; // Point is inside runway prolongation corridor
          }
        }
      }
    }

    return false;
  },

  /**
   * Check if a position is in any restricted airspace
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {Object} activeDeltas - Active delta status object
   * @returns {boolean}
   */
  isPointInRestrictedAirspace: (lat, lon, activeDeltas = {}) => {
    return GeometryUtils.isPointInCTR(lat, lon) ||
           GeometryUtils.isPointInAnyDelta(lat, lon, activeDeltas) ||
           GeometryUtils.isPointInRunwayProlongation(lat, lon);
  },

  /**
   * Calculate great circle distance between two points (in nautical miles)
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lon1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lon2 - Longitude of point 2
   * @returns {number} Distance in nautical miles
   */
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Calculate bearing from one point to another
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lon1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lon2 - Longitude of point 2
   * @returns {number} Bearing in degrees (0-360)
   */
  calculateBearing: (lat1, lon1, lat2, lon2) => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }
};

export { GeometryUtils };
