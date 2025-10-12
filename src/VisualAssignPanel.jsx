import { useState } from 'react';
import { VISUAL_PATTERNS } from './visualData';

const VisualAssignPanel = ({ selectedAircraft, aircraft, onAssignVisual, onClose }) => {
  const [runway, setRunway] = useState('30R_RIGHT');
  const [entryPoint, setEntryPoint] = useState('DOWNWIND');
  const [error, setError] = useState('');

  const selectedPlane = aircraft.find(p => p.id === selectedAircraft);

  // Check if aircraft is at reasonable altitude for visual approach
  const isClearedForApproach = selectedPlane && selectedPlane.assignedAltitude <= 10000;

  const handleSubmit = () => {
    setError('');

    if (!selectedPlane) {
      setError('No aircraft selected');
      return;
    }

    if (!isClearedForApproach) {
      setError('Aircraft must be cleared to FL100 or lower');
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

    onAssignVisual(selectedAircraft, runway, entryPoint);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && isClearedForApproach) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const pattern = VISUAL_PATTERNS[runway];
  const entryInfo = pattern?.entryPoints[entryPoint];

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 bg-gray-800 border-2 border-gray-600 rounded-lg shadow-2xl p-6 w-80 z-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white font-bold text-lg font-mono">Visual Approach</h2>
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
              ⚠ Clear to FL100 or lower first
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
          onChange={(e) => setRunway(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={!isClearedForApproach}
          className={`w-full px-3 py-2 bg-gray-700 text-white rounded font-mono border border-gray-600 focus:border-blue-500 focus:outline-none ${
            !isClearedForApproach ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <option value="30R_RIGHT">Runway 30R (Right Pattern)</option>
          <option value="30L_LEFT">Runway 30L (Left Pattern)</option>
          <option value="12L_LEFT">Runway 12L (Left Pattern)</option>
          <option value="12R_RIGHT">Runway 12R (Right Pattern)</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-gray-300 font-mono text-sm mb-2">
          Entry Point:
        </label>
        <select
          value={entryPoint}
          onChange={(e) => setEntryPoint(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={!isClearedForApproach}
          className={`w-full px-3 py-2 bg-gray-700 text-white rounded font-mono border border-gray-600 focus:border-blue-500 focus:outline-none ${
            !isClearedForApproach ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          autoFocus
        >
          <option value="DOWNWIND">Downwind (Full Pattern)</option>
          <option value="BASE">Base (Mid Pattern)</option>
          <option value="FINAL">Final (Straight-In)</option>
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
        Assign Visual {runway}
      </button>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-gray-400 text-xs font-mono mb-2">
          <span className="text-white font-bold">Pattern:</span> {pattern?.patternName || 'Runway 30 (Right Pattern)'}
        </p>
        <p className="text-gray-400 text-xs font-mono">
          {entryInfo?.description || 'Select an entry point'}
        </p>
        {entryPoint === 'DOWNWIND' && (
          <p className="text-gray-400 text-xs font-mono mt-2">
            ATZ entry: 150kt, FL008
          </p>
        )}
      </div>
    </div>
  );
};

export default VisualAssignPanel;
