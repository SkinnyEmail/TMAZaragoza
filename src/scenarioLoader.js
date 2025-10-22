/**
 * Scenario Loading Utilities
 * Handles loading and validation of scenario JSON files
 */

/**
 * Load list of available scenarios
 * Returns array of scenario filenames
 */
export const loadScenarioList = async () => {
  try {
    // Hardcoded list of scenarios (since we can't dynamically read directory in browser)
    const scenarios = [
      'Simple.json',
      'Simple 2.json',
      'Rush_Hour_Zaragoza.json'
    ];
    return scenarios;
  } catch (error) {
    console.error('Error loading scenario list:', error);
    return [];
  }
};

/**
 * Load a specific scenario file
 * @param {string} filename - Scenario filename (e.g., 'Simple.json')
 * @returns {Promise<Object>} Scenario data
 */
export const loadScenario = async (filename) => {
  try {
    const response = await fetch(`/scenarios/${filename}`);

    if (!response.ok) {
      throw new Error(`Failed to load scenario: ${response.statusText}`);
    }

    const data = await response.json();

    // Validate scenario
    if (!validateScenario(data)) {
      throw new Error('Invalid scenario format');
    }

    return data;
  } catch (error) {
    console.error('Error loading scenario:', error);
    throw error;
  }
};

/**
 * Validate scenario data structure
 * @param {Object} data - Scenario data to validate
 * @returns {boolean} True if valid
 */
export const validateScenario = (data) => {
  if (!data || typeof data !== 'object') {
    console.error('Scenario must be an object');
    return false;
  }

  if (!data.name || typeof data.name !== 'string') {
    console.error('Scenario must have a name');
    return false;
  }

  if (!Array.isArray(data.aircraft)) {
    console.error('Scenario must have an aircraft array');
    return false;
  }

  // Validate each aircraft
  for (const aircraft of data.aircraft) {
    if (!aircraft.callsign || typeof aircraft.callsign !== 'string') {
      console.error('Aircraft must have a callsign');
      return false;
    }

    if (!aircraft.type || !['VFR', 'IFR', 'Military'].includes(aircraft.type)) {
      console.error('Aircraft must have a valid type (VFR, IFR, or Military)');
      return false;
    }

    if (typeof aircraft.flightLevel !== 'number' || aircraft.flightLevel < 10 || aircraft.flightLevel > 600) {
      console.error('Aircraft flight level must be between 10 and 600');
      return false;
    }

    if (!aircraft.waypoint || typeof aircraft.waypoint !== 'string') {
      console.error('Aircraft must have a waypoint');
      return false;
    }

    if (typeof aircraft.timeToWaypoint !== 'number' || aircraft.timeToWaypoint < 1 || aircraft.timeToWaypoint > 20) {
      console.error('Aircraft timeToWaypoint must be between 1 and 20 minutes');
      return false;
    }

    if (typeof aircraft.spawnTime !== 'number' || aircraft.spawnTime < 0) {
      console.error('Aircraft spawnTime must be a non-negative number');
      return false;
    }
  }

  return true;
};

/**
 * Get scenario preview info
 * @param {Object} scenarioData - Scenario data
 * @returns {Object} Preview information
 */
export const getScenarioPreview = (scenarioData) => {
  return {
    name: scenarioData.name,
    description: scenarioData.description || 'No description',
    aircraftCount: scenarioData.aircraft.length,
    firstAircraft: scenarioData.aircraft.slice(0, 3).map(a => ({
      callsign: a.callsign,
      waypoint: a.waypoint,
      fl: a.flightLevel
    }))
  };
};
