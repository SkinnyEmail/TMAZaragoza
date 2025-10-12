import { useState, useEffect } from 'react';
import { loadScenarioList, loadScenario, getScenarioPreview } from './scenarioLoader';

const ScenarioLoadPanel = ({ onLoadScenario, onClose }) => {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [scenarioPreviews, setScenarioPreviews] = useState({});

  useEffect(() => {
    loadAvailableScenarios();
  }, []);

  const loadAvailableScenarios = async () => {
    try {
      setLoading(true);
      const scenarioFiles = await loadScenarioList();
      setScenarios(scenarioFiles);

      // Load previews for all scenarios
      const previews = {};
      for (const filename of scenarioFiles) {
        try {
          const data = await loadScenario(filename);
          previews[filename] = getScenarioPreview(data);
        } catch (err) {
          console.error(`Failed to load preview for ${filename}:`, err);
        }
      }
      setScenarioPreviews(previews);
      setLoading(false);
    } catch (err) {
      setError('Failed to load scenarios');
      setLoading(false);
    }
  };

  const handleLoadScenario = async (filename) => {
    try {
      setError('');
      const scenarioData = await loadScenario(filename);
      onLoadScenario(scenarioData);
    } catch (err) {
      setError(`Failed to load scenario: ${err.message}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 bg-gray-800 border-2 border-gray-600 rounded-lg shadow-2xl p-6 w-96 z-50"
      onKeyDown={handleKeyPress}
      tabIndex={0}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white font-bold text-lg font-mono">Load Scenario</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xl font-bold"
        >
          ×
        </button>
      </div>

      {loading && (
        <div className="text-gray-300 font-mono text-center py-8">
          Loading scenarios...
        </div>
      )}

      {error && (
        <div className="text-red-400 font-mono text-sm mb-4 p-3 bg-red-900/20 border border-red-600 rounded">
          {error}
        </div>
      )}

      {!loading && scenarios.length === 0 && (
        <div className="text-gray-400 font-mono text-sm text-center py-8">
          No scenarios found
        </div>
      )}

      {!loading && scenarios.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {scenarios.map((filename) => {
            const preview = scenarioPreviews[filename];
            if (!preview) return null;

            return (
              <div
                key={filename}
                className={`p-4 rounded border-2 transition-all cursor-pointer ${
                  selectedScenario === filename
                    ? 'bg-blue-900/30 border-blue-500'
                    : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => setSelectedScenario(filename)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-white font-bold font-mono text-sm">
                      {preview.name}
                    </h3>
                    <p className="text-gray-400 font-mono text-xs mt-1">
                      {preview.description}
                    </p>
                  </div>
                  <div className="text-gray-400 font-mono text-xs">
                    {preview.aircraftCount} aircraft
                  </div>
                </div>

                {/* Aircraft Preview */}
                <div className="mt-3 space-y-1">
                  {preview.firstAircraft.map((aircraft, idx) => (
                    <div
                      key={idx}
                      className="text-gray-300 font-mono text-xs flex items-center gap-2"
                    >
                      <span className="text-blue-400">→</span>
                      <span className="font-bold">{aircraft.callsign}</span>
                      <span className="text-gray-500">•</span>
                      <span>FL{aircraft.fl}</span>
                      <span className="text-gray-500">•</span>
                      <span>{aircraft.waypoint}</span>
                    </div>
                  ))}
                  {preview.aircraftCount > 3 && (
                    <div className="text-gray-500 font-mono text-xs">
                      +{preview.aircraftCount - 3} more
                    </div>
                  )}
                </div>

                {/* Load Button */}
                {selectedScenario === filename && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadScenario(filename);
                    }}
                    className="w-full mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-mono text-sm"
                  >
                    Load Scenario
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-gray-400 text-xs font-mono">
          <span className="text-red-400 font-bold">WARNING:</span> Loading a scenario will reset everything (aircraft, zoom, pan, measurements, etc.)
        </p>
      </div>
    </div>
  );
};

export default ScenarioLoadPanel;
