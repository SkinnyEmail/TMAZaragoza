import { useState } from 'react';
import { AIRCRAFT_PERFORMANCE } from './aircraftPerformance';

const SpeedCommandPanel = ({ selectedAircraft, aircraft, onAssignSpeed, onClose }) => {
  const [speed, setSpeed] = useState('');
  const [error, setError] = useState('');

  const selectedPlane = aircraft.find(p => p.id === selectedAircraft);
  const performance = selectedPlane ? AIRCRAFT_PERFORMANCE[selectedPlane.type] : null;

  const handleSubmit = () => {
    setError('');

    // Validate speed input
    const speedNum = parseInt(speed, 10);

    if (isNaN(speedNum)) {
      setError('Please enter a valid speed');
      return;
    }

    if (speedNum < 0) {
      setError('Speed cannot be negative');
      return;
    }

    if (performance && speedNum > performance.maxSpeed) {
      setError(`Speed cannot exceed ${performance.maxSpeed} kts for ${selectedPlane.type} aircraft`);
      return;
    }

    // Minimum reasonable speed (stall warning)
    if (speedNum < 60 && speedNum > 0) {
      setError('Warning: Speed below 60 kts may be too slow for controlled flight.');
      // Allow but warn
    }

    onAssignSpeed(selectedAircraft, speedNum);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 bg-gray-800 border-2 border-gray-600 rounded-lg shadow-2xl p-6 w-80 z-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white font-bold text-lg font-mono">Assign Speed</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xl font-bold"
        >
          ×
        </button>
      </div>

      {selectedPlane && performance && (
        <div className="mb-4 p-3 bg-gray-700 rounded">
          <p className="text-gray-300 font-mono text-sm">
            Aircraft: <span className="text-white font-bold">{selectedPlane.callsign}</span>
          </p>
          <p className="text-gray-300 font-mono text-sm">
            Current Speed: <span className="text-white font-bold">{Math.round(selectedPlane.speed)} kts</span>
          </p>
          <p className="text-gray-300 font-mono text-sm">
            Max Speed: <span className="text-white font-bold">{performance.maxSpeed} kts</span>
          </p>
          <p className="text-gray-300 font-mono text-sm">
            Cruise Speed: <span className="text-white font-bold">{performance.cruiseSpeed} kts</span>
          </p>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-gray-300 font-mono text-sm mb-2">
          Speed (knots):
        </label>
        <input
          type="number"
          min="0"
          max={performance?.maxSpeed || 600}
          step="10"
          value={speed}
          onChange={(e) => setSpeed(e.target.value)}
          onKeyDown={handleKeyPress}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded font-mono border border-gray-600 focus:border-blue-500 focus:outline-none"
          placeholder="Enter speed (e.g., 250)"
          autoFocus
        />
        {error && (
          <p className="text-red-400 text-sm font-mono mt-2">{error}</p>
        )}
      </div>

      <button
        onClick={handleSubmit}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-mono text-sm"
      >
        Assign Speed
      </button>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-gray-400 text-xs font-mono">
          Tip: Aircraft will gradually accelerate or decelerate to the assigned speed.
        </p>
      </div>
    </div>
  );
};

export default SpeedCommandPanel;
