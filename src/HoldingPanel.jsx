import { useState } from 'react';
import { VISUAL_POINTS, INSTRUMENTAL_POINTS } from './constants';
import { GeometryUtils } from './geometryUtils';
import { CoordinateUtils } from './utils';
import { ARP } from './constants';

const HoldingPanel = ({ selectedAircraft, aircraft, onAssignHolding, onClose }) => {
  const [fixName, setFixName] = useState('');
  const [inboundTrack, setInboundTrack] = useState('');
  const [turnDirection, setTurnDirection] = useState('RIGHT');
  const [legTime, setLegTime] = useState('');
  const [error, setError] = useState('');

  const selectedPlane = aircraft.find(p => p.id === selectedAircraft);

  const handleSubmit = () => {
    setError('');

    // Validate inputs
    let fixLat, fixLon;
    let finalFixName = null;

    // Check if fix name is provided
    if (fixName.trim() !== '') {
      // Validate waypoint exists
      const allWaypoints = { ...VISUAL_POINTS, ...INSTRUMENTAL_POINTS };
      const waypointData = allWaypoints[fixName.trim()];

      if (!waypointData) {
        setError(`Waypoint "${fixName}" not found. Check spelling or leave blank for present position.`);
        return;
      }

      // Calculate fix coordinates
      const fixCoords = CoordinateUtils.radialDistanceToLatLon(
        ARP.lat,
        ARP.lon,
        waypointData.radial,
        waypointData.distance
      );

      fixLat = fixCoords.lat;
      fixLon = fixCoords.lon;
      finalFixName = fixName.trim();
    } else {
      // Hold at present position
      fixLat = selectedPlane.position.lat;
      fixLon = selectedPlane.position.lon;
      finalFixName = null;
    }

    // Validate inbound track
    let finalInboundTrack;
    if (inboundTrack.trim() !== '') {
      const trackNum = parseInt(inboundTrack, 10);
      if (isNaN(trackNum) || trackNum < 0 || trackNum > 360) {
        setError('Inbound track must be between 0 and 360');
        return;
      }
      finalInboundTrack = trackNum % 360;
    } else {
      // Calculate bearing from current position to fix
      finalInboundTrack = GeometryUtils.calculateBearing(
        selectedPlane.position.lat,
        selectedPlane.position.lon,
        fixLat,
        fixLon
      );
    }

    // Validate leg time
    let finalLegTime;
    if (legTime.trim() !== '') {
      const legTimeNum = parseFloat(legTime);
      if (isNaN(legTimeNum) || legTimeNum <= 0 || legTimeNum > 5) {
        setError('Leg time must be between 0 and 5 minutes');
        return;
      }
      finalLegTime = legTimeNum;
    } else {
      finalLegTime = 1.0; // Default 1 minute
    }

    // Submit holding pattern
    onAssignHolding(
      selectedAircraft,
      finalFixName,
      fixLat,
      fixLon,
      finalInboundTrack,
      turnDirection,
      finalLegTime
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 bg-gray-800 border-2 border-gray-600 rounded-lg shadow-2xl p-6 w-96 z-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white font-bold text-lg font-mono">Assign Holding Pattern</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xl font-bold"
        >
          ×
        </button>
      </div>

      {selectedPlane && (
        <div className="mb-4 p-3 bg-gray-700 rounded">
          <p className="text-gray-300 font-mono text-sm">
            Aircraft: <span className="text-white font-bold">{selectedPlane.callsign}</span>
          </p>
          <p className="text-gray-300 font-mono text-sm">
            Current Position: <span className="text-white font-bold">
              {selectedPlane.position.lat.toFixed(4)}°, {selectedPlane.position.lon.toFixed(4)}°
            </span>
          </p>
          <p className="text-gray-300 font-mono text-sm">
            Assigned Altitude: <span className="text-white font-bold">{Math.round(selectedPlane.assignedAltitude)} ft</span>
          </p>
        </div>
      )}

      {/* Fix Name */}
      <div className="mb-4">
        <label className="block text-gray-300 font-mono text-sm mb-2">
          Waypoint/Fix Name (optional):
        </label>
        <input
          type="text"
          value={fixName}
          onChange={(e) => setFixName(e.target.value.toUpperCase())}
          onKeyDown={handleKeyPress}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded font-mono border border-gray-600 focus:border-blue-500 focus:outline-none uppercase"
          placeholder="e.g., KEKAG (blank = present position)"
          autoFocus
        />
        <p className="text-gray-400 text-xs font-mono mt-1">
          Leave blank to hold at present position
        </p>
      </div>

      {/* Inbound Track */}
      <div className="mb-4">
        <label className="block text-gray-300 font-mono text-sm mb-2">
          Inbound Track (0-360°, optional):
        </label>
        <input
          type="number"
          min="0"
          max="360"
          step="1"
          value={inboundTrack}
          onChange={(e) => setInboundTrack(e.target.value)}
          onKeyDown={handleKeyPress}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded font-mono border border-gray-600 focus:border-blue-500 focus:outline-none"
          placeholder="Auto-calculated if blank"
        />
      </div>

      {/* Turn Direction */}
      <div className="mb-4">
        <label className="block text-gray-300 font-mono text-sm mb-2">
          Turn Direction:
        </label>
        <div className="flex gap-4">
          <label className="flex items-center text-white font-mono text-sm">
            <input
              type="radio"
              value="RIGHT"
              checked={turnDirection === 'RIGHT'}
              onChange={(e) => setTurnDirection(e.target.value)}
              className="mr-2"
            />
            Right (Standard)
          </label>
          <label className="flex items-center text-white font-mono text-sm">
            <input
              type="radio"
              value="LEFT"
              checked={turnDirection === 'LEFT'}
              onChange={(e) => setTurnDirection(e.target.value)}
              className="mr-2"
            />
            Left (Non-standard)
          </label>
        </div>
      </div>

      {/* Leg Time */}
      <div className="mb-4">
        <label className="block text-gray-300 font-mono text-sm mb-2">
          Leg Time (minutes, optional):
        </label>
        <input
          type="number"
          min="0.5"
          max="5"
          step="0.5"
          value={legTime}
          onChange={(e) => setLegTime(e.target.value)}
          onKeyDown={handleKeyPress}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded font-mono border border-gray-600 focus:border-blue-500 focus:outline-none"
          placeholder="Default: 1 minute"
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm font-mono mb-4">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-mono text-sm"
      >
        Assign Holding Pattern
      </button>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-gray-400 text-xs font-mono">
          Aircraft will fly racetrack pattern at specified fix until given new clearance. Use Climb/Descend to Altitude command to change altitude while holding.
        </p>
      </div>
    </div>
  );
};

export default HoldingPanel;
