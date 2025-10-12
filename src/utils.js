// ========== FILE: utils.js ==========
const CoordinateUtils = {
  latLonToCanvas: (lat, lon, canvasWidth, canvasHeight, centerLat, centerLon, scale, offsetX, offsetY) => {
    const latDiff = (lat - centerLat) * 60;
    const lonDiff = (lon - centerLon) * 60 * Math.cos(centerLat * Math.PI / 180);
    
    const x = canvasWidth / 2 + lonDiff * scale + offsetX;
    const y = canvasHeight / 2 - latDiff * scale + offsetY;
    
    return { x, y };
  },

  radialDistanceToLatLon: (centerLat, centerLon, radial, distanceNM) => {
    const bearing = radial * Math.PI / 180;
    const distanceDeg = distanceNM / 60;

    const lat = centerLat + distanceDeg * Math.cos(bearing);
    const lon = centerLon + distanceDeg * Math.sin(bearing) / Math.cos(centerLat * Math.PI / 180);

    return { lat, lon };
  },

  canvasToLatLon: (x, y, canvasWidth, canvasHeight, centerLat, centerLon, scale, offsetX, offsetY) => {
    // Inverse of latLonToCanvas
    const adjustedX = x - canvasWidth / 2 - offsetX;
    const adjustedY = canvasHeight / 2 - y + offsetY;

    const latDiff = adjustedY / scale;
    const lonDiff = adjustedX / scale / Math.cos(centerLat * Math.PI / 180);

    const lat = centerLat + latDiff / 60;
    const lon = centerLon + lonDiff / 60;

    return { lat, lon };
  }
};
export { CoordinateUtils };