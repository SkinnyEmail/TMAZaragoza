import { useState } from 'react';

const HeadingCommandPanel = ({ selectedAircraft, aircraft, onAssignHeading, onClose }) => {
  const [heading, setHeading] = useState('');
  const [error, setError] = useState('');

  const selectedPlane = aircraft.find(p => p.id === selectedAircraft);

  const handleSubmit = () => {
    setError('');

    // Validate heading input
    const headingNum = parseInt(heading, 10);

    if (isNaN(headingNum)) {
      setError('Please enter a valid heading (0-360)');
      return;
    }

    if (headingNum < 0 || headingNum > 360) {
      setError('Heading must be between 0 and 360');
      return;
    }

    // Normalize heading to 0-360 range
    const normalizedHeading = headingNum % 360;

    onAssignHeading(selectedAircraft, normalizedHeading);
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
        <h2 className="text-white font-bold text-lg font-mono">Assign Heading</h2>
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
              Mode: <span className="text-white font-bold">{selectedPlane.navigationMode}</span>
            </p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-300 font-mono text-sm mb-2">
            Heading (0-360°):
          </label>
          <input
            type="number"
            min="0"
            max="360"
            step="1"
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded font-mono border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="Enter heading (e.g., 270)"
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
        Assign Heading
      </button>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-gray-400 text-xs font-mono">
          Tip: Aircraft will turn to the assigned heading and maintain it until given a new command.
        </p>
      </div>
    </div>
  );
};

export default HeadingCommandPanel;
