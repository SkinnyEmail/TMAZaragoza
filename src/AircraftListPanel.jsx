import React from 'react';

const AircraftListPanel = ({ aircraft, selectedAircraft, onSelectAircraft, simulationTime }) => {
  // Map aircraft states to abbreviated display names
  const getStateAbbreviation = (state) => {
    const stateMap = {
      'TAXIING': 'TAX',
      'READY_FOR_TAKEOFF': 'RDY',
      'DEPARTING': 'DEP',
      'CLIMBING': 'CLB',
      'CRUISE': 'CRZ',
      'DESCENDING': 'DES',
      'APPROACH': 'APP',
      'LANDING': 'LND',
      'PARKED': 'PKD',
      'AIRBORNE': 'AIR'
    };
    return stateMap[state] || state?.substring(0, 3).toUpperCase() || 'N/A';
  };

  const handleRowClick = (aircraftId) => {
    onSelectAircraft(aircraftId);
  };

  // Format simulation time as HH:MM:SS
  const formatTime = () => {
    const totalSeconds = Math.floor(simulationTime);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Calculate dynamic height - show max 4 rows before scrolling
  const maxVisibleRows = 4;
  const rowHeight = 29; // approximate px per row (py-1.5 padding + text)

  const shouldScroll = aircraft.length > maxVisibleRows;
  const scrollContainerHeight = shouldScroll
    ? maxVisibleRows * rowHeight
    : aircraft.length * rowHeight || 116; // 116px for "No aircraft" message

  return (
    <div className="bg-gray-800 bg-opacity-80 border border-gray-600 rounded shadow-lg" style={{ width: '420px' }}>
      {/* Header with Clock */}
      <div className="px-3 py-2 border-b border-gray-700 flex justify-between items-center">
        <span className="text-gray-400 font-mono text-xs">Aircraft: {aircraft.length}</span>
        <span className="text-gray-300 font-mono text-sm font-semibold">{formatTime()}</span>
      </div>

      {/* Scrollable table container */}
      <div className="overflow-y-auto" style={{ maxHeight: `${scrollContainerHeight}px` }}>
        <table className="w-full font-mono text-xs">
          <thead className="bg-gray-700 sticky top-0">
            <tr className="text-gray-400 text-left">
              <th className="px-2 py-1.5 font-semibold">Callsign</th>
              <th className="px-2 py-1.5 font-semibold">Type</th>
              <th className="px-2 py-1.5 font-semibold text-right">Alt (ft)</th>
              <th className="px-2 py-1.5 font-semibold text-right">Spd (kt)</th>
              <th className="px-2 py-1.5 font-semibold text-center">State</th>
            </tr>
          </thead>
          <tbody>
            {aircraft.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-2 py-4 text-center text-gray-500">
                  No aircraft in simulation
                </td>
              </tr>
            ) : (
              aircraft.map((plane) => {
                const isSelected = plane.id === selectedAircraft;
                return (
                  <tr
                    key={plane.id}
                    onClick={() => handleRowClick(plane.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-600 bg-opacity-40 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:bg-opacity-50'
                    }`}
                  >
                    <td className={`px-2 py-1.5 ${isSelected ? 'font-bold' : ''}`}>
                      {plane.callsign}
                    </td>
                    <td className="px-2 py-1.5">
                      {plane.type}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      {Math.round(plane.altitude)}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      {Math.round(plane.speed)}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      {getStateAbbreviation(plane.state)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AircraftListPanel;
