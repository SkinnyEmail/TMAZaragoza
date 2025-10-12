import React, { useState } from 'react';
import { VISUAL_POINTS, INSTRUMENTAL_POINTS } from './constants';

const AirborneSpawnPanel = ({ onSpawnAirborne, onClose }) => {
  const [callsign, setCallsign] = useState('');
  const [aircraftType, setAircraftType] = useState('IFR');
  const [formationSize, setFormationSize] = useState(1);
  const [waypoint, setWaypoint] = useState('');
  const [timeToWaypoint, setTimeToWaypoint] = useState('');
  const [flightLevel, setFlightLevel] = useState('');
  const [waypointSuggestions, setWaypointSuggestions] = useState([]);

  // Merge all waypoints for autocomplete
  const allWaypoints = { ...VISUAL_POINTS, ...INSTRUMENTAL_POINTS };
  const waypointNames = Object.keys(allWaypoints);

  const handleWaypointChange = (input) => {
    const upperInput = input.toUpperCase();
    setWaypoint(upperInput);

    if (upperInput.length > 0) {
      const matches = waypointNames.filter(name =>
        name.startsWith(upperInput)
      );
      setWaypointSuggestions(matches);
    } else {
      setWaypointSuggestions([]);
    }
  };

  const handleWaypointSelect = (selectedWaypoint) => {
    setWaypoint(selectedWaypoint);
    setWaypointSuggestions([]);
  };

  const handleSpawn = () => {
    // Validation
    if (!callsign.trim()) {
      alert('Please enter a callsign');
      return;
    }

    if (!waypoint.trim()) {
      alert('Please enter a waypoint');
      return;
    }

    if (!allWaypoints[waypoint]) {
      alert(`Waypoint "${waypoint}" not found. Please select a valid waypoint.`);
      return;
    }

    const time = parseInt(timeToWaypoint);
    if (!time || time < 1 || time > 20) {
      alert('Time to waypoint must be between 1 and 20 minutes');
      return;
    }

    const fl = parseInt(flightLevel);
    if (!fl || fl < 10 || fl > 600) {
      alert('Flight level must be between 10 and 600');
      return;
    }

    // Call spawn handler
    onSpawnAirborne({
      callsign: callsign.trim().toUpperCase(),
      type: aircraftType,
      formationSize: parseInt(formationSize),
      waypoint: waypoint,
      timeMinutes: time,
      flightLevel: fl
    });

    // Reset form
    setCallsign('');
    setWaypoint('');
    setTimeToWaypoint('');
    setFlightLevel('');
    setFormationSize(1);
    setWaypointSuggestions([]);
  };

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 bg-gray-800 border-2 border-gray-600 rounded-lg shadow-2xl p-6 w-80 z-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white font-bold text-lg font-mono">Spawn Airborne</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xl font-bold"
        >
          ×
        </button>
      </div>

      <div className="space-y-4">
        {/* Callsign */}
        <div>
          <label className="block text-gray-300 text-sm font-mono mb-1">Callsign:</label>
          <input
            type="text"
            value={callsign}
            onChange={(e) => setCallsign(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded font-mono"
            placeholder="e.g., IBE123"
            maxLength={10}
          />
        </div>

        {/* Aircraft Type */}
        <div>
          <label className="block text-gray-300 text-sm font-mono mb-1">Aircraft Type:</label>
          <div className="space-y-2">
            {['VFR', 'IFR', 'Military'].map(type => (
              <label key={type} className="flex items-center text-gray-300 font-mono cursor-pointer">
                <input
                  type="radio"
                  name="aircraftType"
                  value={type}
                  checked={aircraftType === type}
                  onChange={(e) => setAircraftType(e.target.value)}
                  className="mr-2"
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        {/* Formation Size */}
        <div>
          <label className="block text-gray-300 text-sm font-mono mb-1">Formation Size:</label>
          <select
            value={formationSize}
            onChange={(e) => setFormationSize(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded font-mono"
          >
            <option value="1">1 (Single)</option>
            <option value="2">2 Aircraft</option>
            <option value="3">3 Aircraft</option>
            <option value="4">4 Aircraft</option>
          </select>
        </div>

        {/* Inbound Waypoint (with autocomplete) */}
        <div className="relative">
          <label className="block text-gray-300 text-sm font-mono mb-1">Inbound Waypoint:</label>
          <input
            type="text"
            value={waypoint}
            onChange={(e) => handleWaypointChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded font-mono uppercase"
            placeholder="e.g., ALEPO"
          />

          {/* Autocomplete suggestions */}
          {waypointSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded shadow-lg max-h-40 overflow-y-auto">
              {waypointSuggestions.map(wp => (
                <div
                  key={wp}
                  onClick={() => handleWaypointSelect(wp)}
                  className="px-3 py-2 text-white font-mono text-sm hover:bg-gray-600 cursor-pointer"
                >
                  {wp}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Time to Waypoint */}
        <div>
          <label className="block text-gray-300 text-sm font-mono mb-1">Time to Waypoint (minutes):</label>
          <input
            type="number"
            value={timeToWaypoint}
            onChange={(e) => setTimeToWaypoint(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded font-mono"
            placeholder="e.g., 4"
            min="1"
            max="20"
          />
          <div className="mt-1 text-xs text-gray-400 font-mono">
            Range: 1-20 minutes
          </div>
        </div>

        {/* Flight Level */}
        <div>
          <label className="block text-gray-300 text-sm font-mono mb-1">Flight Level:</label>
          <input
            type="number"
            value={flightLevel}
            onChange={(e) => setFlightLevel(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded font-mono"
            placeholder="e.g., 240"
            min="10"
            max="600"
          />
          <div className="mt-1 text-xs text-gray-400 font-mono">
            {flightLevel ? `FL${flightLevel} = ${parseInt(flightLevel) * 100} ft` : 'e.g., 240 = 24000 ft'}
          </div>
        </div>

        {/* Available Waypoints Info */}
        <div className="text-xs text-gray-400 font-mono bg-gray-900 p-2 rounded">
          <div className="font-bold text-gray-300 mb-1">Available Waypoints:</div>
          <div className="max-h-20 overflow-y-auto">
            {waypointNames.sort().join(', ')}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-mono text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSpawn}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-mono text-sm"
          >
            Spawn
          </button>
        </div>
      </div>
    </div>
  );
};

export default AirborneSpawnPanel;
