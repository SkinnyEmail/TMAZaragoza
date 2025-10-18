// ========== FILE: renderer.js ==========
import { ARP, TMA_VERTICES, CTR_RECTANGLE, DELTAS, CIRCLE_DELTAS, VISUAL_POINTS, INSTRUMENTAL_POINTS, AIRCRAFT_TYPES, RUNWAY_DATA } from './constants';
import { CoordinateUtils } from './utils';
import { GeometryUtils } from './geometryUtils';
import { getSIDsForRunway } from './sidData';
const CanvasRenderer = {
  drawBackground: (ctx, width, height) => {
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, width, height);
  },

  drawRangeRings: (ctx, centerX, centerY, scale) => {
    ctx.strokeStyle = '#1a2332';
    ctx.lineWidth = 1;
    for (let range = 10; range <= 100; range += 10) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, range * scale, 0, 2 * Math.PI);
      ctx.stroke();
      
      ctx.fillStyle = '#3a4a5a';
      ctx.font = `${10 * scale / 3}px monospace`;
      ctx.fillText(`${range}`, centerX + 5, centerY - range * scale + 5);
    }
  },

  drawCardinalDirections: (ctx, centerX, centerY, scale) => {
    ctx.fillStyle = '#3a4a5a';
    ctx.font = `${12 * scale / 3}px monospace`;
    ctx.fillText('N', centerX - 5, centerY - 100 * scale - 10);
    ctx.fillText('S', centerX - 5, centerY + 100 * scale + 20);
    ctx.fillText('E', centerX + 100 * scale + 10, centerY + 5);
    ctx.fillText('W', centerX - 100 * scale - 20, centerY + 5);
  },

  drawTMAHexagon: (ctx, width, height, scale, offsetX, offsetY) => {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    TMA_VERTICES.forEach((vertex, index) => {
      const pos = CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, vertex.radial, vertex.distance);
      const canvasPos = CoordinateUtils.latLonToCanvas(pos.lat, pos.lon, width, height, ARP.lat, ARP.lon, scale, offsetX, offsetY);

      if (index === 0) {
        ctx.moveTo(canvasPos.x, canvasPos.y);
      } else {
        ctx.lineTo(canvasPos.x, canvasPos.y);
      }
    });
    ctx.closePath();
    ctx.stroke();
  },

  drawATZ: (ctx, centerX, centerY, scale, zoom) => {
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4.32 * scale, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = '#00ff00';
    ctx.font = `${11 * zoom}px monospace`;
    ctx.fillText('ATZ', centerX + 4.32 * scale - 30, centerY - 5);
  },

  drawCTR: (ctx, width, height, centerX, centerY, scale, offsetX, offsetY, zoom) => {
    ctx.strokeStyle = '#00aaff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);

    ctx.beginPath();
    ctx.arc(centerX, centerY, 7 * scale, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    CTR_RECTANGLE.forEach((point, index) => {
      const canvasPos = CoordinateUtils.latLonToCanvas(point.lat, point.lon, width, height, ARP.lat, ARP.lon, scale, offsetX, offsetY);
      if (index === 0) {
        ctx.moveTo(canvasPos.x, canvasPos.y);
      } else {
        ctx.lineTo(canvasPos.x, canvasPos.y);
      }
    });
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#00aaff';
    ctx.font = '11px monospace';
    ctx.fillText('CTR', centerX + 7 * scale - 30, centerY + 10);
  },

  drawCorridor: (ctx, width, height, scale, offsetX, offsetY) => {
    // Corridor corner points (radial/distance from ARP)
    // Reordered to form a proper rectangle: near-left, near-right, far-right, far-left
    const corridorPoints = [
      { radial: 188, distance: 36.5 }, // near-left
      { radial: 173, distance: 34.9 }, // near-right
      { radial: 176, distance: 56 },   // far-right
      { radial: 184, distance: 59.3 }  // far-left
    ];

    // Convert to lat/lon and then to canvas coordinates
    ctx.fillStyle = 'rgba(255, 221, 0, 0.3)'; // Semi-transparent yellow fill
    ctx.strokeStyle = '#ffdd00'; // Eye-friendly yellow border
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    ctx.beginPath();
    corridorPoints.forEach((point, index) => {
      const latLon = CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, point.radial, point.distance);
      const canvasPos = CoordinateUtils.latLonToCanvas(latLon.lat, latLon.lon, width, height, ARP.lat, ARP.lon, scale, offsetX, offsetY);
      if (index === 0) {
        ctx.moveTo(canvasPos.x, canvasPos.y);
      } else {
        ctx.lineTo(canvasPos.x, canvasPos.y);
      }
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw label
    ctx.fillStyle = '#ffdd00';
    ctx.font = '11px monospace';
    const firstPoint = corridorPoints[0];
    const labelLatLon = CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, firstPoint.radial, firstPoint.distance);
    const labelCanvas = CoordinateUtils.latLonToCanvas(labelLatLon.lat, labelLatLon.lon, width, height, ARP.lat, ARP.lon, scale, offsetX, offsetY);
    ctx.fillText('Corridor', labelCanvas.x + 5, labelCanvas.y - 5);
  },

  drawDeltas: (ctx, width, height, scale, offsetX, offsetY, activeDelta) => {
    // Draw polygon deltas
    Object.entries(DELTAS).forEach(([name, vertices]) => {
      const isActive = activeDelta[name];
      
      // Always draw outline in white
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      
      // If active, fill with red
      if (isActive) {
        ctx.fillStyle = 'rgba(220, 60, 60, 0.25)';
      }
      
      ctx.beginPath();
      vertices.forEach((vertex, index) => {
        const pos = CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, vertex.radial, vertex.distance);
        const canvasPos = CoordinateUtils.latLonToCanvas(pos.lat, pos.lon, width, height, ARP.lat, ARP.lon, scale, offsetX, offsetY);
        
        if (index === 0) {
          ctx.moveTo(canvasPos.x, canvasPos.y);
        } else {
          ctx.lineTo(canvasPos.x, canvasPos.y);
        }
      });
      ctx.closePath();
      ctx.stroke();
      
      if (isActive) {
        ctx.fill();
      }
      
      // Draw label
      const firstVertex = vertices[0];
      const labelPos = CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, firstVertex.radial, firstVertex.distance);
      const labelCanvas = CoordinateUtils.latLonToCanvas(labelPos.lat, labelPos.lon, width, height, ARP.lat, ARP.lon, scale, offsetX, offsetY);
      
      ctx.fillStyle = isActive ? '#dc3c3c' : '#ffffff';
      ctx.font = '10px monospace';
      ctx.fillText(name, labelCanvas.x + 5, labelCanvas.y - 5);
    });
    
    // Draw circular deltas
    Object.entries(CIRCLE_DELTAS).forEach(([name, data]) => {
      const isActive = activeDelta[name];
      
      const centerPos = CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, data.radial, data.distance);
      const centerCanvas = CoordinateUtils.latLonToCanvas(centerPos.lat, centerPos.lon, width, height, ARP.lat, ARP.lon, scale, offsetX, offsetY);
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      
      if (isActive) {
        ctx.fillStyle = 'rgba(220, 60, 60, 0.25)';
      }
      
      ctx.beginPath();
      ctx.arc(centerCanvas.x, centerCanvas.y, data.radius * scale, 0, 2 * Math.PI);
      ctx.stroke();
      
      if (isActive) {
        ctx.fill();
      }
      
      ctx.fillStyle = isActive ? '#dc3c3c' : '#ffffff';
      ctx.font = '10px monospace';
      ctx.fillText(name, centerCanvas.x + 5, centerCanvas.y - 5);
    });
  },

  drawRunways: (ctx, width, height, scale, offsetX, offsetY, zoom) => {
    const { RUNWAY_DATA } = require('./constants');

    const drawRunway = (threshold1Lat, threshold1Lon, threshold2Lat, threshold2Lon, heading, length, label1, label2) => {
      // Calculate center point of runway from the two thresholds
      const centerLat = (threshold1Lat + threshold2Lat) / 2;
      const centerLon = (threshold1Lon + threshold2Lon) / 2;

      const canvasPos = CoordinateUtils.latLonToCanvas(
        centerLat,
        centerLon,
        width,
        height,
        ARP.lat,
        ARP.lon,
        scale,
        offsetX,
        offsetY
      );

      ctx.save();
      ctx.translate(canvasPos.x, canvasPos.y);
      ctx.rotate((heading - 90) * Math.PI / 180);

      ctx.fillStyle = '#555555';
      ctx.fillRect(-length/2, -2, length, 4);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.5;
      for (let i = -length/2; i < length/2; i += 10) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 5, 0);
        ctx.stroke();
      }

      ctx.restore();

      // Draw runway labels only when zoomed in (zoom >= 4)
      if (zoom >= 4) {
        // Calculate threshold positions for labels
        const threshold1Pos = CoordinateUtils.latLonToCanvas(
          threshold1Lat,
          threshold1Lon,
          width,
          height,
          ARP.lat,
          ARP.lon,
          scale,
          offsetX,
          offsetY
        );

        const threshold2Pos = CoordinateUtils.latLonToCanvas(
          threshold2Lat,
          threshold2Lon,
          width,
          height,
          ARP.lat,
          ARP.lon,
          scale,
          offsetX,
          offsetY
        );

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';

        // Draw labels near thresholds
        // label1 offset depends on runway (passed as parameter)
        // label2 offset depends on runway (passed as parameter)
        ctx.fillText(label1, threshold1Pos.x + 8, threshold1Pos.y - 8);
        ctx.fillText(label2, threshold2Pos.x + 8, threshold2Pos.y - 8);
      }
    };

    // 12L/30R runway (same physical runway) - labels to the north
    drawRunway(
      RUNWAY_DATA['12L'].threshold.lat,
      RUNWAY_DATA['12L'].threshold.lon,
      RUNWAY_DATA['30R'].threshold.lat,
      RUNWAY_DATA['30R'].threshold.lon,
      120,
      2 * scale,
      '12L',
      '30R'
    );

    // 12R/30L runway (same physical runway) - need to override label positions to south
    // Temporarily inline this to change label positioning
    {
      const threshold1Lat = RUNWAY_DATA['12R'].threshold.lat;
      const threshold1Lon = RUNWAY_DATA['12R'].threshold.lon;
      const threshold2Lat = RUNWAY_DATA['30L'].threshold.lat;
      const threshold2Lon = RUNWAY_DATA['30L'].threshold.lon;
      const heading = 120;
      const length = 2 * scale;

      const centerLat = (threshold1Lat + threshold2Lat) / 2;
      const centerLon = (threshold1Lon + threshold2Lon) / 2;

      const canvasPos = CoordinateUtils.latLonToCanvas(
        centerLat,
        centerLon,
        width,
        height,
        ARP.lat,
        ARP.lon,
        scale,
        offsetX,
        offsetY
      );

      ctx.save();
      ctx.translate(canvasPos.x, canvasPos.y);
      ctx.rotate((heading - 90) * Math.PI / 180);

      ctx.fillStyle = '#555555';
      ctx.fillRect(-length/2, -2, length, 4);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.5;
      for (let i = -length/2; i < length/2; i += 10) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 5, 0);
        ctx.stroke();
      }

      ctx.restore();

      // Draw runway labels to the SOUTH (positive Y offset)
      if (zoom >= 4) {
        const threshold1Pos = CoordinateUtils.latLonToCanvas(
          threshold1Lat,
          threshold1Lon,
          width,
          height,
          ARP.lat,
          ARP.lon,
          scale,
          offsetX,
          offsetY
        );

        const threshold2Pos = CoordinateUtils.latLonToCanvas(
          threshold2Lat,
          threshold2Lon,
          width,
          height,
          ARP.lat,
          ARP.lon,
          scale,
          offsetX,
          offsetY
        );

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';

        // Draw labels to the south (positive Y)
        ctx.fillText('12R', threshold1Pos.x + 8, threshold1Pos.y + 18);
        ctx.fillText('30L', threshold2Pos.x + 8, threshold2Pos.y + 18);
      }
    }
  },

  drawARP: (ctx, centerX, centerY) => {
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#ff00ff';
    ctx.font = '10px monospace';
    ctx.fillText('ARP', centerX + 5, centerY - 5);
  },

  drawVisualPoints: (ctx, width, height, scale, offsetX, offsetY, showVisual) => {
    if (!showVisual) return;

    Object.entries(VISUAL_POINTS).forEach(([name, data]) => {
      const pos = CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, data.radial, data.distance);
      const canvasPos = CoordinateUtils.latLonToCanvas(pos.lat, pos.lon, width, height, ARP.lat, ARP.lon, scale, offsetX, offsetY);
      
      // Draw triangle pointing up
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.moveTo(canvasPos.x, canvasPos.y - 6);
      ctx.lineTo(canvasPos.x - 5, canvasPos.y + 4);
      ctx.lineTo(canvasPos.x + 5, canvasPos.y + 4);
      ctx.closePath();
      ctx.fill();
      
      // Draw label
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(name, canvasPos.x + 8, canvasPos.y + 4);
    });
  },

  drawInstrumentalPoints: (ctx, width, height, scale, offsetX, offsetY, showInstrumental) => {
    if (!showInstrumental) return;

    Object.entries(INSTRUMENTAL_POINTS).forEach(([name, data]) => {
      const pos = CoordinateUtils.radialDistanceToLatLon(ARP.lat, ARP.lon, data.radial, data.distance);
      const canvasPos = CoordinateUtils.latLonToCanvas(pos.lat, pos.lon, width, height, ARP.lat, ARP.lon, scale, offsetX, offsetY);
      
      // Draw diamond shape
      ctx.fillStyle = '#00aaff';
      ctx.beginPath();
      ctx.moveTo(canvasPos.x, canvasPos.y - 6);
      ctx.lineTo(canvasPos.x + 5, canvasPos.y);
      ctx.lineTo(canvasPos.x, canvasPos.y + 6);
      ctx.lineTo(canvasPos.x - 5, canvasPos.y);
      ctx.closePath();
      ctx.fill();
      
      // Draw label
      ctx.fillStyle = '#00aaff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(name, canvasPos.x + 8, canvasPos.y + 4);
    });
  },

  drawAircraft: (ctx, width, height, scale, offsetX, offsetY, aircraft, selectedAircraft, blinkingAircraftId, blinkState) => {
    // Sort aircraft so formation trail members render below leaders
    // Non-formation aircraft and formation leaders render on top
    const sortedAircraft = [...aircraft].sort((a, b) => {
      // Trail members (not leaders) render first (below)
      const aIsTrailMember = a.isFormationMember && !a.formationLeader;
      const bIsTrailMember = b.isFormationMember && !b.formationLeader;

      if (aIsTrailMember && !bIsTrailMember) return -1; // a renders first
      if (!aIsTrailMember && bIsTrailMember) return 1;  // b renders first
      return 0; // Keep original order for same priority
    });

    sortedAircraft.forEach(plane => {
      const canvasPos = CoordinateUtils.latLonToCanvas(
        plane.position.lat,
        plane.position.lon,
        width, height,
        ARP.lat,
        ARP.lon,
        scale,
        offsetX,
        offsetY
      );

      const isSelected = selectedAircraft === plane.id;
      const isBlinking = blinkingAircraftId === plane.id;
      const typeColor = AIRCRAFT_TYPES[plane.type].color;

      let displayColor;
      if (isBlinking) {
        displayColor = blinkState ? '#ffffff' : typeColor;
      } else if (isSelected) {
        displayColor = '#ffff00';
      } else {
        displayColor = typeColor;
      }

      // Draw aircraft symbol (triangle pointing in heading direction) - LARGER
      ctx.save();
      ctx.translate(canvasPos.x, canvasPos.y);
      ctx.rotate((plane.heading - 90) * Math.PI / 180);

      ctx.fillStyle = displayColor;
      ctx.beginPath();
      ctx.moveTo(12, 0);   // Increased from 8
      ctx.lineTo(-9, -7);  // Increased from -6, -5
      ctx.lineTo(-9, 7);   // Increased from -6, 5
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Draw data tag with dark background boxes (radar style)
      const tagX = canvasPos.x + 15;
      const tagY = canvasPos.y - 12;

      // Line 1: Callsign with heading arrow (add RANDOM indicator if in random autopilot)
      const arrowSymbol = CanvasRenderer.getArrowSymbol(plane.heading);
      const randomIndicator = plane.navigationMode === 'RANDOM_VFR' ? ' [RND]' : '';
      const line1 = `${plane.callsign} ${arrowSymbol}${randomIndicator}`;

      // Line 2: Current FL / Assigned FL
      const currentFL = plane.altitude === 0 ? 'GND' : `FL${Math.floor(plane.altitude / 100).toString().padStart(3, '0')}`;
      const assignedFL = plane.assignedAltitude === 0 ? 'GND' : `FL${Math.floor(plane.assignedAltitude / 100).toString().padStart(3, '0')}`;
      const line2 = `${currentFL} / ${assignedFL}`;

      // Line 3: Ground speed
      const line3 = `${Math.round(plane.speed)} kts`;

      // Draw dark background boxes for each line
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      const line1Width = plane.navigationMode === 'RANDOM_VFR' ? 165 : 125;  // Wider for [RND] indicator
      ctx.fillRect(tagX - 3, tagY - 14, line1Width, 18);  // Line 1 box
      ctx.fillRect(tagX - 3, tagY + 2, 145, 18);   // Line 2 box
      ctx.fillRect(tagX - 3, tagY + 18, 85, 18);   // Line 3 box

      // Draw text with thin outline (stroke) and white fill
      ctx.font = 'bold 15px monospace';
      ctx.lineWidth = 1;  // Thin 1px outline
      ctx.strokeStyle = displayColor;
      ctx.fillStyle = '#ffffff';

      // Line 1
      ctx.strokeText(line1, tagX, tagY);
      ctx.fillText(line1, tagX, tagY);

      // Line 2
      ctx.font = '14px monospace';
      ctx.strokeText(line2, tagX, tagY + 16);
      ctx.fillText(line2, tagX, tagY + 16);

      // Line 3
      ctx.strokeText(line3, tagX, tagY + 32);
      ctx.fillText(line3, tagX, tagY + 32);
    });
  },

  getArrowSymbol: (heading) => {
    // Return arrow based on heading (8 directions)
    if (heading >= 337.5 || heading < 22.5) return '↑';
    if (heading >= 22.5 && heading < 67.5) return '↗';
    if (heading >= 67.5 && heading < 112.5) return '→';
    if (heading >= 112.5 && heading < 157.5) return '↘';
    if (heading >= 157.5 && heading < 202.5) return '↓';
    if (heading >= 202.5 && heading < 247.5) return '↙';
    if (heading >= 247.5 && heading < 292.5) return '←';
    return '↖';
  },

  drawSIDs: (ctx, width, height, scale, panOffsetX, panOffsetY, showRunway30, showRunway12, showMilitaryDepartures) => {
    // Draw SID routes for teaching purposes
    const sidsToShow = [];

    if (showRunway30) {
      sidsToShow.push(...getSIDsForRunway('30R').filter(sid => !sid.isMilitary));
      sidsToShow.push(...getSIDsForRunway('30L').filter(sid => !sid.isMilitary));
    }

    if (showRunway12) {
      sidsToShow.push(...getSIDsForRunway('12R').filter(sid => !sid.isMilitary));
      sidsToShow.push(...getSIDsForRunway('12L').filter(sid => !sid.isMilitary));
    }

    if (showMilitaryDepartures) {
      sidsToShow.push(...getSIDsForRunway('30R').filter(sid => sid.isMilitary));
      sidsToShow.push(...getSIDsForRunway('30L').filter(sid => sid.isMilitary));
      sidsToShow.push(...getSIDsForRunway('12R').filter(sid => sid.isMilitary));
      sidsToShow.push(...getSIDsForRunway('12L').filter(sid => sid.isMilitary));
    }

    // Remove duplicates (SIDs that apply to multiple runways)
    const uniqueSIDs = [...new Map(sidsToShow.map(sid => [sid.designator, sid])).values()];

    // Track final waypoint positions to prevent label overlap
    const finalWaypointCounts = {};

    uniqueSIDs.forEach((sid, index) => {
      // Use different colors for different SIDs
      const colors = ['#9333ea', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'];
      const color = colors[index % colors.length];

      // Add transparency for military SIDs to reduce visual clutter
      if (sid.isMilitary) {
        ctx.globalAlpha = 0.7;
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]); // Dashed line

      // Get runway threshold as starting point
      const runwayId = sid.runways[0]; // Use first runway
      const runway = RUNWAY_DATA[runwayId];
      const runwayHeading = runway.heading;

      let lastPos = CoordinateUtils.latLonToCanvas(
        runway.threshold.lat,
        runway.threshold.lon,
        width,
        height,
        ARP.lat,
        ARP.lon,
        scale,
        panOffsetX,
        panOffsetY
      );

      // Start drawing from runway
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);

      // Draw initial runway heading segment (5 NM along runway heading)
      const initialSegment = CoordinateUtils.radialDistanceToLatLon(
        runway.threshold.lat,
        runway.threshold.lon,
        runwayHeading,
        5
      );
      const initialSegmentPos = CoordinateUtils.latLonToCanvas(
        initialSegment.lat,
        initialSegment.lon,
        width,
        height,
        ARP.lat,
        ARP.lon,
        scale,
        panOffsetX,
        panOffsetY
      );
      ctx.lineTo(initialSegmentPos.x, initialSegmentPos.y);
      lastPos = initialSegmentPos;

      // Now draw to waypoints
      sid.waypoints.forEach((waypoint, wpIndex) => {
        const waypointPos = CoordinateUtils.latLonToCanvas(
          waypoint.lat,
          waypoint.lon,
          width,
          height,
          ARP.lat,
          ARP.lon,
          scale,
          panOffsetX,
          panOffsetY
        );

        ctx.lineTo(waypointPos.x, waypointPos.y);

        // Draw waypoint marker (always draw)
        ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(waypointPos.x, waypointPos.y, 4, 0, 2 * Math.PI);
        ctx.fill();

        // Draw waypoint name (skip intermediate names for military SIDs)
        const isLastWaypoint = wpIndex === sid.waypoints.length - 1;
        const shouldDrawLabel = !sid.isMilitary || isLastWaypoint;

        if (shouldDrawLabel) {
          ctx.fillStyle = color;
          ctx.font = 'bold 12px monospace';
          ctx.fillText(waypoint.name, waypointPos.x + 8, waypointPos.y - 8);
        }

        // Continue line if not last waypoint
        if (wpIndex < sid.waypoints.length - 1) {
          ctx.beginPath();
          ctx.moveTo(waypointPos.x, waypointPos.y);
        }

        lastPos = waypointPos;
      });

      ctx.stroke();

      // Draw SID designator near the last waypoint with offset for duplicates
      if (sid.waypoints.length > 0) {
        const lastWaypoint = sid.waypoints[sid.waypoints.length - 1];
        const lastWP = CoordinateUtils.latLonToCanvas(
          lastWaypoint.lat,
          lastWaypoint.lon,
          width,
          height,
          ARP.lat,
          ARP.lon,
          scale,
          panOffsetX,
          panOffsetY
        );

        // Create unique key based on final waypoint name to detect duplicates
        const waypointKey = lastWaypoint.name;
        if (!finalWaypointCounts[waypointKey]) {
          finalWaypointCounts[waypointKey] = 0;
        }
        const labelOffset = finalWaypointCounts[waypointKey] * 15;
        finalWaypointCounts[waypointKey]++;

        // Reset transparency for labels to make them fully visible
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = color;
        ctx.font = 'bold 11px monospace';
        ctx.fillText(sid.designator, lastWP.x + 8, lastWP.y + 18 + labelOffset);
      }

      ctx.setLineDash([]); // Reset to solid line
      ctx.globalAlpha = 1.0; // Reset transparency
    });
  },

  drawDrawingRoute: (ctx, drawingPoints) => {
    if (drawingPoints.length < 2) return;

    ctx.save();
    ctx.strokeStyle = '#ff00ff'; // Magenta color
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]); // Dashed line

    ctx.beginPath();
    ctx.moveTo(drawingPoints[0].x, drawingPoints[0].y);

    for (let i = 1; i < drawingPoints.length; i++) {
      ctx.lineTo(drawingPoints[i].x, drawingPoints[i].y);
    }

    ctx.stroke();

    // Draw waypoint markers at sampled points
    const SAMPLING_INTERVAL = Math.max(1, Math.floor(drawingPoints.length / 10));
    ctx.setLineDash([]); // Solid for circles
    ctx.fillStyle = '#ff00ff';

    for (let i = 0; i < drawingPoints.length; i += SAMPLING_INTERVAL) {
      ctx.beginPath();
      ctx.arc(drawingPoints[i].x, drawingPoints[i].y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw final point marker
    const lastPoint = drawingPoints[drawingPoints.length - 1];
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
  },

  drawMeasurementTool: (ctx, origin, currentMousePos, width, height, scale, offsetX, offsetY, aircraftData, isAnchored = false) => {
    if (!origin || !currentMousePos) return null;

    // Convert origin lat/lon to canvas coordinates
    const originCanvas = CoordinateUtils.latLonToCanvas(
      origin.lat,
      origin.lon,
      width,
      height,
      ARP.lat,
      ARP.lon,
      scale,
      offsetX,
      offsetY
    );

    // Convert mouse position to lat/lon
    const mouseLatLon = CoordinateUtils.canvasToLatLon(
      currentMousePos.x,
      currentMousePos.y,
      width,
      height,
      ARP.lat,
      ARP.lon,
      scale,
      offsetX,
      offsetY
    );

    // Calculate bearing and distance
    const bearing = GeometryUtils.calculateBearing(origin.lat, origin.lon, mouseLatLon.lat, mouseLatLon.lon);
    const distance = GeometryUtils.calculateDistance(origin.lat, origin.lon, mouseLatLon.lat, mouseLatLon.lon);

    ctx.save();

    // Different colors for anchored vs active
    const lineColor = isAnchored ? '#ffaa00' : '#00ffff'; // Orange for anchored, Cyan for active
    const markerColor = isAnchored ? '#ffaa00' : '#00ffff';

    // Draw line from origin to mouse
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(originCanvas.x, originCanvas.y);
    ctx.lineTo(currentMousePos.x, currentMousePos.y);
    ctx.stroke();

    // Draw origin marker
    ctx.fillStyle = markerColor;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(originCanvas.x, originCanvas.y, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Prepare measurement text
    const bearingText = `${Math.round(bearing).toString().padStart(3, '0')}°`;
    const distanceText = `${distance.toFixed(1)} NM`;

    let timeText = null;
    if (origin.type === 'aircraft' && aircraftData) {
      const timeHours = distance / aircraftData.speed;
      const timeMinutes = timeHours * 60;
      if (timeMinutes < 60) {
        timeText = `${Math.round(timeMinutes)} min`;
      } else {
        timeText = `${timeHours.toFixed(1)} hr`;
      }
    }

    // Draw text box near mouse cursor
    const textLines = [
      `Radial: ${bearingText}`,
      `Distance: ${distanceText}`
    ];
    if (timeText) {
      textLines.push(`Time: ${timeText}`);
    }

    // Calculate text box dimensions
    ctx.font = 'bold 14px monospace';
    const lineHeight = 18;
    const padding = 8;
    const maxWidth = Math.max(...textLines.map(line => ctx.measureText(line).width));
    const boxWidth = maxWidth + padding * 2;
    const boxHeight = textLines.length * lineHeight + padding * 2;

    // Position text box offset from cursor
    const boxX = currentMousePos.x + 15;
    const boxY = currentMousePos.y - 15 - boxHeight;

    // Draw text box background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // Draw text box border
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    textLines.forEach((line, index) => {
      ctx.fillText(line, boxX + padding, boxY + padding + (index + 1) * lineHeight - 4);
    });

    ctx.restore();

    // Return info box bounds for click detection
    return {
      x: boxX,
      y: boxY,
      width: boxWidth,
      height: boxHeight
    };
  },

  /**
   * Draw holding patterns for all aircraft in holding
   */
  drawHoldingPatterns: (ctx, width, height, scale, offsetX, offsetY, aircraft) => {
    aircraft.forEach(plane => {
      if (plane.holdingPattern && plane.navigationMode === 'HOLDING') {
        const holding = plane.holdingPattern;

        // Convert fix coordinates to canvas
        const fixCanvas = CoordinateUtils.latLonToCanvas(
          holding.fixLat,
          holding.fixLon,
          width,
          height,
          ARP.lat,
          ARP.lon,
          scale,
          offsetX,
          offsetY
        );

        ctx.save();

        // Draw holding fix marker (circle with cross)
        ctx.strokeStyle = '#FFD700'; // Gold color for holding
        ctx.fillStyle = '#FFD700';
        ctx.lineWidth = 2;

        // Circle
        ctx.beginPath();
        ctx.arc(fixCanvas.x, fixCanvas.y, 8, 0, 2 * Math.PI);
        ctx.stroke();

        // Cross
        ctx.beginPath();
        ctx.moveTo(fixCanvas.x - 8, fixCanvas.y);
        ctx.lineTo(fixCanvas.x + 8, fixCanvas.y);
        ctx.moveTo(fixCanvas.x, fixCanvas.y - 8);
        ctx.lineTo(fixCanvas.x, fixCanvas.y + 8);
        ctx.stroke();

        // Calculate holding pattern geometry
        const inboundTrack = holding.inboundTrack;
        const outboundTrack = (inboundTrack + 180) % 360;
        const legTime = holding.legTime;

        // Approximate leg length in NM (assuming typical holding speed of 150 kts)
        const approximateSpeed = 150; // kts
        const legLength = (approximateSpeed / 60) * legTime; // NM

        // Calculate outbound end point
        const outboundEnd = CoordinateUtils.radialDistanceToLatLon(
          holding.fixLat,
          holding.fixLon,
          outboundTrack,
          legLength
        );

        const outboundEndCanvas = CoordinateUtils.latLonToCanvas(
          outboundEnd.lat,
          outboundEnd.lon,
          width,
          height,
          ARP.lat,
          ARP.lon,
          scale,
          offsetX,
          offsetY
        );

        // Calculate inbound start point (parallel to outbound, offset by turn radius)
        // Approximate turn radius for standard rate turn at 150 kts ≈ 1.5 NM
        const turnRadius = 1.5; // NM
        const turnDirection = holding.turnDirection;

        // Perpendicular offset direction
        let perpendicularTrack;
        if (turnDirection === 'RIGHT') {
          perpendicularTrack = (outboundTrack + 90) % 360;
        } else {
          perpendicularTrack = (outboundTrack - 90 + 360) % 360;
        }

        const inboundStart = CoordinateUtils.radialDistanceToLatLon(
          outboundEnd.lat,
          outboundEnd.lon,
          perpendicularTrack,
          turnRadius * 2 // Diameter of turn
        );

        const inboundStartCanvas = CoordinateUtils.latLonToCanvas(
          inboundStart.lat,
          inboundStart.lon,
          width,
          height,
          ARP.lat,
          ARP.lon,
          scale,
          offsetX,
          offsetY
        );

        // Draw racetrack pattern
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);

        // Inbound leg
        ctx.beginPath();
        ctx.moveTo(inboundStartCanvas.x, inboundStartCanvas.y);
        ctx.lineTo(fixCanvas.x, fixCanvas.y);
        ctx.stroke();

        // Outbound leg
        ctx.beginPath();
        ctx.moveTo(fixCanvas.x, fixCanvas.y);
        ctx.lineTo(outboundEndCanvas.x, outboundEndCanvas.y);
        ctx.stroke();

        // Turn arcs (approximate with straight lines for simplicity)
        ctx.beginPath();
        ctx.moveTo(outboundEndCanvas.x, outboundEndCanvas.y);
        ctx.lineTo(inboundStartCanvas.x, inboundStartCanvas.y);
        ctx.stroke();

        ctx.setLineDash([]);

        // Draw info box
        const fixName = holding.fixName || 'PRES POS';
        const infoLines = [
          `${plane.callsign}`,
          `Hold: ${fixName}`,
          `Inbound: ${inboundTrack.toString().padStart(3, '0')}°`,
          `${turnDirection} turns`,
          `${legTime} min legs`,
          `Assigned: ${Math.round(plane.assignedAltitude)} ft`
        ];

        ctx.font = 'bold 12px monospace';
        const lineHeight = 16;
        const padding = 6;
        const maxWidth = Math.max(...infoLines.map(line => ctx.measureText(line).width));
        const boxWidth = maxWidth + padding * 2;
        const boxHeight = infoLines.length * lineHeight + padding * 2;

        // Position info box near fix
        const boxX = fixCanvas.x + 15;
        const boxY = fixCanvas.y - boxHeight - 15;

        // Draw box background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        // Draw box border
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Draw text
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px monospace';
        infoLines.forEach((line, i) => {
          ctx.fillText(line, boxX + padding, boxY + padding + (i + 1) * lineHeight);
        });

        ctx.restore();
      }
    });
  }
};
export { CanvasRenderer };