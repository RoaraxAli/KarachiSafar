import { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { RouteSearchForm } from './components/RouteSearchForm';
import { TripCard } from './components/TripCard';
import { MapView } from './components/MapView';
import { RouteExplorer } from './components/RouteExplorer';
import { ChingchiDirectory } from './components/ChingchiDirectory';
import { FareCalculator } from './components/FareCalculator';
import { NavigationMode } from './components/NavigationMode';
import { planJourney, filterPlans } from './lib/graphRouter';
import type { TripPlan, TransitRoute, ChingchiAdda } from './types/transit';
import { STOPS } from './data/transitData';
import { AlertCircle, Sparkles, Compass, Bus } from 'lucide-react';

export function App() {
  // App navigation state
  const [activeTab, setActiveTab] = useState<'PLANNER' | 'EXPLORER' | 'CHINGCHI_ADDAS' | 'FARES'>('PLANNER');
  const [lang, setLang] = useState<'en' | 'ur'>('en');

  // Journey Planner State - defaults to the user's test case!
  const [originStopId, setOriginStopId] = useState<string>('buffer-zone-15a');
  const [destStopId, setDestStopId] = useState<string>('capri-cinema');
  const [filter, setFilter] = useState<'ALL' | 'FASTEST' | 'CHEAPEST' | 'COMFORTABLE' | 'CHINGCHI'>('ALL');
  const [allowChingchi, setAllowChingchi] = useState<boolean>(false); // OFF by default as per user instructions
  const [selectedPlan, setSelectedPlan] = useState<TripPlan | null>(null);

  // Route Explorer State
  const [selectedExplorerRoute, setSelectedExplorerRoute] = useState<TransitRoute | null>(null);

  // Active Navigation Simulator
  const [navigatingPlan, setNavigatingPlan] = useState<TripPlan | null>(null);

  // Generate plans whenever origin, destination, or allowChingchi changes
  const rawPlans = useMemo(() => {
    return planJourney(originStopId, destStopId, allowChingchi);
  }, [originStopId, destStopId, allowChingchi]);

  const displayedPlans = useMemo(() => {
    return filterPlans(rawPlans, filter);
  }, [rawPlans, filter]);

  // Automatically select the first/top plan when plans change
  useEffect(() => {
    if (displayedPlans.length > 0) {
      setSelectedPlan(displayedPlans[0]);
    } else {
      setSelectedPlan(null);
    }
  }, [displayedPlans]);

  // Load the test case shortcut (Buffer Zone 15-A to Capri Cinema)
  const handleOpenQuickDemo = () => {
    setOriginStopId('buffer-zone-15a');
    setDestStopId('capri-cinema');
    setActiveTab('PLANNER');
    setFilter('ALL');
  };

  const handleSelectAdda = (adda: ChingchiAdda) => {
    // Find closest stop to adda
    const match = Object.values(STOPS).find(
      (s) => Math.hypot(s.lat - adda.lat, s.lng - adda.lng) < 0.005
    );
    if (match) {
      setOriginStopId(match.id);
    }
    setActiveTab('PLANNER');
  };

  const handleSelectRouteFromExplorer = (route: TransitRoute) => {
    setSelectedExplorerRoute(route);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white pb-12">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        onOpenQuickDemo={handleOpenQuickDemo}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* TAB 1: JOURNEY PLANNER */}
        {activeTab === 'PLANNER' && (
          <div className="space-y-5">
            {/* Search Input Form */}
            <RouteSearchForm
              originStopId={originStopId}
              destStopId={destStopId}
              setOriginStopId={setOriginStopId}
              setDestStopId={setDestStopId}
              onSearch={() => {}}
              filter={filter}
              setFilter={setFilter}
              allowChingchi={allowChingchi}
              setAllowChingchi={setAllowChingchi}
              lang={lang}
            />

            {/* Split View: Map on Left / Top, Trip Options on Right / Bottom */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Map Column */}
              <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-3">
                <MapView
                  selectedPlan={selectedPlan}
                  selectedRoute={null}
                  originStopId={originStopId}
                  destStopId={destStopId}
                  lang={lang}
                />

                {/* Map Context Bar */}
                {selectedPlan && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-semibold text-slate-200">
                        {lang === 'ur' ? 'منتخب راستہ میپ پر ہائی لائٹ ہے' : 'Active Route Polyline Displayed'}
                      </span>
                    </div>
                    <span className="text-slate-400 font-mono">
                      {selectedPlan.totalDistanceKm} km • {selectedPlan.totalDurationMinutes} mins
                    </span>
                  </div>
                )}
              </div>

              {/* Trip Cards List Column */}
              <div className="lg:col-span-6 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {lang === 'ur'
                      ? `دستیاب راستے (${displayedPlans.length})`
                      : `Multimodal Journey Options (${displayedPlans.length})`}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-medium">
                    ⚡ Live Dijkstra Routing
                  </div>
                </div>

                {displayedPlans.length > 0 ? (
                  <div className="space-y-3">
                    {displayedPlans.map((plan) => (
                      <TripCard
                        key={plan.id}
                        plan={plan}
                        isSelected={selectedPlan?.id === plan.id}
                        onSelect={(p) => setSelectedPlan(p)}
                        onStartNavigation={(p) => setNavigatingPlan(p)}
                        lang={lang}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-900/70 border border-slate-800 rounded-2xl space-y-3">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                    <div className="text-sm font-bold text-white">No direct transit route found</div>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Try selecting nearby major transit hubs (e.g. Nagan Chowrangi, Board Office, Numaish, NIPA, Sohrab Goth, or Tower).
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ROUTE EXPLORER */}
        {activeTab === 'EXPLORER' && (
          <div className="space-y-5">
            {/* Map Preview for Explorer */}
            {selectedExplorerRoute && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs px-1 text-slate-400">
                  <span className="font-semibold text-slate-300">
                    Viewing {selectedExplorerRoute.code} ({selectedExplorerRoute.stops.length} stops) on map:
                  </span>
                  <span className="text-emerald-400 font-bold">
                    Rs. {typeof selectedExplorerRoute.fare === 'number' ? selectedExplorerRoute.fare : selectedExplorerRoute.fare.min}
                  </span>
                </div>
                <MapView
                  selectedPlan={null}
                  selectedRoute={selectedExplorerRoute}
                  originStopId={originStopId}
                  destStopId={destStopId}
                  lang={lang}
                />
              </div>
            )}

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
              lang={lang}
            />
          </div>
        )}

        {/* TAB 3: CHINGCHI ADDA DIRECTORY */}
        {activeTab === 'CHINGCHI_ADDAS' && (
          <ChingchiDirectory onSelectAdda={handleSelectAdda} lang={lang} />
        )}

        {/* TAB 4: FARES & BYKEA CALCULATOR */}
        {activeTab === 'FARES' && <FareCalculator lang={lang} />}
      </main>

      {/* Navigation Mode Cockpit Modal */}
      {navigatingPlan && (
        <NavigationMode
          plan={navigatingPlan}
          onExit={() => setNavigatingPlan(null)}
          lang={lang}
        />
      )}

      {/* Mobile Sticky Quick Switcher Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md px-3 py-2 sm:hidden">
        <div className="flex items-center justify-around text-[10px]">
          <button
            onClick={() => setActiveTab('PLANNER')}
            className={`flex flex-col items-center gap-0.5 cursor-pointer ${
              activeTab === 'PLANNER' ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{lang === 'ur' ? 'منصوبہ' : 'Plan'}</span>
          </button>

          <button
            onClick={() => setActiveTab('EXPLORER')}
            className={`flex flex-col items-center gap-0.5 cursor-pointer ${
              activeTab === 'EXPLORER' ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Bus className="w-4 h-4" />
            <span>{lang === 'ur' ? 'روٹس' : 'Routes'}</span>
          </button>

          <button
            onClick={() => setActiveTab('CHINGCHI_ADDAS')}
            className={`flex flex-col items-center gap-0.5 cursor-pointer ${
              activeTab === 'CHINGCHI_ADDAS' ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <span className="text-sm">🛺</span>
            <span>{lang === 'ur' ? 'اڈے' : 'Addas'}</span>
          </button>

          <button
            onClick={handleOpenQuickDemo}
            className="flex flex-col items-center gap-0.5 text-amber-400 font-bold cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{lang === 'ur' ? 'ٹیسٹ کیس' : 'Demo'}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
