import { useState } from 'react';
import { AIRCRAFT_STATES } from './aircraftStates';

const AltitudeCommandPanel = ({ selectedAircraft, aircraft, onAssignAltitude, onClose }) => {
  const [flightLevel, setFlightLevel] = useState('');
  const [error, setError] = useState('');

  const selectedPlane = aircraft.find(p => p.id === selectedAircraft);

  const handleSubmit = () => {
    setError('');

    // Validate flight level input
    const flNum = parseInt(flightLevel, 10);

    if (isNaN(flNum)) {
      setError('Please enter a valid flight level');
      return;
    }

    if (flNum < 0) {
      setError('Flight level cannot be negative');
      return;
    }

    if (flNum > 500) {
      setError('Flight level cannot exceed 500 (50000 ft)');
      return;
    }

    // Convert flight level to feet (FL130 = 13000 ft)
    const altitudeFeet = flNum * 100;

    // Check minimum altitude constraints (e.g., 2000 ft minimum in CTR)
    if (altitudeFeet < 2000 && altitudeFeet > 0) {
      setError('Warning: Minimum safe altitude in CTR is 2000 ft (FL020). Proceed with caution.');
      // Allow but warn
    }

    // Check if aircraft is airborne
    if (selectedPlane.state === AIRCRAFT_STATES.PARKED || selectedPlane.state === AIRCRAFT_STATES.TAKEOFF_ROLL) {
      setError('Aircraft must be airborne to change altitude');
      return;
    }

    onAssignAltitude(selectedAircraft, altitudeFeet);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Quick flight level buttons: 50, 70, 100, 150, 240 (5000ft, 7000ft, 10000ft, 15000ft, 24000ft)
  const quickFlightLevels = [50, 70, 100, 150, 240];

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 bg-gray-800 border-2 border-gray-600 rounded-lg shadow-2xl p-6 w-80 z-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white font-bold text-lg font-mono">Assign Altitude</h2>
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
            Current: <span className="text-white font-bold">FL{Math.round(selectedPlane.altitude / 100)}</span> ({Math.round(selectedPlane.altitude)} ft)
          </p>
          <p className="text-gray-300 font-mono text-sm">
            Assigned: <span className="text-white font-bold">FL{Math.round(selectedPlane.assignedAltitude / 100)}</span> ({Math.round(selectedPlane.assignedAltitude)} ft)
          </p>
          <p className="text-gray-300 font-mono text-sm">
            State: <span className="text-white font-bold">{selectedPlane.state}</span>
          </p>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-gray-300 font-mono text-sm mb-2">
          Flight Level (e.g., 130 = 13000 ft):
        </label>
        <input
          type="number"
          min="0"
          max="500"
          step="10"
          value={flightLevel}
          onChange={(e) => setFlightLevel(e.target.value)}
          onKeyDown={handleKeyPress}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded font-mono border border-gray-600 focus:border-blue-500 focus:outline-none"
          placeholder="Enter FL (e.g., 130)"
          autoFocus
        />
        {error && (
          <p className="text-red-400 text-sm font-mono mt-2">{error}</p>
        )}
      </div>

      {/* Quick flight level buttons */}
      <div className="mb-4">
        <p className="text-gray-400 text-xs font-mono mb-2">Quick select:</p>
        <div className="grid grid-cols-5 gap-2">
          {quickFlightLevels.map(fl => (
            <button
              key={fl}
              onClick={() => setFlightLevel(fl.toString())}
              className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded font-mono text-xs"
            >
              {fl}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-mono text-sm"
      >
        Assign Altitude
      </button>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-gray-400 text-xs font-mono">
          Tip: Aircraft will climb or descend to the assigned flight level. Minimum safe FL in CTR: FL020 (2000 ft).
        </p>
      </div>
    </div>
  );
};

export default AltitudeCommandPanel;
