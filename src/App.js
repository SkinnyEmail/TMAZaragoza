import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ARP, RUNWAY_DATA, VISUAL_POINTS, INSTRUMENTAL_POINTS } from './constants';
import { CoordinateUtils } from './utils';
import { GeometryUtils } from './geometryUtils';
import { CanvasRenderer } from './renderer';
import MovementEngine from './movementEngine';
import { AIRCRAFT_STATES } from './aircraftStates';
import { AIRCRAFT_PERFORMANCE } from './aircraftPerformance';
import { ILSEngine } from './ilsEngine';
import SpawnPanel from './SpawnPanel';
import AirborneSpawnPanel from './AirborneSpawnPanel';
import DeletePlanePanel from './DeletePlanePanel';
import AssignSIDPanel from './AssignSIDPanel';
import HeadingCommandPanel from './HeadingCommandPanel';
import AltitudeCommandPanel from './AltitudeCommandPanel';
import SpeedCommandPanel from './SpeedCommandPanel';
import RouteCommandPanel from './RouteCommandPanel';
import RouteDrawingPanel from './RouteDrawingPanel';
import ILSAssignPanel from './ILSAssignPanel';
import HoldingPanel from './HoldingPanel';
import OrbitPanel from './OrbitPanel';
import ScenarioLoadPanel from './ScenarioLoadPanel';
import VORAssignPanel from './VORAssignPanel';
import VisualAssignPanel from './VisualAssignPanel';
import AircraftListPanel from './AircraftListPanel';
import ControlPanel from './ControlPanel';
import { HoldingEngine } from './holdingEngine';
import { OrbitEngine } from './orbitEngine';
import { VOREngine } from './vorEngine';
import { VisualEngine } from './visualEngine';

