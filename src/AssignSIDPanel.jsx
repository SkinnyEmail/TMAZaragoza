import React, { useState } from 'react';
import { getSIDsForRunway } from './sidData';
import { RUNWAY_DATA } from './constants';

const AssignSIDPanel = ({ selectedAircraft, aircraft, onAssignSID, onClose }) => {
  const [selectedSID, setSelectedSID] = useState('');
  const [altitudeCap, setAltitudeCap] = useState('');

  if (!selectedAircraft) {
    return (
      <div className="fixed right-4 top-1/2 -translate-y-1/2 bg-gray-800 border-2 border-gray-600 rounded-lg shadow-2xl p-6 w-80 z-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-bold text-lg font-mono">Assign SID</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl font-bold">×</button>
        </div>
        <p className="text-gray-400 font-mono text-sm">No aircraft selected</p>
      </div>
    );
  }

  const plane = aircraft.find(p => p.id === selectedAircraft);
  if (!plane) {
    return null;
  }

  // Determine which runway the aircraft is on based on heading
  let runwayId = null;
  const headingTolerance = 10;
  for (const [runway, data] of Object.entries(RUNWAY_DATA)) {
    const headingDiff = Math.abs(plane.heading - data.heading);
    if (headingDiff <= headingTolerance || headingDiff >= (360 - headingTolerance)) {
      runwayId = runway;
      break;
    }
  }

  const availableSIDs = runwayId ? getSIDsForRunway(runwayId) : [];

  const handleAssign = () => {
    if (!selectedSID) {
      alert('Please select a SID');
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

    onAssignSID(selectedAircraft, selectedSID, altitudeCapFeet);
    setSelectedSID('');
    setAltitudeCap('');
  };

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 bg-gray-800 border-2 border-gray-600 rounded-lg shadow-2xl p-6 w-80 z-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white font-bold text-lg font-mono">Assign SID</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl font-bold">×</button>
      </div>

      <div className="space-y-4">
        {/* Aircraft Info */}
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-gray-300 font-mono text-sm">
            <div><span className="font-bold">Callsign:</span> {plane.callsign}</div>
            <div><span className="font-bold">Type:</span> {plane.type}</div>
            <div><span className="font-bold">Runway:</span> {runwayId || 'Unknown'}</div>
            {plane.assignedSID && (
              <div className="text-yellow-400 mt-1">
                <span className="font-bold">Current SID:</span> {plane.assignedSID}
              </div>
            )}
          </div>
        </div>

        {/* SID Selection */}
        {availableSIDs.length > 0 ? (
          <div>
            <label className="block text-gray-300 text-sm font-mono mb-1">Select SID:</label>
            <select
              value={selectedSID}
              onChange={(e) => setSelectedSID(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded font-mono"
            >
              <option value="">-- Select SID --</option>
              {availableSIDs.map(sid => (
                <option key={sid.designator} value={sid.designator}>
                  {sid.designator} - {sid.name}
                </option>
              ))}
            </select>

            {/* SID Details */}
            {selectedSID && (
              <div className="mt-3 bg-gray-700 p-3 rounded text-xs font-mono text-gray-300">
                {availableSIDs.find(s => s.designator === selectedSID)?.description}
              </div>
            )}

            {/* Altitude Cap (Optional) */}
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
                    ? `Released with FL cap at ${altitudeCap.replace(/[^\d]/g, '')}`
                    : 'Released to FL240 (TMA Limit)'}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-yellow-400 font-mono text-sm">
            No SIDs available for this runway
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-mono text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedSID}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-mono text-sm"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignSIDPanel;
