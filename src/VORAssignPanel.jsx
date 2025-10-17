import { useState } from 'react';

const VORAssignPanel = ({ selectedAircraft, aircraft, onAssignVOR, onClose }) => {
  const [runway, setRunway] = useState('12R');
  const [entryPoint, setEntryPoint] = useState('VOR');
  const [error, setError] = useState('');

  const selectedPlane = aircraft.find(p => p.id === selectedAircraft);

  // Check if aircraft is cleared to FL070 or lower
  const isClearedForApproach = selectedPlane && selectedPlane.assignedAltitude <= 7000;

  const handleSubmit = () => {
    setError('');

    if (!selectedPlane) {
      setError('No aircraft selected');
      return;
    }

    if (!isClearedForApproach) {
      setError('Aircraft must be cleared to FL070 or lower');
      return;
    }

    if (!runway) {
      setError('Please select a runway');
      return;
    }

    if (!entryPoint) {
      setError('Please select an entry point');
      return;
    }

    // Pass runway and entryPoint to parent
    onAssignVOR(selectedAircraft, runway, entryPoint);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && isClearedForApproach) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 bg-gray-800 border-2 border-gray-600 rounded-lg shadow-2xl p-6 w-80 z-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white font-bold text-lg font-mono">VOR Approach</h2>
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
            Current Alt: <span className="text-white font-bold">{Math.round(selectedPlane.altitude)} ft</span>
          </p>
          <p className="text-gray-300 font-mono text-sm">
            Assigned Alt: <span className={`font-bold ${isClearedForApproach ? 'text-green-400' : 'text-red-400'}`}>
              {Math.round(selectedPlane.assignedAltitude)} ft
            </span>
          </p>
          {!isClearedForApproach && (
            <p className="text-red-400 font-mono text-xs mt-2">
              ⚠ Clear to FL070 or lower first
            </p>
          )}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-gray-300 font-mono text-sm mb-2">
          Runway:
        </label>
        <select
          value={runway}
          onChange={(e) => {
            setRunway(e.target.value);
            // Reset entry point when runway changes
            if (e.target.value === '30R') {
              setEntryPoint('FULL');
            } else {
              setEntryPoint('VOR');
            }
          }}
          onKeyDown={handleKeyPress}
          disabled={!isClearedForApproach}
          className={`w-full px-3 py-2 bg-gray-700 text-white rounded font-mono border border-gray-600 focus:border-blue-500 focus:outline-none ${
            !isClearedForApproach ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          autoFocus
        >
          <option value="12R">VOR RWY 12R</option>
          <option value="30R">VOR RWY 30R</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-gray-300 font-mono text-sm mb-2">
          Entry:
        </label>
        <select
          value={entryPoint}
          onChange={(e) => setEntryPoint(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={!isClearedForApproach}
          className={`w-full px-3 py-2 bg-gray-700 text-white rounded font-mono border border-gray-600 focus:border-blue-500 focus:outline-none ${
            !isClearedForApproach ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {runway === '30R' ? (
            <>
              <option value="FULL">Full Procedure (via ZAR VOR)</option>
              <option value="STRAIGHT_IN">Straight-In (Direct to IF at 16 DME)</option>
            </>
          ) : (
            <>
              <option value="VOR">Full Procedure (from ZAR VOR)</option>
              <option value="IF_VOR">Straight-In (Direct to IF at 18 DME)</option>
            </>
          )}
        </select>
        {error && (
          <p className="text-red-400 text-sm font-mono mt-2">{error}</p>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isClearedForApproach}
        className={`w-full px-4 py-2 rounded font-mono text-sm ${
          isClearedForApproach
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        Assign VOR {runway}
      </button>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-gray-400 text-xs font-mono">
          {runway === '30R'
            ? (entryPoint === 'STRAIGHT_IN'
                ? 'Straight-in: Direct to IF (16 DME, R-108), descend on final approach track.'
                : 'Full procedure: Via ZAR VOR, fly to IF (16 DME, R-108), then final approach.')
            : (entryPoint === 'IF_VOR'
                ? 'Straight-in: Direct to IF (18 DME), then inbound to FAF.'
                : 'Full procedure: Via ZAR VOR, radial 300° outbound to 18 DME, turn inbound.')}
        </p>
      </div>
    </div>
  );
};

export default VORAssignPanel;
