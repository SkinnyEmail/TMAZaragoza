import React from 'react';

const RouteDrawingPanel = ({
  selectedAircraft,
  aircraft,
  isDrawingMode,
  onStartDrawing,
  onCancelDrawing,
  onClose
}) => {
  const selectedPlane = aircraft.find(p => p.id === selectedAircraft);

  const handleStartDrawing = () => {
    if (!selectedPlane) {
      console.warn('Cannot start drawing: No aircraft selected');
      return;
    }
    onStartDrawing();
  };

  const handleCancel = () => {
    onCancelDrawing();
    onClose();
  };

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 bg-gray-800 border-2 border-gray-600 rounded-lg shadow-2xl p-6 w-80 z-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white font-bold text-lg font-mono">Draw Route</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xl font-bold"
        >
          ×
        </button>
      </div>

      {!selectedPlane ? (
        <div className="mb-4 p-3 bg-red-900 border border-red-600 rounded">
          <p className="text-red-200 font-mono text-sm font-bold">
            No aircraft selected!
          </p>
          <p className="text-red-300 font-mono text-xs mt-1">
            Please select an aircraft first.
          </p>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-gray-700 rounded border border-gray-500">
          <p className="text-white font-mono text-sm">
            <span className="text-gray-400">Aircraft:</span> {selectedPlane.callsign}
          </p>
          <p className="text-white font-mono text-sm">
            <span className="text-gray-400">Type:</span> {selectedPlane.type}
          </p>
        </div>
      )}

      {!isDrawingMode ? (
        <div className="space-y-4">
          <p className="text-gray-300 font-mono text-sm">
            Click "Start Drawing" then drag your mouse on the map to draw a custom route.
          </p>
          <button
            onClick={handleStartDrawing}
            disabled={!selectedPlane}
            className={`w-full font-mono py-2 px-4 rounded transition-colors ${
              selectedPlane
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Start Drawing
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-mono py-2 px-4 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-yellow-900 border border-yellow-600 rounded p-3">
            <p className="text-yellow-200 font-mono text-sm font-bold">
              DRAWING MODE ACTIVE
            </p>
            <p className="text-yellow-300 font-mono text-xs mt-2">
              Hold and drag mouse on map to draw route
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-mono py-2 px-4 rounded transition-colors"
          >
            Cancel Drawing
          </button>
        </div>
      )}
    </div>
  );
};

export default RouteDrawingPanel;
