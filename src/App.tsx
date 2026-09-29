import { useState, useEffect, useMemo } from 'react';
import { RouteSearchForm } from './components/RouteSearchForm';
import { TripCard } from './components/TripCard';
import { MapView } from './components/MapView';
import { RouteExplorer } from './components/RouteExplorer';
import { NavigationMode } from './components/NavigationMode';
import { planJourney, filterPlans } from './lib/graphRouter';
import type { TripPlan, TransitRoute, FilterCategory } from './types/transit';
import { ROUTES } from './data/transitData';
import { Compass, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

export function App() {
  // Sidebar state: open by default
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // App navigation state: Clean, production-ready tabs
  const [activeTab, setActiveTab] = useState<'PLANNER' | 'EXPLORER'>('PLANNER');

  // Journey Planner State - Clean empty state initially
  const [originStopId, setOriginStopId] = useState<string>('');
  const [destStopId, setDestStopId] = useState<string>('');
  const [filter, setFilter] = useState<FilterCategory>('ALL');
  const [selectedPlan, setSelectedPlan] = useState<TripPlan | null>(null);

  // Route Explorer State
  const [selectedExplorerRoute, setSelectedExplorerRoute] = useState<TransitRoute | null>(null);

  // Active Navigation Simulator
  const [navigatingPlan, setNavigatingPlan] = useState<TripPlan | null>(null);

  // Generate plans ONLY when both origin and destination are selected
  const rawPlans = useMemo(() => {
    if (!originStopId || !destStopId || originStopId === destStopId) {
      return [];
    }
    return planJourney(originStopId, destStopId);
  }, [originStopId, destStopId]);

  const displayedPlans = useMemo(() => {
    return filterPlans(rawPlans, filter);
  }, [rawPlans, filter]);

  // Automatically select the top plan when plans change
  useEffect(() => {
    if (displayedPlans.length > 0) {
      setSelectedPlan(displayedPlans[0]);
    } else {
      setSelectedPlan(null);
    }
  }, [displayedPlans]);

  const handleSelectRouteFromExplorer = (route: TransitRoute) => {
    setSelectedExplorerRoute(route);
  };

  const hasSearch = originStopId !== '' && destStopId !== '';

  return (
    <div className="h-screen w-screen overflow-hidden flex relative bg-slate-100 text-slate-800 font-sans selection:bg-slate-900 selection:text-white">
      {/* ============================================================ */}
      {/* 1. PROFESSIONAL EXECUTIVE SIDEBAR (White theme)               */}
      {/* ============================================================ */}
      <aside
        className={`h-full flex flex-col z-20 bg-white border-r border-slate-200 shadow-xl transition-all duration-300 ease-in-out absolute sm:relative inset-y-0 left-0 ${
          isSidebarOpen
            ? 'w-full sm:w-[420px] md:w-[450px] lg:w-[460px] translate-x-0'
            : 'w-0 -translate-x-full sm:translate-x-0 sm:w-0 overflow-hidden pointer-events-none border-none'
        }`}
      >
        {/* Sidebar Header: Executive Clean Bar */}
        <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between gap-2 flex-shrink-0">
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => setActiveTab('PLANNER')}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-sm font-bold shadow-sm tracking-wide">
              KS
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Karachi Safar
              </h1>
              <p className="text-[11px] text-slate-500 leading-none">
                Public Transit Navigator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Collapse Sidebar Button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/80 p-1 flex-shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('PLANNER')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer text-center ${
              activeTab === 'PLANNER'
                ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Plan Trip
          </button>
          <button
            onClick={() => setActiveTab('EXPLORER')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer text-center ${
              activeTab === 'EXPLORER'
                ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Routes ({ROUTES.length})
          </button>
        </div>

        {/* Scrollable Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-slate-50/40">
          {activeTab === 'PLANNER' && (
            <div className="space-y-3">
              {/* Route Search Form */}
              <RouteSearchForm
                originStopId={originStopId}
                destStopId={destStopId}
                setOriginStopId={setOriginStopId}
                setDestStopId={setDestStopId}
                filter={filter}
                setFilter={setFilter}
              />

              {/* Journey Options List or Empty State */}
              <div className="space-y-2">
                {hasSearch ? (
                  <>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Transit Options ({displayedPlans.length})
                      </span>
                    </div>

                    {displayedPlans.length > 0 ? (
                      <div className="space-y-2.5">
                        {displayedPlans.map((plan) => (
                          <TripCard
                            key={plan.id}
                            plan={plan}
                            isSelected={selectedPlan?.id === plan.id}
                            onSelect={(p) => setSelectedPlan(p)}
                            onStartNavigation={(p) => setNavigatingPlan(p)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-white border border-slate-200 rounded-xl space-y-2 shadow-sm">
                        <MapPin className="w-6 h-6 text-slate-400 mx-auto" />
                        <div className="text-xs font-bold text-slate-800">No direct connection found</div>
                        <p className="text-[11px] text-slate-500">
                          Try choosing major transit corridors such as Nagan Chowrangi, NIPA, Sohrab Goth, or Saddar.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  /* Clean Production-Ready Empty State */
                  <div className="p-8 text-center bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 mx-auto flex items-center justify-center border border-slate-200">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                        Plan Your Transit Route
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                        Select an origin and destination above to compute realistic multimodal transit routes across Karachi.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'EXPLORER' && (
            <RouteExplorer
              onSelectRoute={handleSelectRouteFromExplorer}
              selectedRouteId={selectedExplorerRoute?.id || null}
              onSetAsOrigin={(stopId) => {
                setOriginStopId(stopId);
                setActiveTab('PLANNER');
              }}
              onSetAsDestination={(stopId) => {
                setDestStopId(stopId);
                setActiveTab('PLANNER');
              }}
            />
          )}
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. THE TRANSIT MAP (Full size, responsive, dominant)          */}
      {/* ============================================================ */}
      <main className="flex-1 h-full relative z-10 overflow-hidden bg-slate-200">
        <MapView
          selectedPlan={activeTab === 'PLANNER' ? selectedPlan : null}
          selectedRoute={activeTab === 'EXPLORER' ? selectedExplorerRoute : null}
          originStopId={originStopId}
          destStopId={destStopId}
          className="w-full h-full relative"
        />

        {/* Floating Button to Re-Open Sidebar when Collapsed */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-[400] flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 shadow-md transition-all cursor-pointer hover:border-slate-400"
          >
            <Compass className="w-4 h-4 text-slate-800" />
            <span>Open Transit Navigator</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}

        {/* Floating Active Route Information Pill (Top-Center of Map) */}
        {selectedPlan && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/95 border border-slate-200 shadow-md text-xs text-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-bold text-slate-900 truncate max-w-xs">{selectedPlan.title}</span>
            <span className="text-slate-500 font-mono text-[11px]">
              {selectedPlan.totalDurationMinutes} mins • {selectedPlan.totalDistanceKm} km
            </span>
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* 3. SIMULATED LIVE NAVIGATION MODAL                           */}
      {/* ============================================================ */}
      {navigatingPlan && (
        <NavigationMode
          plan={navigatingPlan}
          onExit={() => setNavigatingPlan(null)}
        />
      )}
    </div>
  );
}

export default App;