const ZaragozaTMASimulator = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [showATZ, setShowATZ] = useState(true);
  const [showCTR, setShowCTR] = useState(true);
  const [showCorridor, setShowCorridor] = useState(false);
  const [showVisual, setShowVisual] = useState(false);
  const [showInstrumental, setShowInstrumental] = useState(false);
  const [showSIDsRunway30, setShowSIDsRunway30] = useState(false);
  const [showSIDsRunway12, setShowSIDsRunway12] = useState(false);
  const [showMilitaryDepartures, setShowMilitaryDepartures] = useState(false);
  const [activeDelta, setActiveDelta] = useState({
    'LED50': false,
    'Area C': false,
    'A123': false,
    'LED70': false,
    'LED107': false
  });
  const [zoom, setZoom] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [aircraft, setAircraft] = useState([]);
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [showSpawnPanel, setShowSpawnPanel] = useState(false);
  const [showAirborneSpawnPanel, setShowAirborneSpawnPanel] = useState(false);
  const [showDeletePanel, setShowDeletePanel] = useState(false);
  const [showAssignSIDPanel, setShowAssignSIDPanel] = useState(false);
  const [showHeadingPanel, setShowHeadingPanel] = useState(false);
  const [showAltitudePanel, setShowAltitudePanel] = useState(false);
  const [showSpeedPanel, setShowSpeedPanel] = useState(false);
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [showDrawingPanel, setShowDrawingPanel] = useState(false);
  const [showILSPanel, setShowILSPanel] = useState(false);
  const [showVORPanel, setShowVORPanel] = useState(false);
  const [showVisualPanel, setShowVisualPanel] = useState(false);
  const [showHoldingPanel, setShowHoldingPanel] = useState(false);
  const [showOrbitPanel, setShowOrbitPanel] = useState(false);
  const [showScenarioPanel, setShowScenarioPanel] = useState(false);
  const [showHoldings, setShowHoldings] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [nextAircraftId, setNextAircraftId] = useState(1);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1400, height: 900 });
  const [blinkingAircraftId, setBlinkingAircraftId] = useState(null);
  const [blinkState, setBlinkState] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1.0);
  const [measurementActive, setMeasurementActive] = useState(false);
  const [measurementOrigin, setMeasurementOrigin] = useState(null);
  const [currentMousePos, setCurrentMousePos] = useState(null);
  const [anchoredMeasurements, setAnchoredMeasurements] = useState([]);
  const [nextMeasurementId, setNextMeasurementId] = useState(1);
  const [simulationTime, setSimulationTime] = useState(0);
  const [scheduledSpawns, setScheduledSpawns] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [metar, setMetar] = useState('Loading METAR...');

  const BASE_SCALE = 3;

  const handleWheel = (e) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Calculate zoom delta
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(1, Math.min(25, zoom * delta));
    const zoomRatio = newZoom / zoom;

    // Scale the pan offset by the zoom ratio to keep the view centered
    // When zooming in (zoomRatio > 1), the offset should scale up
    // When zooming out (zoomRatio < 1), the offset should scale down
    const newPanOffsetX = panOffset.x * zoomRatio;
    const newPanOffsetY = panOffset.y * zoomRatio;

    setZoom(newZoom);
    setPanOffset({ x: newPanOffsetX, y: newPanOffsetY });
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Middle click - toggle measurement tool OR delete anchored measurement
    if (e.button === 1) {
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const canvasClickX = clickX * scaleX;
      const canvasClickY = clickY * scaleY;

      // Check if clicking on an anchored measurement info box
      let clickedMeasurementId = null;
      for (const measurement of anchoredMeasurements) {
        if (measurement.infoBoxBounds) {
          const box = measurement.infoBoxBounds;
          if (canvasClickX >= box.x && canvasClickX <= box.x + box.width &&
              canvasClickY >= box.y && canvasClickY <= box.y + box.height) {
            clickedMeasurementId = measurement.id;
            break;
          }
        }
      }

      if (clickedMeasurementId) {
        // Delete this anchored measurement
        setAnchoredMeasurements(prev => prev.filter(m => m.id !== clickedMeasurementId));
        return;
      }

      if (measurementActive) {
        // Deactivate tool
        setMeasurementActive(false);
        setMeasurementOrigin(null);
        setCurrentMousePos(null);
      } else {
        // Activate tool - set origin
        const scale = BASE_SCALE * zoom;

        // Check if clicking near any aircraft
        let clickedAircraft = null;
        const clickRadius = 15; // pixels

        for (const plane of aircraft) {
          const canvasPos = CoordinateUtils.latLonToCanvas(
            plane.position.lat,
            plane.position.lon,
            canvasDimensions.width,
            canvasDimensions.height,
            ARP.lat,
            ARP.lon,
            scale,
            panOffset.x,
            panOffset.y
          );

          const distance = Math.sqrt(
            Math.pow(canvasPos.x - canvasClickX, 2) + Math.pow(canvasPos.y - canvasClickY, 2)
          );

          if (distance < clickRadius) {
            clickedAircraft = plane;
            break;
          }
        }

        if (clickedAircraft) {
          // Aircraft origin
          setMeasurementOrigin({
            type: 'aircraft',
            aircraftId: clickedAircraft.id,
            lat: clickedAircraft.position.lat,
            lon: clickedAircraft.position.lon
          });
        } else {
          // Map origin - convert canvas to lat/lon
          const latLon = CoordinateUtils.canvasToLatLon(
            canvasClickX,
            canvasClickY,
            canvasDimensions.width,
            canvasDimensions.height,
            ARP.lat,
            ARP.lon,
            scale,
            panOffset.x,
            panOffset.y
          );
          setMeasurementOrigin({
            type: 'map',
            lat: latLon.lat,
            lon: latLon.lon
          });
        }

        setMeasurementActive(true);

        // Convert initial mouse position to lat/lon
        const initialLatLon = CoordinateUtils.canvasToLatLon(
          canvasClickX,
          canvasClickY,
          canvasDimensions.width,
          canvasDimensions.height,
          ARP.lat,
          ARP.lon,
          scale,
          panOffset.x,
          panOffset.y
        );
        setCurrentMousePos({ lat: initialLatLon.lat, lon: initialLatLon.lon });
      }
      return;
    }

    // Drawing mode - left mouse button starts drawing
    if (isDrawingMode && e.button === 0) {
      setIsDrawing(true);
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDrawingPoints([{ x, y }]);
      return;
    }

    // Right mouse button (button 2) - anchor measurement OR pan
    if (e.button === 2) {
      e.preventDefault();

      // If measurement tool is active, anchor it
      if (measurementActive && measurementOrigin && currentMousePos) {
        // Check if we haven't reached the limit
        if (anchoredMeasurements.length < 7) {
          // currentMousePos is already stored as lat/lon
          // Create anchored measurement
          const newAnchor = {
            id: nextMeasurementId,
            origin: { ...measurementOrigin },
            targetLat: currentMousePos.lat,
            targetLon: currentMousePos.lon,
            infoBoxBounds: null // Will be set during rendering
          };

          setAnchoredMeasurements(prev => [...prev, newAnchor]);
          setNextMeasurementId(prev => prev + 1);

          // Keep the tool active for creating another measurement
          // Reset to allow immediate new measurement
          setMeasurementOrigin(null);
          setCurrentMousePos(null);
          setMeasurementActive(false);
        } else {
          console.log('Maximum 7 measurements reached');
        }
        return;
      }

      // Otherwise, pan
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert to actual canvas coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasMouseX = mouseX * scaleX;
    const canvasMouseY = mouseY * scaleY;

    // Measurement tool - update cursor position (store as lat/lon to avoid pan/zoom issues)
    if (measurementActive) {
      const scale = BASE_SCALE * zoom;
      const latLon = CoordinateUtils.canvasToLatLon(
        canvasMouseX,
        canvasMouseY,
        canvas.width,
        canvas.height,
        ARP.lat,
        ARP.lon,
        scale,
        panOffset.x,
        panOffset.y
      );
      setCurrentMousePos({ lat: latLon.lat, lon: latLon.lon });
    }

    // Drawing mode - collect points while dragging
    if (isDrawingMode && isDrawing) {
      setDrawingPoints(prev => [...prev, { x: mouseX, y: mouseY }]);
      return;
    }

    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    // Drawing mode - finish drawing
    if (isDrawingMode && isDrawing) {
      setIsDrawing(false);
      // Convert drawing points to route waypoints
      convertDrawingToRoute();
      return;
    }

    setIsDragging(false);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  const handleCanvasClick = (e) => {
    // Only handle left clicks
    if (e.button !== 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert to actual canvas coordinates (accounting for scaling)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasClickX = clickX * scaleX;
    const canvasClickY = clickY * scaleY;

    const scale = BASE_SCALE * zoom;

    // Check if click is near any aircraft
    let clickedAircraft = null;
    const clickRadius = 15; // pixels

    for (const plane of aircraft) {
      const canvasPos = CoordinateUtils.latLonToCanvas(
        plane.position.lat,
        plane.position.lon,
        canvas.width,
        canvas.height,
        ARP.lat,
        ARP.lon,
        scale,
        panOffset.x,
        panOffset.y
      );

      const distance = Math.sqrt(
        Math.pow(canvasClickX - canvasPos.x, 2) +
        Math.pow(canvasClickY - canvasPos.y, 2)
      );

      if (distance <= clickRadius) {
        clickedAircraft = plane.id;
        break;
      }
    }

    // Update selection: set to clicked aircraft or null if empty space
    setSelectedAircraft(clickedAircraft);
  };

  const resetView = () => {
    setZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleSpawnAircraft = (spawnData) => {
    const runwayData = RUNWAY_DATA[spawnData.runway];
    const formation = [];

    // Map runways to their departure threshold (for "lined up and holding" position)
    // Each runway departs from its own threshold
    const departureThresholdMap = {
      '12L': RUNWAY_DATA['12L'].threshold,
      '12R': RUNWAY_DATA['12R'].threshold,
      '30R': RUNWAY_DATA['30R'].threshold, // 30R departs from 30R threshold
      '30L': RUNWAY_DATA['30L'].threshold  // 30L departs from 30L threshold
    };

    const departureThreshold = departureThresholdMap[spawnData.runway];

    for (let i = 0; i < spawnData.formationSize; i++) {
      // All formation aircraft spawn at the same position (stacked)
      // Formation separation will be applied naturally once takeoff begins
      const position = { ...departureThreshold };

      formation.push({
        id: nextAircraftId + i,
        callsign: i === 0 ? spawnData.callsign : `${spawnData.callsign}${i}`,
        position: position,
        altitude: 0,
        assignedAltitude: 0,
        heading: runwayData.heading,
        speed: 0,
        type: spawnData.type,
        state: AIRCRAFT_STATES.PARKED,
        assignedSID: spawnData.sid || null,          // SID assignment
        sidWaypointIndex: 0,                         // Current waypoint in SID
        sidComplete: false,                          // SID completion flag
        sidAltitudeCap: spawnData.sidAltitudeCap || null,  // Altitude cap (null = use SID default)
        isFormationMember: spawnData.formationSize > 1,
        formationPosition: i,
        formationLeader: i === 0,
        formationLeaderId: nextAircraftId,           // ID of formation leader (first aircraft)
        isSplit: false,                              // Whether split from formation
        // ATC Command properties
        assignedHeading: null,                       // Assigned heading (null = follow SID/route)
        assignedSpeed: null,                         // Assigned speed (null = use performance default)
        assignedRoute: null,                         // Assigned route (array of waypoint names)
        routeWaypointIndex: 0,                       // Current waypoint in assigned route
        navigationMode: 'SID_NAV'                    // 'SID_NAV' | 'HEADING_MODE' | 'ROUTE_NAV'
      });
    }

    setAircraft(prev => [...prev, ...formation]);
    setNextAircraftId(prev => prev + spawnData.formationSize);
    setShowSpawnPanel(false);
  };

  const handleSpawnAirborne = (spawnData) => {
    console.log('Spawning airborne aircraft:', spawnData);
    // Get waypoint data
    const allWaypoints = { ...VISUAL_POINTS, ...INSTRUMENTAL_POINTS };
    const waypointData = allWaypoints[spawnData.waypoint];

    // Convert waypoint radial/distance to lat/lon
    const waypointLatLon = CoordinateUtils.radialDistanceToLatLon(
      ARP.lat,
      ARP.lon,
      waypointData.radial,
      waypointData.distance
    );

    // Calculate spawn position
    const performance = AIRCRAFT_PERFORMANCE[spawnData.type];
    const cruiseSpeed = performance.cruiseSpeed;
    const timeHours = spawnData.timeMinutes / 60;
    const spawnDistanceNM = cruiseSpeed * timeHours;

    // Bearing from waypoint to ARP (this is the inbound heading)
    const inboundHeading = GeometryUtils.calculateBearing(
      waypointLatLon.lat,
      waypointLatLon.lon,
      ARP.lat,
      ARP.lon
    );

    // Reverse bearing (from waypoint outbound, away from ARP)
    const outboundBearing = (inboundHeading + 180) % 360;

    // Calculate spawn position (outbound from waypoint, away from ARP)
    const spawnPosition = CoordinateUtils.radialDistanceToLatLon(
      waypointLatLon.lat,
      waypointLatLon.lon,
      outboundBearing,
      spawnDistanceNM
    );

    console.log(`Spawning ${spawnData.callsign} at ${spawnDistanceNM.toFixed(1)} NM from ${spawnData.waypoint}, heading ${Math.round(inboundHeading)}° toward ARP`);

    // Create aircraft formation
    const formation = [];

    for (let i = 0; i < spawnData.formationSize; i++) {
      const spacingNM = i * 0.5; // Match in-flight trail separation
      let position;

      if (i === 0) {
        position = spawnPosition;
      } else {
        // Trail formation - behind leader on same heading
        position = CoordinateUtils.radialDistanceToLatLon(
          spawnPosition.lat,
          spawnPosition.lon,
          outboundBearing, // Same bearing (trailing)
          spacingNM
        );
      }

      formation.push({
        id: nextAircraftId + i,
        callsign: i === 0 ? spawnData.callsign : `${spawnData.callsign}${i}`,
        position: position,
        altitude: spawnData.flightLevel * 100,
        assignedAltitude: spawnData.flightLevel * 100,
        heading: inboundHeading, // Flying toward ARP
        assignedHeading: inboundHeading,
        speed: cruiseSpeed,
        assignedSpeed: cruiseSpeed,
        type: spawnData.type,
        state: AIRCRAFT_STATES.CRUISE,
        navigationMode: 'HEADING_MODE',
        // Formation data
        isFormationMember: spawnData.formationSize > 1,
        formationPosition: i,
        formationLeader: i === 0,
        formationLeaderId: nextAircraftId,           // ID of formation leader (first aircraft)
        isSplit: false,                              // Whether split from formation
        // Null values for unused fields
        assignedSID: null,
        sidWaypointIndex: 0,
        sidComplete: false,
        sidAltitudeCap: null,
        assignedRoute: null,
        routeWaypointIndex: 0,
        drawnRouteWaypoints: null,
        randomWaypoint: null
      });
    }

    setAircraft(prev => [...prev, ...formation]);
    setNextAircraftId(prev => prev + formation.length);
    setShowAirborneSpawnPanel(false);
  };

  // Simplified airborne spawn for scheduled scenarios (no formation)
  const handleScheduledAirborneSpawn = useCallback((callsign, type, altitude, waypoint, timeToWaypoint) => {
    console.log('Spawning scheduled aircraft:', callsign);
    // Get waypoint data
    const allWaypoints = { ...VISUAL_POINTS, ...INSTRUMENTAL_POINTS };
    const waypointData = allWaypoints[waypoint];

    // Convert waypoint radial/distance to lat/lon
    const waypointLatLon = CoordinateUtils.radialDistanceToLatLon(
      ARP.lat,
      ARP.lon,
      waypointData.radial,
      waypointData.distance
    );

    // Calculate spawn position
    const performance = AIRCRAFT_PERFORMANCE[type];
    const cruiseSpeed = performance.cruiseSpeed;
    const timeHours = timeToWaypoint / 60;
    const spawnDistanceNM = cruiseSpeed * timeHours;

    // Bearing from waypoint to ARP (this is the inbound heading)
    const inboundHeading = GeometryUtils.calculateBearing(
      waypointLatLon.lat,
      waypointLatLon.lon,
      ARP.lat,
      ARP.lon
    );

    // Reverse bearing (from waypoint outbound, away from ARP)
    const outboundBearing = (inboundHeading + 180) % 360;

    // Calculate spawn position (outbound from waypoint, away from ARP)
    const spawnPosition = CoordinateUtils.radialDistanceToLatLon(
      waypointLatLon.lat,
      waypointLatLon.lon,
      outboundBearing,
      spawnDistanceNM
    );

    const newAircraft = {
      id: nextAircraftId,
      callsign: callsign,
      position: spawnPosition,
      altitude: altitude,
      assignedAltitude: altitude,
      heading: inboundHeading,
      assignedHeading: inboundHeading,
      speed: cruiseSpeed,
      assignedSpeed: cruiseSpeed,
      type: type,
      state: AIRCRAFT_STATES.CRUISE,
      navigationMode: 'HEADING_MODE',
      isFormationMember: false,
      formationPosition: 0,
      formationLeader: false,
      assignedSID: null,
      sidWaypointIndex: 0,
      sidComplete: false,
      sidAltitudeCap: null,
      assignedRoute: null,
      routeWaypointIndex: 0,
      drawnRouteWaypoints: null,
      randomWaypoint: null
    };

    setAircraft(prev => [...prev, newAircraft]);
    setNextAircraftId(prev => prev + 1);
  }, [nextAircraftId]);

  const handleLoadScenario = async (scenarioData) => {
    console.log('Loading scenario:', scenarioData.name);

    // Reset everything
    setAircraft([]);
    setSelectedAircraft(null);
    setSimulationTime(0);
    setZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
    setMeasurementActive(false);
    setMeasurementOrigin(null);
    setCurrentMousePos(null);
    setAnchoredMeasurements([]);
    setNextMeasurementId(1);
    setNextAircraftId(1);

    // Set up scheduled spawns
    const spawns = scenarioData.aircraft.map(ac => ({
      callsign: ac.callsign,
      type: ac.type,
      flightLevel: ac.flightLevel,
      waypoint: ac.waypoint,
      timeToWaypoint: ac.timeToWaypoint,
      spawnTime: ac.spawnTime
    }));

    setScheduledSpawns(spawns);
    setShowScenarioPanel(false);

    console.log(`Scenario loaded: ${spawns.length} aircraft scheduled`);
  };

  const handleDeleteAircraft = (aircraftId) => {
    setBlinkingAircraftId(aircraftId);
    setShowDeletePanel(false);

    // Delete after 3 seconds
    setTimeout(() => {
      setAircraft(prev => prev.filter(plane => plane.id !== aircraftId));
      setBlinkingAircraftId(null);
      if (selectedAircraft === aircraftId) {
        setSelectedAircraft(null);
      }
    }, 3000);
  };

  const handleTakeoffCommand = (aircraftId) => {
    setAircraft(prev => {
      // Find the aircraft receiving the takeoff command
      const commandedAircraft = prev.find(p => p.id === aircraftId);
      if (!commandedAircraft || commandedAircraft.state !== AIRCRAFT_STATES.PARKED) {
        return prev;
      }

      // Determine if this aircraft is a formation leader
      const isFormationLeader = commandedAircraft.formationLeader && commandedAircraft.isFormationMember;
      const formationLeaderId = isFormationLeader ? aircraftId : null;

      return prev.map(plane => {
        // Apply to the commanded aircraft OR to trail members of the commanded leader
        const shouldTakeoff = (plane.id === aircraftId) ||
                              (isFormationLeader &&
                               plane.isFormationMember &&
                               !plane.formationLeader &&
                               plane.formationLeaderId === formationLeaderId &&
                               plane.state === AIRCRAFT_STATES.PARKED);

        if (shouldTakeoff) {
          // Determine target altitude
          let targetAltitude;
          if (plane.assignedSID) {
            // Use altitude cap if set, otherwise use SID's default (FL240)
            targetAltitude = plane.sidAltitudeCap || 24000;
          } else {
            // No SID, use standard 5000 ft
            targetAltitude = 5000;
          }

          return {
            ...plane,
            state: AIRCRAFT_STATES.TAKEOFF_ROLL,
            assignedAltitude: targetAltitude
          };
        }
        return plane;
      });
    });
  };

  const handleAssignSID = (aircraftId, sidDesignator, altitudeCap) => {
    setAircraft(prev => prev.map(plane => {
      if (plane.id === aircraftId) {
        return {
          ...plane,
          assignedSID: sidDesignator,
          sidWaypointIndex: 0,
          sidComplete: false,
          sidAltitudeCap: altitudeCap || null  // null = use SID default (FL240)
        };
      }
      return plane;
    }));
    setShowAssignSIDPanel(false);
  };

  const handleAssignHeading = (aircraftId, heading) => {
    setAircraft(prev => prev.map(plane => {
      if (plane.id === aircraftId) {
        return {
          ...plane,
          assignedHeading: heading,
          navigationMode: 'HEADING_MODE'
        };
      }
      return plane;
    }));
    setShowHeadingPanel(false);
  };

  const handleAssignAltitude = (aircraftId, altitude) => {
    setAircraft(prev => prev.map(plane => {
      if (plane.id === aircraftId) {
        // Determine if climbing or descending
        const newState = altitude > plane.altitude ? AIRCRAFT_STATES.CLIMBING : AIRCRAFT_STATES.DESCENDING;

        return {
          ...plane,
          assignedAltitude: altitude,
          state: altitude === plane.altitude ? plane.state : newState
        };
      }
      return plane;
    }));
    setShowAltitudePanel(false);
  };

  const handleAssignSpeed = (aircraftId, speed) => {
    setAircraft(prev => prev.map(plane => {
      if (plane.id === aircraftId) {
        return {
          ...plane,
          assignedSpeed: speed
        };
      }
      return plane;
    }));
    setShowSpeedPanel(false);
  };

  const handleAssignRoute = (aircraftId, waypointNames) => {
    setAircraft(prev => prev.map(plane => {
      if (plane.id === aircraftId) {
        return {
          ...plane,
          assignedRoute: waypointNames,
          routeWaypointIndex: 0,
          navigationMode: 'ROUTE_NAV'
        };
      }
      return plane;
    }));
    setShowRoutePanel(false);
  };

  const handleSplitFromFormation = (aircraftId) => {
    setAircraft(prev => prev.map(plane => {
      if (plane.id === aircraftId) {
        console.log(`${plane.callsign}: Split from formation, now flying independently`);
        return {
          ...plane,
          isSplit: true // Mark as split - will no longer follow leader
          // Keep current navigation mode, altitude, speed, heading
          // Aircraft continues doing what formation was doing, but now independent
        };
      }
      return plane;
    }));
  };

  const handleEnableRandomAutopilot = (aircraftId) => {
    setAircraft(prev => prev.map(plane => {
      if (plane.id === aircraftId && plane.type === 'VFR') {
        console.log(`${plane.callsign}: Random VFR autopilot enabled`);
        return {
          ...plane,
          navigationMode: 'RANDOM_VFR',
          randomWaypoint: null, // Will be initialized by RandomAutopilotEngine
          assignedRoute: null,
          assignedHeading: null
        };
      }
      return plane;
    }));
  };

  const handleAssignILS = (aircraftId, entryPoint) => {
    console.log(`Assigning ILS approach to aircraft ${aircraftId} via ${entryPoint}`);
    setAircraft(prev => prev.map(plane => {
      if (plane.id === aircraftId) {
        // Initialize ILS approach using ILSEngine
        const updatedPlane = ILSEngine.initializeILS(plane, entryPoint);
        console.log('Updated plane state:', {
          navigationMode: updatedPlane.navigationMode,
          ilsApproach: updatedPlane.ilsApproach
        });
        return updatedPlane;
      }
      return plane;
    }));
    setShowILSPanel(false);
  };

  const handleAssignVOR = (aircraftId, runway, entryPoint) => {
    console.log(`Assigning VOR ${runway} approach to aircraft ${aircraftId} entry: ${entryPoint}`);
    setAircraft(prev => prev.map(plane => {
      if (plane.id === aircraftId) {
        // Initialize VOR approach using appropriate VOREngine function
        let updatedPlane;
        if (runway === '30R') {
          updatedPlane = VOREngine.initializeVOR_30R(plane, entryPoint);
        } else {
          // VOR 12R - use existing initialization
          updatedPlane = VOREngine.initializeVOR(plane, entryPoint);
        }
        console.log('Updated plane state:', {
          navigationMode: updatedPlane.navigationMode,
          vorApproach: updatedPlane.vorApproach
        });
        return updatedPlane;
      }
      return plane;
    }));
    setShowVORPanel(false);
  };

  const handleAssignVisual = (aircraftId, runway, entryPoint) => {
    console.log(`Assigning Visual approach to aircraft ${aircraftId} runway ${runway} via ${entryPoint}`);
    setAircraft(prev => prev.map(plane => {
      if (plane.id === aircraftId) {
        // Initialize Visual approach using VisualEngine
        const updatedPlane = VisualEngine.initializeVisual(plane, runway, entryPoint);
        console.log('Updated plane state:', {
          navigationMode: updatedPlane.navigationMode,
          visualApproach: updatedPlane.visualApproach
        });
        return updatedPlane;
      }
      return plane;
    }));
    setShowVisualPanel(false);
  };

  const handleAssignHolding = (aircraftId, fixName, fixLat, fixLon, inboundTrack, turnDirection, legTime) => {
    setAircraft(prev => prev.map(plane => {
      if (plane.id === aircraftId) {
        // Initialize holding pattern using HoldingEngine
        const updatedPlane = HoldingEngine.initializeHolding(
          plane,
          fixName,
          fixLat,
          fixLon,
          inboundTrack,
          turnDirection,
          legTime
        );
        return updatedPlane;
      }
      return plane;
    }));
    setShowHoldingPanel(false);
  };

  const handleAssignOrbit = (aircraftId, direction) => {
    setAircraft(prev => prev.map(plane => {
      if (plane.id === aircraftId) {
        // Initialize orbit using OrbitEngine
        const updatedPlane = OrbitEngine.initializeOrbit(plane, direction);
        return updatedPlane;
      }
      return plane;
    }));
    setShowOrbitPanel(false);
  };

  const convertDrawingToRoute = () => {
    if (drawingPoints.length < 2) {
      console.log('Route too short, need at least 2 points');
      setDrawingPoints([]);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Sample points every ~50 pixels to create waypoints
    const waypoints = [];
    const SAMPLING_DISTANCE = 50;

    for (let i = 0; i < drawingPoints.length; i += Math.floor(drawingPoints.length / Math.max(2, Math.floor(drawingPoints.length * SAMPLING_DISTANCE / 1000)))) {
      const point = drawingPoints[i];

      // Convert canvas coordinates to lat/lon
      const latLon = CoordinateUtils.canvasToLatLon(
        point.x,
        point.y,
        canvasDimensions.width,
        canvasDimensions.height,
        ARP.lat,
        ARP.lon,
        zoom * BASE_SCALE,
        panOffset.x,
        panOffset.y
      );

      waypoints.push({
        lat: latLon.lat,
        lon: latLon.lon,
        name: `WP${waypoints.length + 1}`
      });
    }

    // Always include the last point
    if (drawingPoints.length > 1) {
      const lastPoint = drawingPoints[drawingPoints.length - 1];
      const lastLatLon = CoordinateUtils.canvasToLatLon(
        lastPoint.x,
        lastPoint.y,
        canvasDimensions.width,
        canvasDimensions.height,
        ARP.lat,
        ARP.lon,
        zoom * BASE_SCALE,
        panOffset.x,
        panOffset.y
      );

      if (waypoints.length === 0 ||
          waypoints[waypoints.length - 1].lat !== lastLatLon.lat ||
          waypoints[waypoints.length - 1].lon !== lastLatLon.lon) {
        waypoints.push({
          lat: lastLatLon.lat,
          lon: lastLatLon.lon,
          name: `WP${waypoints.length + 1}`
        });
      }
    }

    console.log('Generated route with waypoints:', waypoints);

    // Assign route to selected aircraft
    if (selectedAircraft) {
      setAircraft(prev => prev.map(plane => {
        if (plane.id === selectedAircraft) {
          return {
            ...plane,
            assignedRoute: waypoints.map(wp => wp.name),
            drawnRouteWaypoints: waypoints, // Store actual coordinates
            routeWaypointIndex: 0,
            navigationMode: 'ROUTE_NAV'
          };
        }
        return plane;
      }));
    }

    // Reset drawing state
    setDrawingPoints([]);
    setIsDrawingMode(false);
    setShowDrawingPanel(false);
  };

  const handleStartDrawing = () => {
    setIsDrawingMode(true);
    setDrawingPoints([]);
  };

  const handleCancelDrawing = () => {
    setIsDrawingMode(false);
    setDrawingPoints([]);
    setIsDrawing(false);
  };

  // Auto-detect screen dimensions on mount and window resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setCanvasDimensions({ width, height });
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Page refresh warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Refreshing the page will make you lose the current simulation scenario';
      return 'Refreshing the page will make you lose the current simulation scenario';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // METAR auto-update (fetch every 10 minutes)
  useEffect(() => {
    const fetchMetar = async () => {
      try {
        // Use CheckWX API (free tier with API key)
        const response = await fetch('https://api.checkwx.com/metar/LEZG/decoded', {
          headers: {
            'X-API-Key': '115b3f3bc2994f15b73ca3a0bfc059fa'
          }
        });
        const data = await response.json();
        if (data && data.data && data.data.length > 0 && data.data[0].raw_text) {
          setMetar(data.data[0].raw_text);
        } else {
          setMetar('METAR unavailable');
        }
      } catch (error) {
        console.error('Error fetching METAR:', error);
        setMetar('METAR fetch failed');
      }
    };

    // Fetch immediately on mount
    fetchMetar();

    // Then fetch every 10 minutes
    const interval = setInterval(fetchMetar, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Blink effect for aircraft being deleted
  useEffect(() => {
    if (!blinkingAircraftId) return;

    const interval = setInterval(() => {
      setBlinkState(prev => !prev);
    }, 300);

    return () => clearInterval(interval);
  }, [blinkingAircraftId]);

  // Game loop for aircraft movement (60 FPS)
  useEffect(() => {
    let lastTime = Date.now();
    let animationFrameId;

    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000; // Convert to seconds
      const adjustedDeltaTime = isPaused ? 0 : deltaTime * simulationSpeed; // Pause simulation when isPaused
      lastTime = now;

      // Update simulation time
      setSimulationTime(prev => prev + adjustedDeltaTime);

      // Process scheduled spawns
      setScheduledSpawns(prev => {
        const remainingSpawns = [];
        const currentSimTime = simulationTime + adjustedDeltaTime;

        prev.forEach(spawn => {
          if (spawn.spawnTime <= currentSimTime) {
            // Time to spawn this aircraft
            handleScheduledAirborneSpawn(
              spawn.callsign,
              spawn.type,
              spawn.flightLevel * 100, // Convert FL to feet
              spawn.waypoint,
              spawn.timeToWaypoint
            );
          } else {
            // Not ready yet, keep it
            remainingSpawns.push(spawn);
          }
        });

        return remainingSpawns;
      });

      // Update all aircraft positions and states
      setAircraft(prev => {
        const updatedAircraft = prev.map(plane =>
          MovementEngine.updateAircraft(plane, adjustedDeltaTime, activeDelta, prev)
        );

        // Find formation leaders that have landed
        const landedLeaderIds = updatedAircraft
          .filter(plane => plane.landed && plane.formationLeader && plane.isFormationMember)
          .map(plane => plane.formationLeaderId);

        // Remove aircraft that have landed or should be deleted (visual approach)
        // Also remove all formation members if their leader has landed
        return updatedAircraft.filter(plane => {
          if (plane.landed || plane.shouldDelete) return false;
          if (plane.isFormationMember && !plane.formationLeader && landedLeaderIds.includes(plane.formationLeaderId)) {
            console.log(`${plane.callsign}: Removed because formation leader has landed`);
            return false;
          }
          return true;
        });
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPaused, simulationSpeed, simulationTime, scheduledSpawns, activeDelta, handleScheduledAirborneSpawn]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvasDimensions.width;
    const height = canvasDimensions.height;
    const scale = BASE_SCALE * zoom;
    const centerX = width / 2 + panOffset.x;
    const centerY = height / 2 + panOffset.y;

    // Update measurement origin if it's an aircraft
    if (measurementActive && measurementOrigin && measurementOrigin.type === 'aircraft') {
      const originAircraft = aircraft.find(p => p.id === measurementOrigin.aircraftId);
      if (originAircraft) {
        setMeasurementOrigin(prev => ({
          ...prev,
          lat: originAircraft.position.lat,
          lon: originAircraft.position.lon
        }));
      } else {
        // Aircraft was deleted, deactivate tool
        setMeasurementActive(false);
        setMeasurementOrigin(null);
        setCurrentMousePos(null);
      }
    }

    // Update anchored measurements with aircraft origins
    const updatedAnchors = anchoredMeasurements.map(measurement => {
      if (measurement.origin.type === 'aircraft') {
        const originAircraft = aircraft.find(p => p.id === measurement.origin.aircraftId);
        if (originAircraft) {
          return {
            ...measurement,
            origin: {
              ...measurement.origin,
              lat: originAircraft.position.lat,
              lon: originAircraft.position.lon
            }
          };
        } else {
          // Mark for deletion (aircraft no longer exists)
          return null;
        }
      }
      return measurement;
    }).filter(m => m !== null); // Remove null entries (deleted aircraft)

    // Update state if any changes
    if (updatedAnchors.length !== anchoredMeasurements.length ||
        updatedAnchors.some((m, i) => m !== anchoredMeasurements[i])) {
      setAnchoredMeasurements(updatedAnchors);
    }

    CanvasRenderer.drawBackground(ctx, width, height);
    CanvasRenderer.drawRangeRings(ctx, centerX, centerY, scale);
    CanvasRenderer.drawCardinalDirections(ctx, centerX, centerY, scale);
    CanvasRenderer.drawTMAHexagon(ctx, width, height, scale, panOffset.x, panOffset.y);
    CanvasRenderer.drawDeltas(ctx, width, height, scale, panOffset.x, panOffset.y, activeDelta);

    if (showATZ) CanvasRenderer.drawATZ(ctx, centerX, centerY, scale);
    if (showCTR) CanvasRenderer.drawCTR(ctx, width, height, centerX, centerY, scale, panOffset.x, panOffset.y);
    if (showCorridor) CanvasRenderer.drawCorridor(ctx, width, height, scale, panOffset.x, panOffset.y);

    CanvasRenderer.drawRunways(ctx, width, height, scale, panOffset.x, panOffset.y, zoom);
    CanvasRenderer.drawARP(ctx, centerX, centerY);
    CanvasRenderer.drawVisualPoints(ctx, width, height, scale, panOffset.x, panOffset.y, showVisual);
    CanvasRenderer.drawInstrumentalPoints(ctx, width, height, scale, panOffset.x, panOffset.y, showInstrumental);
    CanvasRenderer.drawSIDs(ctx, width, height, scale, panOffset.x, panOffset.y, showSIDsRunway30, showSIDsRunway12, showMilitaryDepartures);

    // Draw holding patterns if enabled
    if (showHoldings) {
      CanvasRenderer.drawHoldingPatterns(ctx, width, height, scale, panOffset.x, panOffset.y, aircraft);
    }

    CanvasRenderer.drawAircraft(ctx, width, height, scale, panOffset.x, panOffset.y, aircraft, selectedAircraft, blinkingAircraftId, blinkState);

    // Draw the route being drawn
    if (isDrawingMode && drawingPoints.length > 0) {
      CanvasRenderer.drawDrawingRoute(ctx, drawingPoints);
    }

    // Draw anchored measurements
    anchoredMeasurements.forEach(measurement => {
      let aircraftData = null;
      if (measurement.origin.type === 'aircraft') {
        const originAircraft = aircraft.find(p => p.id === measurement.origin.aircraftId);
        aircraftData = originAircraft;
      }

      // Convert target lat/lon to canvas coordinates with current zoom/pan
      const targetCanvas = CoordinateUtils.latLonToCanvas(
        measurement.targetLat,
        measurement.targetLon,
        width,
        height,
        ARP.lat,
        ARP.lon,
        scale,
        panOffset.x,
        panOffset.y
      );

      const boxBounds = CanvasRenderer.drawMeasurementTool(
        ctx,
        measurement.origin,
        targetCanvas,
        width,
        height,
        scale,
        panOffset.x,
        panOffset.y,
        aircraftData,
        true // isAnchored
      );

      // Update info box bounds for click detection
      if (boxBounds) {
        measurement.infoBoxBounds = boxBounds;
      }
    });

    // Draw active measurement tool
    if (measurementActive && measurementOrigin && currentMousePos) {
      let aircraftData = null;
      if (measurementOrigin.type === 'aircraft') {
        const originAircraft = aircraft.find(p => p.id === measurementOrigin.aircraftId);
        aircraftData = originAircraft;
      }

      // Convert target lat/lon to canvas coordinates with current zoom/pan
      const targetCanvas = CoordinateUtils.latLonToCanvas(
        currentMousePos.lat,
        currentMousePos.lon,
        width,
        height,
        ARP.lat,
        ARP.lon,
        scale,
        panOffset.x,
        panOffset.y
      );

      CanvasRenderer.drawMeasurementTool(
        ctx,
        measurementOrigin,
        targetCanvas,
        width,
        height,
        scale,
        panOffset.x,
        panOffset.y,
        aircraftData,
        false // isAnchored
      );
    }

  }, [showATZ, showCTR, showCorridor, showVisual, showInstrumental, showSIDsRunway30, showSIDsRunway12, showMilitaryDepartures, showHoldings, activeDelta, zoom, panOffset, aircraft, selectedAircraft, canvasDimensions, blinkingAircraftId, blinkState, isDrawingMode, drawingPoints, measurementActive, measurementOrigin, currentMousePos, anchoredMeasurements]);

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col overflow-hidden">
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={canvasDimensions.width}
          height={canvasDimensions.height}
          className="block cursor-default"
          style={{ width: '100%', height: '100%' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onContextMenu={handleContextMenu}
          onClick={handleCanvasClick}
        />

        {/* Aircraft List Panel with integrated Clock */}
        <div className="absolute top-4 left-4 z-10">
          <AircraftListPanel
            aircraft={aircraft}
            selectedAircraft={selectedAircraft}
            onSelectAircraft={setSelectedAircraft}
            simulationTime={simulationTime}
          />
        </div>

        {/* METAR Display */}
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-gray-900 bg-opacity-40 backdrop-blur-sm border border-gray-700 border-opacity-30 rounded px-3 py-1.5 font-mono text-xs text-gray-400">
            {metar}
          </div>
        </div>

        {showSpawnPanel && (
          <SpawnPanel
            onSpawnAircraft={handleSpawnAircraft}
            onClose={() => setShowSpawnPanel(false)}
          />
        )}

        {showAirborneSpawnPanel && (
          <AirborneSpawnPanel
            onSpawnAirborne={handleSpawnAirborne}
            onClose={() => setShowAirborneSpawnPanel(false)}
          />
        )}

        {showDeletePanel && (
          <DeletePlanePanel
            selectedAircraft={selectedAircraft}
            aircraft={aircraft}
            onDeleteAircraft={handleDeleteAircraft}
            onClose={() => setShowDeletePanel(false)}
          />
        )}

        {showAssignSIDPanel && (
          <AssignSIDPanel
            selectedAircraft={selectedAircraft}
            aircraft={aircraft}
            onAssignSID={handleAssignSID}
            onClose={() => setShowAssignSIDPanel(false)}
          />
        )}

        {showHeadingPanel && (
          <HeadingCommandPanel
            selectedAircraft={selectedAircraft}
            aircraft={aircraft}
            onAssignHeading={handleAssignHeading}
            onClose={() => setShowHeadingPanel(false)}
          />
        )}

        {showAltitudePanel && (
          <AltitudeCommandPanel
            selectedAircraft={selectedAircraft}
            aircraft={aircraft}
            onAssignAltitude={handleAssignAltitude}
            onClose={() => setShowAltitudePanel(false)}
          />
        )}

        {showSpeedPanel && (
          <SpeedCommandPanel
            selectedAircraft={selectedAircraft}
            aircraft={aircraft}
            onAssignSpeed={handleAssignSpeed}
            onClose={() => setShowSpeedPanel(false)}
          />
        )}

        {showRoutePanel && (
          <RouteCommandPanel
            selectedAircraft={selectedAircraft}
            aircraft={aircraft}
            onAssignRoute={handleAssignRoute}
            onClose={() => setShowRoutePanel(false)}
          />
        )}

        {showDrawingPanel && (
          <RouteDrawingPanel
            selectedAircraft={selectedAircraft}
            aircraft={aircraft}
            isDrawingMode={isDrawingMode}
            onStartDrawing={handleStartDrawing}
            onCancelDrawing={handleCancelDrawing}
            onClose={() => {
              setShowDrawingPanel(false);
              handleCancelDrawing();
            }}
          />
        )}

        {showILSPanel && (
          <ILSAssignPanel
            selectedAircraft={selectedAircraft}
            aircraft={aircraft}
            onAssignILS={handleAssignILS}
            onClose={() => setShowILSPanel(false)}
          />
        )}

        {showVORPanel && (
          <VORAssignPanel
            selectedAircraft={selectedAircraft}
            aircraft={aircraft}
            onAssignVOR={handleAssignVOR}
            onClose={() => setShowVORPanel(false)}
          />
        )}

        {showVisualPanel && (
          <VisualAssignPanel
            selectedAircraft={selectedAircraft}
            aircraft={aircraft}
            onAssignVisual={handleAssignVisual}
            onClose={() => setShowVisualPanel(false)}
          />
        )}

        {showHoldingPanel && (
          <HoldingPanel
            selectedAircraft={selectedAircraft}
            aircraft={aircraft}
            onAssignHolding={handleAssignHolding}
            onClose={() => setShowHoldingPanel(false)}
          />
        )}

        {showOrbitPanel && (
          <OrbitPanel
            selectedAircraft={selectedAircraft}
            aircraft={aircraft}
            onAssignOrbit={handleAssignOrbit}
            onClose={() => setShowOrbitPanel(false)}
          />
        )}

        {showScenarioPanel && (
          <ScenarioLoadPanel
            onLoadScenario={handleLoadScenario}
            onClose={() => setShowScenarioPanel(false)}
          />
        )}
      </div>

      <ControlPanel
        showATZ={showATZ}
        setShowATZ={setShowATZ}
        showCTR={showCTR}
        setShowCTR={setShowCTR}
        showCorridor={showCorridor}
        setShowCorridor={setShowCorridor}
        showVisual={showVisual}
        setShowVisual={setShowVisual}
        showInstrumental={showInstrumental}
        setShowInstrumental={setShowInstrumental}
        showSIDsRunway30={showSIDsRunway30}
        setShowSIDsRunway30={setShowSIDsRunway30}
        showSIDsRunway12={showSIDsRunway12}
        setShowSIDsRunway12={setShowSIDsRunway12}
        showMilitaryDepartures={showMilitaryDepartures}
        setShowMilitaryDepartures={setShowMilitaryDepartures}
        activeDelta={activeDelta}
        setActiveDelta={setActiveDelta}
        zoom={zoom}
        simulationSpeed={simulationSpeed}
        setSimulationSpeed={setSimulationSpeed}
        onResetView={resetView}
        onOpenSpawnPanel={() => setShowSpawnPanel(true)}
        onOpenAirborneSpawnPanel={() => setShowAirborneSpawnPanel(true)}
        selectedAircraft={selectedAircraft}
        aircraft={aircraft}
        onOpenDeletePanel={() => setShowDeletePanel(true)}
        onTakeoffCommand={handleTakeoffCommand}
        onOpenAssignSIDPanel={() => setShowAssignSIDPanel(true)}
        onOpenHeadingPanel={() => setShowHeadingPanel(true)}
        onOpenAltitudePanel={() => setShowAltitudePanel(true)}
        onOpenSpeedPanel={() => setShowSpeedPanel(true)}
        onOpenRoutePanel={() => setShowRoutePanel(true)}
        onEnableRandomAutopilot={handleEnableRandomAutopilot}
        onSplitFromFormation={handleSplitFromFormation}
        onOpenDrawingPanel={() => setShowDrawingPanel(true)}
        onOpenILSPanel={() => setShowILSPanel(true)}
        onOpenVORPanel={() => setShowVORPanel(true)}
        onOpenVisualPanel={() => setShowVisualPanel(true)}
        onOpenHoldingPanel={() => setShowHoldingPanel(true)}
        onOpenOrbitPanel={() => setShowOrbitPanel(true)}
        onOpenScenarioPanel={() => setShowScenarioPanel(true)}
        showHoldings={showHoldings}
        setShowHoldings={setShowHoldings}
        isPaused={isPaused}
        setIsPaused={setIsPaused}
      />
    </div>
  );
};

export default ZaragozaTMASimulator;