import React from 'react';

const DeletePlanePanel = ({ selectedAircraft, aircraft, onDeleteAircraft, onClose }) => {
  const plane = aircraft.find(p => p.id === selectedAircraft);

  if (!plane) {
    return null;
  }

  const handleDelete = () => {
    onDeleteAircraft(plane.id);
  };

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 bg-gray-800 border-2 border-gray-600 rounded-lg shadow-2xl p-6 w-80 z-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white font-bold text-lg font-mono">Delete Aircraft</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xl font-bold"
        >
          ×
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-700 p-4 rounded border border-gray-600">
          <div className="text-gray-300 text-sm font-mono mb-2">Aircraft to delete:</div>
          <div className="text-white font-bold text-lg font-mono">{plane.callsign}</div>
          <div className="text-gray-400 text-sm font-mono mt-1">
            Type: {plane.type}
          </div>
        </div>

        <div className="text-yellow-400 text-sm font-mono bg-yellow-900 bg-opacity-20 p-3 rounded border border-yellow-700">
          ⚠️ Aircraft will blink for 3 seconds before deletion.
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-mono text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-mono text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePlanePanel;
