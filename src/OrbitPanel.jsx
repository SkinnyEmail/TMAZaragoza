import { useState } from 'react';

const OrbitPanel = ({ selectedAircraft, aircraft, onAssignOrbit, onClose }) => {
  const [direction, setDirection] = useState('RIGHT');

  const selectedPlane = aircraft.find(p => p.id === selectedAircraft);

  const handleSubmit = () => {
    onAssignOrbit(selectedAircraft, direction);
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
        <h2 className="text-white font-bold text-lg font-mono">Assign Orbit</h2>
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
            Current Heading: <span className="text-white font-bold">{Math.round(selectedPlane.heading)}°</span>
          </p>
          <p className="text-gray-300 font-mono text-sm">
            Assigned Altitude: <span className="text-white font-bold">{Math.round(selectedPlane.assignedAltitude)} ft</span>
          </p>
        </div>
      )}

      {/* Orbit Direction */}
      <div className="mb-4">
        <label className="block text-gray-300 font-mono text-sm mb-2">
          Orbit Direction:
        </label>
        <div className="flex gap-4">
          <label className="flex items-center text-white font-mono text-sm">
            <input
              type="radio"
              value="RIGHT"
              checked={direction === 'RIGHT'}
              onChange={(e) => setDirection(e.target.value)}
              onKeyDown={handleKeyPress}
              className="mr-2"
              autoFocus
            />
            Right (Clockwise)
          </label>
          <label className="flex items-center text-white font-mono text-sm">
            <input
              type="radio"
              value="LEFT"
              checked={direction === 'LEFT'}
              onChange={(e) => setDirection(e.target.value)}
              onKeyDown={handleKeyPress}
              className="mr-2"
            />
            Left (Counter-clockwise)
          </label>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-mono text-sm"
      >
        Assign Orbit
      </button>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-gray-400 text-xs font-mono">
          Aircraft will continuously orbit in place until given new clearance. Use Climb/Descend to Altitude command to change altitude while orbiting.
        </p>
      </div>
    </div>
  );
};

export default OrbitPanel;
