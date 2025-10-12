// ========== FILE: SpawnPanel.jsx ==========
import React, { useState, useEffect } from 'react';
import { getSIDsForRunway } from './sidData';

const SpawnPanel = ({ onSpawnAircraft, onClose }) => {
  const [callsign, setCallsign] = useState('');
  const [runway, setRunway] = useState('12L');
  const [aircraftType, setAircraftType] = useState('IFR');
  const [formationSize, setFormationSize] = useState(1);
  const [selectedSID, setSelectedSID] = useState('');
  const [altitudeCap, setAltitudeCap] = useState('');

  // Filter SIDs based on aircraft type: military SIDs only for Military aircraft
  const allSIDsForRunway = getSIDsForRunway(runway);
  const availableSIDs = allSIDsForRunway.filter(sid => {
    if (aircraftType === 'Military') {
      return true; // Military aircraft can use all SIDs
    } else {
      return !sid.isMilitary; // Civilian aircraft can only use non-military SIDs
    }
  });

  // Reset selected SID if it's no longer available when aircraft type or runway changes
  useEffect(() => {
    if (selectedSID && !availableSIDs.find(sid => sid.designator === selectedSID)) {
      setSelectedSID('');
    }
  }, [aircraftType, runway, selectedSID, availableSIDs]);

  const handleSpawn = () => {
    if (!callsign.trim()) {
      alert('Please enter a callsign');
      return;
    }

    // Parse altitude cap (convert FL notation to feet)
    let altitudeCapFeet = null;
    if (altitudeCap.trim()) {
      const capValue = parseInt(altitudeCap.replace(/[^\d]/g, ''));
      if (!isNaN(capValue)) {
        // If user enters FL format (e.g., 120), multiply by 100 to get feet
        altitudeCapFeet = capValue <= 600 ? capValue * 100 : capValue;
      }
    }

    onSpawnAircraft({
      callsign: callsign.trim().toUpperCase(),
      runway,
      type: aircraftType,
      formationSize: parseInt(formationSize),
      sid: selectedSID || null,
      sidAltitudeCap: altitudeCapFeet
    });

    // Reset form
    setCallsign('');
    setFormationSize(1);
    setSelectedSID('');
    setAltitudeCap('');
  };

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 bg-gray-800 border-2 border-gray-600 rounded-lg shadow-2xl p-6 w-80 z-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white font-bold text-lg font-mono">Spawn Aircraft - Runway</h2>
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
            placeholder="e.g., AFR123"
            maxLength={10}
          />
        </div>

        {/* Runway Selection */}
        <div>
          <label className="block text-gray-300 text-sm font-mono mb-1">Runway:</label>
          <select
            value={runway}
            onChange={(e) => setRunway(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded font-mono"
          >
            <option value="12L">12L</option>
            <option value="30R">30R</option>
            <option value="12R">12R</option>
            <option value="30L">30L</option>
          </select>
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

        {/* SID Selection (Optional) */}
        <div>
          <label className="block text-gray-300 text-sm font-mono mb-1">SID (Optional):</label>
          <select
            value={selectedSID}
            onChange={(e) => setSelectedSID(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded font-mono"
          >
            <option value="">-- No SID --</option>
            {availableSIDs.map(sid => (
              <option key={sid.designator} value={sid.designator}>
                {sid.designator}
              </option>
            ))}
          </select>
          {selectedSID && availableSIDs.find(s => s.designator === selectedSID) && (
            <div className="mt-2 text-xs text-gray-400 font-mono">
              {availableSIDs.find(s => s.designator === selectedSID).name}
            </div>
          )}

          {/* Altitude Cap (Optional) - only show when SID is selected */}
          {selectedSID && (
            <div className="mt-3">
              <label className="block text-gray-300 text-sm font-mono mb-1">
                Altitude Cap (Optional):
              </label>
              <input
                type="text"
                value={altitudeCap}
                onChange={(e) => setAltitudeCap(e.target.value)}
                placeholder="FL240 (Default)"
                className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded font-mono text-sm"
              />
              <div className="mt-1 text-xs text-gray-400 font-mono">
                {altitudeCap.trim()
                  ? `Cap at FL${altitudeCap.replace(/[^\d]/g, '')}`
                  : 'Default: FL240'}
              </div>
            </div>
          )}
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
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-mono text-sm"
          >
            Spawn
          </button>
        </div>
      </div>
    </div>
  );
};
export default SpawnPanel;