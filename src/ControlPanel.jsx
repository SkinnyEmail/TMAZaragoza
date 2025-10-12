import { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { DELTAS, CIRCLE_DELTAS } from './constants';
import { AIRCRAFT_STATES } from './aircraftStates';

const ControlPanel = ({
  showATZ, setShowATZ,
  showCTR, setShowCTR,
  showVisual, setShowVisual,
  showInstrumental, setShowInstrumental,
  showSIDsRunway30, setShowSIDsRunway30,
  showSIDsRunway12, setShowSIDsRunway12,
  showMilitaryDepartures, setShowMilitaryDepartures,
  activeDelta, setActiveDelta,
  zoom,
  simulationSpeed,
  setSimulationSpeed,
  onResetView,
  onOpenSpawnPanel,
  selectedAircraft,
  aircraft,
  onOpenDeletePanel,
  onTakeoffCommand,
  onOpenAssignSIDPanel,
  onOpenHeadingPanel,
  onOpenAltitudePanel,
  onOpenSpeedPanel,
  onOpenRoutePanel,
  onEnableRandomAutopilot,
  onOpenDrawingPanel,
  onOpenAirborneSpawnPanel,
  onOpenILSPanel,
  onOpenVORPanel,
  onOpenVisualPanel,
  onOpenHoldingPanel,
  onOpenOrbitPanel,
  onOpenScenarioPanel,
  showHoldings,
  setShowHoldings
}) => {
  const [drawingsMenuOpen, setDrawingsMenuOpen] = useState(false);
  const [aerodromeSubmenuOpen, setAerodromeSubmenuOpen] = useState(false);
  const [deltasSubmenuOpen, setDeltasSubmenuOpen] = useState(false);
  const [sidsSubmenuOpen, setSidsSubmenuOpen] = useState(false);
  const [proceduresSubmenuOpen, setProceduresSubmenuOpen] = useState(false);
  const [spawnMenuOpen, setSpawnMenuOpen] = useState(false);
  const [commandsMenuOpen, setCommandsMenuOpen] = useState(false);
  const [arrivalsSubmenuOpen, setArrivalsSubmenuOpen] = useState(false);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);

  const drawingsMenuRef = useRef(null);
  const aerodromeSubmenuRef = useRef(null);
  const deltasSubmenuRef = useRef(null);
  const sidsSubmenuRef = useRef(null);
  const proceduresSubmenuRef = useRef(null);
  const spawnMenuRef = useRef(null);
  const commandsMenuRef = useRef(null);
  const arrivalsSubmenuRef = useRef(null);
  const systemMenuRef = useRef(null);

  const [menuStyles, setMenuStyles] = useState({
    drawings: {},
    aerodrome: {},
    deltas: {},
    sids: {},
    procedures: {},
    spawn: {},
    commands: {},
    arrivals: {},
    system: {}
  });

  useEffect(() => {
    const adjustMenuPosition = (menuRef, menuType, isSubmenu = false) => {
      if (!menuRef.current) return {};

      const rect = menuRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let styles = {};

      // Check vertical overflow
      if (rect.bottom > viewportHeight) {
        const overflow = rect.bottom - viewportHeight;
        styles.transform = `translateY(-${overflow + 10}px)`;
      }

      // Check if menu goes above viewport
      if (rect.top < 0) {
        styles.transform = `translateY(${Math.abs(rect.top) + 10}px)`;
      }

      // For submenus, check horizontal overflow
      if (isSubmenu && rect.right > viewportWidth) {
        // Position to the left instead of right
        styles.left = 'auto';
        styles.right = '100%';
        styles.marginLeft = '0';
        styles.marginRight = '0.25rem';
      }

      return styles;
    };

    // Reset all styles first, then apply only for open menus
    setMenuStyles({
      drawings: drawingsMenuOpen && drawingsMenuRef.current ? adjustMenuPosition(drawingsMenuRef, 'drawings') : {},
      aerodrome: aerodromeSubmenuOpen && aerodromeSubmenuRef.current ? adjustMenuPosition(aerodromeSubmenuRef, 'aerodrome', true) : {},
      deltas: deltasSubmenuOpen && deltasSubmenuRef.current ? adjustMenuPosition(deltasSubmenuRef, 'deltas', true) : {},
      sids: sidsSubmenuOpen && sidsSubmenuRef.current ? adjustMenuPosition(sidsSubmenuRef, 'sids', true) : {},
      procedures: proceduresSubmenuOpen && proceduresSubmenuRef.current ? adjustMenuPosition(proceduresSubmenuRef, 'procedures', true) : {},
      spawn: spawnMenuOpen && spawnMenuRef.current ? adjustMenuPosition(spawnMenuRef, 'spawn') : {},
      commands: commandsMenuOpen && commandsMenuRef.current ? adjustMenuPosition(commandsMenuRef, 'commands') : {},
      arrivals: arrivalsSubmenuOpen && arrivalsSubmenuRef.current ? adjustMenuPosition(arrivalsSubmenuRef, 'arrivals', true) : {},
      system: systemMenuOpen && systemMenuRef.current ? adjustMenuPosition(systemMenuRef, 'system') : {}
    });
  }, [drawingsMenuOpen, aerodromeSubmenuOpen, deltasSubmenuOpen, sidsSubmenuOpen, proceduresSubmenuOpen, spawnMenuOpen, commandsMenuOpen, arrivalsSubmenuOpen, systemMenuOpen]);

  const toggleDelta = (deltaName) => {
    setActiveDelta(prev => ({
      ...prev,
      [deltaName]: !prev[deltaName]
    }));
  };

  return (
    <div className="h-16 bg-gray-800 border-t border-gray-700 flex items-center px-4 gap-4 relative">
      <div className="relative">
        <button
          onClick={() => {
            const newState = !drawingsMenuOpen;
            setDrawingsMenuOpen(newState);
            // Close other main menus
            setSpawnMenuOpen(false);
            setCommandsMenuOpen(false);
            // Close all submenus when closing or opening
            if (!newState) {
              setAerodromeSubmenuOpen(false);
              setDeltasSubmenuOpen(false);
              setSidsSubmenuOpen(false);
              setProceduresSubmenuOpen(false);
            }
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-2 font-mono text-sm"
        >
          Drawings
          <ChevronRight className={`w-4 h-4 transition-transform ${drawingsMenuOpen ? 'rotate-90' : ''}`} />
        </button>

        {drawingsMenuOpen && (
          <div
            ref={drawingsMenuRef}
            className="absolute bottom-full left-0 mb-2 bg-gray-700 rounded shadow-lg border border-gray-600 min-w-[150px] z-50"
            style={menuStyles.drawings}
          >
            {/* Reset View */}
            <button
              onClick={onResetView}
              className="w-full px-4 py-2 text-white hover:bg-gray-600 text-left font-mono text-sm border-b border-gray-600"
            >
              Reset View
            </button>

            {/* Aerodrome Submenu */}
            <div className="relative">
              <button
                onClick={() => {
                  setAerodromeSubmenuOpen(!aerodromeSubmenuOpen);
                  // Close other submenus
                  setDeltasSubmenuOpen(false);
                  setSidsSubmenuOpen(false);
                }}
                className="w-full px-4 py-2 text-white hover:bg-gray-600 text-left flex items-center justify-between font-mono text-sm"
              >
                Aerodrome
                <ChevronRight className={`w-4 h-4 transition-transform ${aerodromeSubmenuOpen ? 'rotate-90' : ''}`} />
              </button>

              {aerodromeSubmenuOpen && (
                <div
                  ref={aerodromeSubmenuRef}
                  className="absolute left-full top-0 ml-1 bg-gray-700 rounded shadow-lg border border-gray-600 min-w-[140px] z-50"
                  style={menuStyles.aerodrome}
                >
                  <button
                    onClick={() => setShowATZ(!showATZ)}
                    className="w-full px-4 py-2 text-white hover:bg-gray-600 text-left flex items-center gap-2 font-mono text-sm"
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${showATZ ? 'bg-green-500 border-green-500' : 'border-gray-400'}`}>
                      {showATZ && <span className="text-white text-xs">✓</span>}
                    </div>
                    ATZ
                  </button>
                  <button
                    onClick={() => setShowCTR(!showCTR)}
                    className="w-full px-4 py-2 text-white hover:bg-gray-600 text-left flex items-center gap-2 font-mono text-sm"
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${showCTR ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}>
                      {showCTR && <span className="text-white text-xs">✓</span>}
                    </div>
                    CTR
                  </button>
                  <button
                    onClick={() => setShowVisual(!showVisual)}
                    className="w-full px-4 py-2 text-white hover:bg-gray-600 text-left flex items-center gap-2 font-mono text-sm"
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${showVisual ? 'bg-green-500 border-green-500' : 'border-gray-400'}`}>
                      {showVisual && <span className="text-white text-xs">✓</span>}
                    </div>
                    Visual
                  </button>
                  <button
                    onClick={() => setShowInstrumental(!showInstrumental)}
                    className="w-full px-4 py-2 text-white hover:bg-gray-600 text-left flex items-center gap-2 font-mono text-sm"
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${showInstrumental ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}>
                      {showInstrumental && <span className="text-white text-xs">✓</span>}
                    </div>
                    Instrumental
                  </button>
                </div>
              )}
            </div>

            {/* Deltas Submenu */}
            <div className="relative">
              <button
                onClick={() => {
                  setDeltasSubmenuOpen(!deltasSubmenuOpen);
                  // Close other submenus
                  setAerodromeSubmenuOpen(false);
                  setSidsSubmenuOpen(false);
                }}
                className="w-full px-4 py-2 text-white hover:bg-gray-600 text-left flex items-center justify-between font-mono text-sm"
              >
                Deltas
                <ChevronRight className={`w-4 h-4 transition-transform ${deltasSubmenuOpen ? 'rotate-90' : ''}`} />
              </button>

              {deltasSubmenuOpen && (
                <div
                  ref={deltasSubmenuRef}
                  className="absolute left-full top-0 ml-1 bg-gray-700 rounded shadow-lg border border-gray-600 min-w-[120px] z-50"
                  style={menuStyles.deltas}
                >
                  {Object.keys(DELTAS).map(deltaName => (
                    <button
                      key={deltaName}
                      onClick={() => toggleDelta(deltaName)}
                      className="w-full px-4 py-2 text-white hover:bg-gray-600 text-left flex items-center gap-2 font-mono text-sm"
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${activeDelta[deltaName] ? 'bg-red-500 border-red-500' : 'border-gray-400'}`}>
                        {activeDelta[deltaName] && <span className="text-white text-xs">✓</span>}
                      </div>
                      {deltaName}
                    </button>
                  ))}
                  {Object.keys(CIRCLE_DELTAS).map(deltaName => (
                    <button
                      key={deltaName}
                      onClick={() => toggleDelta(deltaName)}
                      className="w-full px-4 py-2 text-white hover:bg-gray-600 text-left flex items-center gap-2 font-mono text-sm"
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${activeDelta[deltaName] ? 'bg-red-500 border-red-500' : 'border-gray-400'}`}>
                        {activeDelta[deltaName] && <span className="text-white text-xs">✓</span>}
                      </div>
                      {deltaName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SIDs Submenu */}
            <div className="relative">
              <button
                onClick={() => {
                  setSidsSubmenuOpen(!sidsSubmenuOpen);
                  // Close other submenus
                  setAerodromeSubmenuOpen(false);
                  setDeltasSubmenuOpen(false);
                }}
                className="w-full px-4 py-2 text-white hover:bg-gray-600 text-left flex items-center justify-between font-mono text-sm"
              >
                SIDs
                <ChevronRight className={`w-4 h-4 transition-transform ${sidsSubmenuOpen ? 'rotate-90' : ''}`} />
              </button>

              {sidsSubmenuOpen && (
                <div
                  ref={sidsSubmenuRef}
                  className="absolute left-full top-0 ml-1 bg-gray-700 rounded shadow-lg border border-gray-600 min-w-[140px] z-50"
                  style={menuStyles.sids}
                >
                  <button
                    onClick={() => setShowSIDsRunway30(!showSIDsRunway30)}
                    className="w-full px-4 py-2 text-white hover:bg-gray-600 text-left flex items-center gap-2 font-mono text-sm"
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${showSIDsRunway30 ? 'bg-purple-500 border-purple-500' : 'border-gray-400'}`}>
                      {showSIDsRunway30 && <span className="text-white text-xs">✓</span>}
                    </div>
                    Runway 30
                  </button>
                  <button
                    onClick={() => setShowSIDsRunway12(!showSIDsRunway12)}
                    className="w-full px-4 py-2 text-white hover:bg-gray-600 text-left flex items-center gap-2 font-mono text-sm"
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${showSIDsRunway12 ? 'bg-purple-500 border-purple-500' : 'border-gray-400'}`}>
                      {showSIDsRunway12 && <span className="text-white text-xs">✓</span>}
                    </div>
                    Runway 12
                  </button>
                  <button
                    onClick={() => setShowMilitaryDepartures(!showMilitaryDepartures)}
                    className="w-full px-4 py-2 text-white hover:bg-gray-600 text-left flex items-center gap-2 font-mono text-sm"
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${showMilitaryDepartures ? 'bg-orange-500 border-orange-500' : 'border-gray-400'}`}>
                      {showMilitaryDepartures && <span className="text-white text-xs">✓</span>}
                    </div>
                    Military Departures
                  </button>
                </div>
              )}
            </div>

            {/* Procedures Submenu */}
            <div className="relative">
              <button
                onClick={() => {
                  setProceduresSubmenuOpen(!proceduresSubmenuOpen);
                  // Close other submenus
                  setAerodromeSubmenuOpen(false);
                  setDeltasSubmenuOpen(false);
                  setSidsSubmenuOpen(false);
                }}
                className="w-full px-4 py-2 text-white hover:bg-gray-600 text-left flex items-center justify-between font-mono text-sm"
              >
                Procedures
                <ChevronRight className={`w-4 h-4 transition-transform ${proceduresSubmenuOpen ? 'rotate-90' : ''}`} />
              </button>

              {proceduresSubmenuOpen && (
                <div
                  ref={proceduresSubmenuRef}
                  className="absolute left-full top-0 ml-1 bg-gray-700 rounded shadow-lg border border-gray-600 min-w-[140px] z-50"
                  style={menuStyles.procedures}
                >
                  <button
                    onClick={() => setShowHoldings(!showHoldings)}
                    className="w-full px-4 py-2 text-white hover:bg-gray-600 text-left flex items-center gap-2 font-mono text-sm"
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${showHoldings ? 'bg-yellow-500 border-yellow-500' : 'border-gray-400'}`}>
                      {showHoldings && <span className="text-white text-xs">✓</span>}
                    </div>
                    Holdings
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Spawn Plane Button */}
      <div className="relative">
        <button
          onClick={() => {
            setSpawnMenuOpen(!spawnMenuOpen);
            // Close other main menus and all submenus
            setDrawingsMenuOpen(false);
            setCommandsMenuOpen(false);
            setAerodromeSubmenuOpen(false);
            setDeltasSubmenuOpen(false);
            setSidsSubmenuOpen(false);
            setProceduresSubmenuOpen(false);
          }}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-2 font-mono text-sm"
        >
          Spawn Plane
          <ChevronRight className={`w-4 h-4 transition-transform ${spawnMenuOpen ? 'rotate-90' : ''}`} />
        </button>

        {spawnMenuOpen && (
          <div
            ref={spawnMenuRef}
            className="absolute bottom-full left-0 mb-2 bg-gray-700 rounded shadow-lg border border-gray-600 min-w-[180px] z-50"
            style={menuStyles.spawn}
          >
            <button
              onClick={() => {
                onOpenSpawnPanel();
                setSpawnMenuOpen(false);
              }}
              className="w-full px-4 py-2 text-white hover:bg-gray-600 text-left font-mono text-sm border-b border-gray-600"
            >
              Spawn on Runway
            </button>
            <button
              onClick={() => {
                onOpenAirborneSpawnPanel();
                setSpawnMenuOpen(false);
              }}
              className="w-full px-4 py-2 text-white hover:bg-gray-600 text-left font-mono text-sm"
            >
              Spawn Airborne
            </button>
          </div>
        )}
      </div>

      {/* Commands Button */}
      <div className="relative">
        <button
          onClick={() => {
            setCommandsMenuOpen(!commandsMenuOpen);
            // Close other main menus and all submenus
            setDrawingsMenuOpen(false);
            setSpawnMenuOpen(false);
            setAerodromeSubmenuOpen(false);
            setDeltasSubmenuOpen(false);
            setSidsSubmenuOpen(false);
            setProceduresSubmenuOpen(false);
          }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded flex items-center gap-2 font-mono text-sm"
        >
          Commands
          <ChevronRight className={`w-4 h-4 transition-transform ${commandsMenuOpen ? 'rotate-90' : ''}`} />
        </button>

        {commandsMenuOpen && (
          <div
            ref={commandsMenuRef}
            className="absolute bottom-full left-0 mb-2 bg-gray-700 rounded shadow-lg border border-gray-600 min-w-[180px] z-50"
            style={menuStyles.commands}
          >
            {/* Take Off Button */}
            <div className="relative group">
              <button
                onClick={() => {
                  const plane = aircraft.find(p => p.id === selectedAircraft);
                  if (plane && plane.state === AIRCRAFT_STATES.PARKED) {
                    onTakeoffCommand(selectedAircraft);
                    setCommandsMenuOpen(false);
                  }
                }}
                disabled={!selectedAircraft || !aircraft.find(p => p.id === selectedAircraft && p.state === AIRCRAFT_STATES.PARKED)}
                className={`w-full px-4 py-2 text-left font-mono text-sm border-b border-gray-600 ${
                  selectedAircraft && aircraft.find(p => p.id === selectedAircraft && p.state === AIRCRAFT_STATES.PARKED)
                    ? 'text-white hover:bg-gray-600 cursor-pointer'
                    : 'text-gray-500 cursor-not-allowed'
                }`}
              >
                Take Off
              </button>
              {(!selectedAircraft || !aircraft.find(p => p.id === selectedAircraft && p.state === AIRCRAFT_STATES.PARKED)) && (
                <div className="absolute left-full top-0 ml-2 hidden group-hover:block bg-gray-900 text-white text-xs font-mono px-3 py-2 rounded shadow-lg border border-gray-600 whitespace-nowrap z-50">
                  {!selectedAircraft ? 'No plane selected. Please select a plane first.' : 'Aircraft must be parked on runway.'}
                </div>
              )}
            </div>

            {/* Assign SID Button */}
            <div className="relative group">
              <button
                onClick={() => {
                  if (selectedAircraft) {
                    onOpenAssignSIDPanel();
                    setCommandsMenuOpen(false);
                  }
                }}
                disabled={!selectedAircraft}
                className={`w-full px-4 py-2 text-left font-mono text-sm border-b border-gray-600 ${
                  selectedAircraft
                    ? 'text-white hover:bg-gray-600 cursor-pointer'
                    : 'text-gray-500 cursor-not-allowed'
                }`}
              >
                Assign SID
              </button>
              {!selectedAircraft && (
                <div className="absolute left-full top-0 ml-2 hidden group-hover:block bg-gray-900 text-white text-xs font-mono px-3 py-2 rounded shadow-lg border border-gray-600 whitespace-nowrap z-50">
                  No plane selected. Please select a plane first.
                </div>
              )}
            </div>

            {/* Turn to Heading Button */}
            <div className="relative group">
              <button
                onClick={() => {
                  if (selectedAircraft) {
                    onOpenHeadingPanel();
                    setCommandsMenuOpen(false);
                  }
                }}
                disabled={!selectedAircraft}
                className={`w-full px-4 py-2 text-left font-mono text-sm border-b border-gray-600 ${
                  selectedAircraft
                    ? 'text-white hover:bg-gray-600 cursor-pointer'
                    : 'text-gray-500 cursor-not-allowed'
                }`}
              >
                Turn to Heading
              </button>
              {!selectedAircraft && (
                <div className="absolute left-full top-0 ml-2 hidden group-hover:block bg-gray-900 text-white text-xs font-mono px-3 py-2 rounded shadow-lg border border-gray-600 whitespace-nowrap z-50">
                  No plane selected. Please select a plane first.
                </div>
              )}
            </div>

            {/* Climb/Descend to Altitude Button */}
            <div className="relative group">
              <button
                onClick={() => {
                  if (selectedAircraft) {
                    onOpenAltitudePanel();
                    setCommandsMenuOpen(false);
                  }
                }}
                disabled={!selectedAircraft}
                className={`w-full px-4 py-2 text-left font-mono text-sm border-b border-gray-600 ${
                  selectedAircraft
                    ? 'text-white hover:bg-gray-600 cursor-pointer'
                    : 'text-gray-500 cursor-not-allowed'
                }`}
              >
                Climb/Descend to Altitude
              </button>
              {!selectedAircraft && (
                <div className="absolute left-full top-0 ml-2 hidden group-hover:block bg-gray-900 text-white text-xs font-mono px-3 py-2 rounded shadow-lg border border-gray-600 whitespace-nowrap z-50">
                  No plane selected. Please select a plane first.
                </div>
              )}
            </div>

            {/* Assign Speed Button */}
            <div className="relative group">
              <button
                onClick={() => {
                  if (selectedAircraft) {
                    onOpenSpeedPanel();
                    setCommandsMenuOpen(false);
                  }
                }}
                disabled={!selectedAircraft}
                className={`w-full px-4 py-2 text-left font-mono text-sm border-b border-gray-600 ${
                  selectedAircraft
                    ? 'text-white hover:bg-gray-600 cursor-pointer'
                    : 'text-gray-500 cursor-not-allowed'
                }`}
              >
                Assign Speed
              </button>
              {!selectedAircraft && (
                <div className="absolute left-full top-0 ml-2 hidden group-hover:block bg-gray-900 text-white text-xs font-mono px-3 py-2 rounded shadow-lg border border-gray-600 whitespace-nowrap z-50">
                  No plane selected. Please select a plane first.
                </div>
              )}
            </div>

            {/* Assign Route Button */}
            <div className="relative group">
              <button
                onClick={() => {
                  if (selectedAircraft) {
                    onOpenRoutePanel();
                    setCommandsMenuOpen(false);
                  }
                }}
                disabled={!selectedAircraft}
                className={`w-full px-4 py-2 text-left font-mono text-sm border-b border-gray-600 ${
                  selectedAircraft
                    ? 'text-white hover:bg-gray-600 cursor-pointer'
                    : 'text-gray-500 cursor-not-allowed'
                }`}
              >
                Assign Route
              </button>
              {!selectedAircraft && (
                <div className="absolute left-full top-0 ml-2 hidden group-hover:block bg-gray-900 text-white text-xs font-mono px-3 py-2 rounded shadow-lg border border-gray-600 whitespace-nowrap z-50">
                  No plane selected. Please select a plane first.
                </div>
              )}
            </div>

            {/* Random VFR Autopilot Button (VFR only) */}
            <div className="relative group">
              <button
                onClick={() => {
                  if (selectedAircraft) {
                    const plane = aircraft.find(p => p.id === selectedAircraft);
                    if (plane && plane.type === 'VFR') {
                      onEnableRandomAutopilot(selectedAircraft);
                      setCommandsMenuOpen(false);
                    }
                  }
                }}
                disabled={!selectedAircraft || !aircraft.find(p => p.id === selectedAircraft && p.type === 'VFR')}
                className={`w-full px-4 py-2 text-left font-mono text-sm border-b border-gray-600 ${
                  selectedAircraft && aircraft.find(p => p.id === selectedAircraft && p.type === 'VFR')
                    ? 'text-white hover:bg-gray-600 cursor-pointer'
                    : 'text-gray-500 cursor-not-allowed'
                }`}
              >
                Random VFR Autopilot
              </button>
              {selectedAircraft && !aircraft.find(p => p.id === selectedAircraft && p.type === 'VFR') && (
                <div className="absolute left-full top-0 ml-2 hidden group-hover:block bg-gray-900 text-white text-xs font-mono px-3 py-2 rounded shadow-lg border border-gray-600 whitespace-nowrap z-50">
                  Only available for VFR aircraft.
                </div>
              )}
              {!selectedAircraft && (
                <div className="absolute left-full top-0 ml-2 hidden group-hover:block bg-gray-900 text-white text-xs font-mono px-3 py-2 rounded shadow-lg border border-gray-600 whitespace-nowrap z-50">
                  No plane selected. Please select a plane first.
                </div>
              )}
            </div>

            {/* Draw Route Button */}
            <div className="relative group">
              <button
                onClick={() => {
                  if (selectedAircraft) {
                    onOpenDrawingPanel();
                    setCommandsMenuOpen(false);
                  }
                }}
                disabled={!selectedAircraft}
                className={`w-full px-4 py-2 text-left font-mono text-sm border-b border-gray-600 ${
                  selectedAircraft
                    ? 'text-white hover:bg-gray-600 cursor-pointer'
                    : 'text-gray-500 cursor-not-allowed'
                }`}
              >
                Draw Route
              </button>
              {!selectedAircraft && (
                <div className="absolute left-full top-0 ml-2 hidden group-hover:block bg-gray-900 text-white text-xs font-mono px-3 py-2 rounded shadow-lg border border-gray-600 whitespace-nowrap z-50">
                  No plane selected. Please select a plane first.
                </div>
              )}
            </div>

            {/* Holding Button */}
            <div className="relative group">
              <button
                onClick={() => {
                  if (selectedAircraft) {
                    onOpenHoldingPanel();
                    setCommandsMenuOpen(false);
                  }
                }}
                disabled={!selectedAircraft}
                className={`w-full px-4 py-2 text-left font-mono text-sm border-b border-gray-600 ${
                  selectedAircraft
                    ? 'text-white hover:bg-gray-600 cursor-pointer'
                    : 'text-gray-500 cursor-not-allowed'
                }`}
              >
                Holding
              </button>
              {!selectedAircraft && (
                <div className="absolute left-full top-0 ml-2 hidden group-hover:block bg-gray-900 text-white text-xs font-mono px-3 py-2 rounded shadow-lg border border-gray-600 whitespace-nowrap z-50">
                  No plane selected. Please select a plane first.
                </div>
              )}
            </div>

            {/* Orbit Button */}
            <div className="relative group">
              <button
                onClick={() => {
                  if (selectedAircraft) {
                    onOpenOrbitPanel();
                    setCommandsMenuOpen(false);
                  }
                }}
                disabled={!selectedAircraft}
                className={`w-full px-4 py-2 text-left font-mono text-sm border-b border-gray-600 ${
                  selectedAircraft
                    ? 'text-white hover:bg-gray-600 cursor-pointer'
                    : 'text-gray-500 cursor-not-allowed'
                }`}
              >
                Orbit
              </button>
              {!selectedAircraft && (
                <div className="absolute left-full top-0 ml-2 hidden group-hover:block bg-gray-900 text-white text-xs font-mono px-3 py-2 rounded shadow-lg border border-gray-600 whitespace-nowrap z-50">
                  No plane selected. Please select a plane first.
                </div>
              )}
            </div>

            {/* Arrivals Button with Submenu */}
            <div className="relative">
              <button
                onClick={() => setArrivalsSubmenuOpen(!arrivalsSubmenuOpen)}
                className="w-full px-4 py-2 text-white hover:bg-gray-600 text-left flex items-center justify-between font-mono text-sm border-b border-gray-600"
              >
                Arrivals
                <ChevronRight className={`w-4 h-4 transition-transform ${arrivalsSubmenuOpen ? 'rotate-90' : ''}`} />
              </button>

              {arrivalsSubmenuOpen && (
                <div
                  ref={arrivalsSubmenuRef}
                  className="absolute left-full top-0 ml-1 bg-gray-700 rounded shadow-lg border border-gray-600 min-w-[140px] z-50"
                  style={menuStyles.arrivals}
                >
                  {/* ILS 30 Button */}
                  <div className="relative group">
                    <button
                      onClick={() => {
                        const plane = aircraft.find(p => p.id === selectedAircraft);
                        if (plane && plane.assignedAltitude <= 7000) {
                          onOpenILSPanel();
                          setArrivalsSubmenuOpen(false);
                          setCommandsMenuOpen(false);
                        }
                      }}
                      disabled={!selectedAircraft || !aircraft.find(p => p.id === selectedAircraft && p.assignedAltitude <= 7000)}
                      className={`w-full px-4 py-2 text-left font-mono text-sm border-b border-gray-600 ${
                        selectedAircraft && aircraft.find(p => p.id === selectedAircraft && p.assignedAltitude <= 7000)
                          ? 'text-white hover:bg-gray-600 cursor-pointer'
                          : 'text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      ILS 30
                    </button>
                    {(!selectedAircraft || !aircraft.find(p => p.id === selectedAircraft && p.assignedAltitude <= 7000)) && (
                      <div className="absolute left-full top-0 ml-2 hidden group-hover:block bg-gray-900 text-white text-xs font-mono px-3 py-2 rounded shadow-lg border border-gray-600 whitespace-nowrap z-50">
                        {!selectedAircraft ? 'No plane selected. Please select a plane first.' : 'The plane needs to be cleared to FL070 or lower'}
                      </div>
                    )}
                  </div>

                  {/* VOR 12R Button */}
                  <div className="relative group">
                    <button
                      onClick={() => {
                        const plane = aircraft.find(p => p.id === selectedAircraft);
                        if (plane && plane.assignedAltitude <= 7000) {
                          onOpenVORPanel();
                          setArrivalsSubmenuOpen(false);
                          setCommandsMenuOpen(false);
                        }
                      }}
                      disabled={!selectedAircraft || !aircraft.find(p => p.id === selectedAircraft && p.assignedAltitude <= 7000)}
                      className={`w-full px-4 py-2 text-left font-mono text-sm ${
                        selectedAircraft && aircraft.find(p => p.id === selectedAircraft && p.assignedAltitude <= 7000)
                          ? 'text-white hover:bg-gray-600 cursor-pointer'
                          : 'text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      VOR 12R
                    </button>
                    {(!selectedAircraft || !aircraft.find(p => p.id === selectedAircraft && p.assignedAltitude <= 7000)) && (
                      <div className="absolute left-full top-0 ml-2 hidden group-hover:block bg-gray-900 text-white text-xs font-mono px-3 py-2 rounded shadow-lg border border-gray-600 whitespace-nowrap z-50">
                        {!selectedAircraft ? 'No plane selected. Please select a plane first.' : 'The plane needs to be cleared to FL070 or lower'}
                      </div>
                    )}
                  </div>

                  {/* Visual Button */}
                  <div className="relative group">
                    <button
                      onClick={() => {
                        const plane = aircraft.find(p => p.id === selectedAircraft);
                        if (plane && plane.assignedAltitude <= 10000) {
                          onOpenVisualPanel();
                          setArrivalsSubmenuOpen(false);
                          setCommandsMenuOpen(false);
                        }
                      }}
                      disabled={!selectedAircraft || !aircraft.find(p => p.id === selectedAircraft && p.assignedAltitude <= 10000)}
                      className={`w-full px-4 py-2 text-left font-mono text-sm ${
                        selectedAircraft && aircraft.find(p => p.id === selectedAircraft && p.assignedAltitude <= 10000)
                          ? 'text-white hover:bg-gray-600 cursor-pointer'
                          : 'text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Visual
                    </button>
                    {(!selectedAircraft || !aircraft.find(p => p.id === selectedAircraft && p.assignedAltitude <= 10000)) && (
                      <div className="absolute left-full top-0 ml-2 hidden group-hover:block bg-gray-900 text-white text-xs font-mono px-3 py-2 rounded shadow-lg border border-gray-600 whitespace-nowrap z-50">
                        {!selectedAircraft ? 'No plane selected. Please select a plane first.' : 'The plane needs to be cleared to FL100 or lower'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Delete Plane Button */}
            <div className="relative group">
              <button
                onClick={() => {
                  if (selectedAircraft) {
                    onOpenDeletePanel();
                    setCommandsMenuOpen(false);
                  }
                }}
                disabled={!selectedAircraft}
                className={`w-full px-4 py-2 text-left font-mono text-sm ${
                  selectedAircraft
                    ? 'text-white hover:bg-gray-600 cursor-pointer'
                    : 'text-gray-500 cursor-not-allowed'
                }`}
              >
                Delete Plane
              </button>
              {!selectedAircraft && (
                <div className="absolute left-full top-0 ml-2 hidden group-hover:block bg-gray-900 text-white text-xs font-mono px-3 py-2 rounded shadow-lg border border-gray-600 whitespace-nowrap z-50">
                  No plane selected. Please select a plane first.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* System Button */}
      <div className="relative" ref={systemMenuRef}>
        <button
          onClick={() => setSystemMenuOpen(!systemMenuOpen)}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-mono text-sm"
        >
          System
        </button>

        {systemMenuOpen && (
          <div
            className="absolute bottom-full left-0 mb-2 bg-gray-700 rounded shadow-lg border border-gray-600 min-w-[180px] z-50"
          >
            <button
              onClick={() => {
                setSystemMenuOpen(false);
                onOpenScenarioPanel();
              }}
              className="w-full px-4 py-2 text-left font-mono text-sm text-white hover:bg-gray-600 cursor-pointer"
            >
              Load Scenario
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-end gap-6 text-gray-300 font-mono text-xs">
        {/* Simulation Speed Control */}
        <div className="flex items-center gap-3">
          <label className="text-gray-300">Speed:</label>
          <input
            type="range"
            min="1"
            max="100"
            step="0.5"
            value={simulationSpeed}
            onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
            className="w-32 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((simulationSpeed - 1) / 99) * 100}%, #4b5563 ${((simulationSpeed - 1) / 99) * 100}%, #4b5563 100%)`
            }}
          />
          <span className="text-white min-w-[40px]">{simulationSpeed.toFixed(1)}x</span>
        </div>

        <div>Zoom: {zoom.toFixed(1)}x</div>
      </div>
    </div>
  );
};
export default ControlPanel;