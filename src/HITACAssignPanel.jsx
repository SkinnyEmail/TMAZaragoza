import { useState } from 'react';

const HITACAssignPanel = ({ selectedAircraft, aircraft, onAssignHITAC, onClose }) => {
  const [entryPoint, setEntryPoint] = useState('FULL');
  const [error, setError] = useState('');

  const selectedPlane = aircraft.find(p => p.id === selectedAircraft);

  // Check if aircraft is military type (only military can use HI-TAC)
  const isMilitary = selectedPlane && selectedPlane.type === 'Military';

  const handleSubmit = () => {
    setError('');

    if (!selectedPlane) {
      setError('No aircraft selected');
      return;
    }

    if (!isMilitary) {
      setError('Only military aircraft can use HI-TAC approach');
      return;
    }

    if (!entryPoint) {
      setError('Please select an entry point');
      return;
    }

    // Pass entry point to parent (no FL restriction for HI-TAC)
    onAssignHITAC(selectedAircraft, entryPoint);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && isMilitary) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 bg-gray-800 border-2 border-gray-600 rounded-lg shadow-2xl p-6 w-80 z-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white font-bold text-lg font-mono">HI-TAC RWY 12R</h2>
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
            Type: <span className={`font-bold ${isMilitary ? 'text-orange-400' : 'text-gray-400'}`}>
              {selectedPlane.type}
            </span>
          </p>
          <p className="text-gray-300 font-mono text-sm">
            Current Alt: <span className="text-white font-bold">{Math.round(selectedPlane.altitude)} ft</span>
          </p>
          {!isMilitary && (
            <p className="text-red-400 font-mono text-xs mt-2">
              ⚠ Military aircraft only
            </p>
          )}
          {isMilitary && (
            <p className="text-green-400 font-mono text-xs mt-2">
              ✓ Will auto-climb/descend to FL200
            </p>
          )}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-gray-300 font-mono text-sm mb-2">
          Entry:
        </label>
        <select
          value={entryPoint}
          onChange={(e) => setEntryPoint(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={!isMilitary}
          className={`w-full px-3 py-2 bg-gray-700 text-white rounded font-mono border border-gray-600 focus:border-blue-500 focus:outline-none ${
            !isMilitary ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          autoFocus
        >
          <option value="FULL">Full Procedure (via Ambel)</option>
          <option value="STRAIGHT_IN">Straight-In (Direct to IF at 6000 ft)</option>
        </select>
        {error && (
          <p className="text-red-400 text-sm font-mono mt-2">{error}</p>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isMilitary}
        className={`w-full px-4 py-2 rounded font-mono text-sm ${
          isMilitary
            ? 'bg-orange-600 hover:bg-orange-700 text-white'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        Assign HI-TAC 12R
      </button>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-gray-400 text-xs font-mono">
          {entryPoint === 'STRAIGHT_IN'
            ? 'Straight-in: Direct to IF (16 DME at 6000 ft), then FAF (7.7 DME at 2800 ft), final to RWY 12R.'
            : 'Full procedure: Climb/descend to FL200, via Ambel, intercept R-281 inbound to ZAR, turn to IF at 20 DME, descend to FAF, land RWY 12R.'}
        </p>
      </div>
    </div>
  );
};

export default HITACAssignPanel;
