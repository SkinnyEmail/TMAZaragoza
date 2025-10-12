import { useState } from 'react';
import { getAllWaypointNames, validateRoute } from './waypointDatabase';

const RouteCommandPanel = ({ selectedAircraft, aircraft, onAssignRoute, onClose }) => {
  const [routeString, setRouteString] = useState('');
  const [error, setError] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filteredWaypoints, setFilteredWaypoints] = useState([]);

  const selectedPlane = aircraft.find(p => p.id === selectedAircraft);
  const allWaypoints = getAllWaypointNames();

  const handleInputChange = (e) => {
    const value = e.target.value;
    setRouteString(value);
    setError('');

    // Get current waypoint being typed (after last comma)
    const parts = value.split(',');
    const currentInput = parts[parts.length - 1].trim().toUpperCase();

    if (currentInput.length > 0) {
      const matches = allWaypoints.filter(wp =>
        wp.startsWith(currentInput)
      ).slice(0, 10); // Limit to 10 suggestions

      setFilteredWaypoints(matches);
      setShowAutocomplete(matches.length > 0);
    } else {
      setShowAutocomplete(false);
    }
  };

  const handleAutocompleteSelect = (waypoint) => {
    const parts = routeString.split(',');
    parts[parts.length - 1] = waypoint;
    setRouteString(parts.join(', ') + ', ');
    setShowAutocomplete(false);
    setError('');
  };

  const handleSubmit = () => {
    setError('');

    if (!routeString || routeString.trim() === '') {
      setError('Please enter a route');
      return;
    }

    // Validate the route
    const validation = validateRoute(routeString);

    if (!validation.valid) {
      setError(validation.errors.join('; '));
      return;
    }

    // Extract waypoint names from validated route
    const waypointNames = validation.waypoints.map(wp => wp.name);

    onAssignRoute(selectedAircraft, waypointNames);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !showAutocomplete) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      if (showAutocomplete) {
        setShowAutocomplete(false);
      } else {
        onClose();
      }
    } else if (e.key === 'ArrowDown' && showAutocomplete && filteredWaypoints.length > 0) {
      e.preventDefault();
      // Could add keyboard navigation through suggestions here
    }
  };

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 bg-gray-800 border-2 border-gray-600 rounded-lg shadow-2xl p-6 w-80 z-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white font-bold text-lg font-mono">Assign Route</h2>
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
            Current Mode: <span className="text-white font-bold">{selectedPlane.navigationMode}</span>
          </p>
          {selectedPlane.assignedRoute && selectedPlane.assignedRoute.length > 0 && (
            <p className="text-gray-300 font-mono text-sm">
              Current Route: <span className="text-white font-bold">{selectedPlane.assignedRoute.join(' → ')}</span>
            </p>
          )}
        </div>
      )}

      <div className="mb-4 relative">
        <label className="block text-gray-300 font-mono text-sm mb-2">
          Route (comma-separated waypoints):
        </label>
        <input
          type="text"
          value={routeString}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={() => setShowAutocomplete(filteredWaypoints.length > 0)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded font-mono border border-gray-600 focus:border-blue-500 focus:outline-none uppercase"
          placeholder="e.g., ZRZ, FESTA, ALEPO"
          autoFocus
          autoComplete="off"
        />

        {/* Autocomplete dropdown */}
        {showAutocomplete && filteredWaypoints.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded shadow-lg max-h-48 overflow-y-auto z-50">
            {filteredWaypoints.map(wp => (
              <button
                key={wp}
                onClick={() => handleAutocompleteSelect(wp)}
                className="w-full px-3 py-2 text-left text-white hover:bg-gray-600 font-mono text-sm"
              >
                {wp}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm font-mono mt-2">{error}</p>
        )}
      </div>

      {/* Available waypoints info */}
      <div className="mb-4 p-3 bg-gray-700 rounded">
        <p className="text-gray-400 text-xs font-mono">
          Available waypoints ({allWaypoints.length}): Type to see suggestions
        </p>
        <div className="mt-2 max-h-24 overflow-y-auto">
          <p className="text-gray-500 text-xs font-mono">
            {allWaypoints.join(', ')}
          </p>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-mono text-sm"
      >
        Assign Route
      </button>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-gray-400 text-xs font-mono">
          Tip: Separate waypoints with commas. Aircraft will fly direct to each waypoint in sequence.
        </p>
      </div>
    </div>
  );
};

export default RouteCommandPanel;
