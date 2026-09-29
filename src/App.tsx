import { useState, useEffect, useMemo } from 'react';
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
import { AlertCircle, Sparkles, Compass, ChevronLeft, ChevronRight } from 'lucide-react';

export function App() {
  // Sidebar state: open by default
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
    setIsSidebarOpen(true);
  };

  const handleSelectAdda = (adda: ChingchiAdda) => {
    const match = Object.values(STOPS).find(
      (s) => Math.hypot(s.lat - adda.lat, s.lng - adda.lng) < 0.005
    );
    if (match) {
      setOriginStopId(match.id);
    }
    setActiveTab('PLANNER');
    setIsSidebarOpen(true);
  };

  const handleSelectRouteFromExplorer = (route: TransitRoute) => {
    setSelectedExplorerRoute(route);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex relative bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* ============================================================ */}
      {/* 1. SIDEBAR (Docked on Left, Collapsible, Clean & Uncluttered) */}
      {/* ============================================================ */}
      <aside
        className={`h-full flex flex-col z-20 bg-slate-950 sm:bg-slate-900/95 border-r border-slate-800 shadow-2xl backdrop-blur-2xl transition-all duration-300 ease-in-out absolute sm:relative inset-y-0 left-0 ${
          isSidebarOpen
            ? 'w-full sm:w-[420px] md:w-[450px] lg:w-[460px] translate-x-0'
            : 'w-0 -translate-x-full sm:translate-x-0 sm:w-0 overflow-hidden pointer-events-none border-none'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between gap-2 flex-shrink-0">
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => setActiveTab('PLANNER')}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-base shadow-sm">
              🛺
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1">
                Karachi Safar
                <span className="text-emerald-400 text-xs font-semibold urdu-font">(کراچی سفر)</span>
              </h1>
              <p className="text-[10px] text-slate-400 leading-none">
                {lang === 'ur' ? 'ملٹی ماڈل ٹرانزٹ' : 'Multimodal Transit Navigator'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Demo Button */}
            <button
              onClick={handleOpenQuickDemo}
              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition cursor-pointer flex items-center gap-1"
              title="Demo: Buffer Zone to Capri Cinema"
            >
              <Sparkles className="w-3 h-3" />
              <span>Demo</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-amber-400 border border-slate-700 transition cursor-pointer"
              title="Toggle Language"
            >
              {lang === 'en' ? 'اردو' : 'EN'}
            </button>

            {/* Collapse Sidebar Button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Collapse Sidebar (Full Map)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex items-center border-b border-slate-800/80 bg-slate-900/60 p-1 flex-shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('PLANNER')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition cursor-pointer text-center ${
              activeTab === 'PLANNER'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'ur' ? 'سفر پلان' : 'Plan'}
          </button>
          <button
            onClick={() => setActiveTab('EXPLORER')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition cursor-pointer text-center ${
              activeTab === 'EXPLORER'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'ur' ? 'روٹس (92)' : 'Routes (92)'}
          </button>
          <button
            onClick={() => setActiveTab('CHINGCHI_ADDAS')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition cursor-pointer text-center ${
              activeTab === 'CHINGCHI_ADDAS'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'ur' ? 'اڈے' : 'Addas'}
          </button>
          <button
            onClick={() => setActiveTab('FARES')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition cursor-pointer text-center ${
              activeTab === 'FARES'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'ur' ? 'کرایہ' : 'Fares'}
          </button>
        </div>

        {/* Scrollable Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
          {activeTab === 'PLANNER' && (
            <div className="space-y-3">
              {/* Clean Route Search Inputs */}
              <RouteSearchForm
                originStopId={originStopId}
                destStopId={destStopId}
                setOriginStopId={setOriginStopId}
                setDestStopId={setDestStopId}
                filter={filter}
                setFilter={setFilter}
                allowChingchi={allowChingchi}
                setAllowChingchi={setAllowChingchi}
                lang={lang}
              />

              {/* Journey Options List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {lang === 'ur' ? `راستے (${displayedPlans.length})` : `Journey Options (${displayedPlans.length})`}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    ⚡ Live Dijkstra
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
                        lang={lang}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                    <AlertCircle className="w-6 h-6 text-amber-400 mx-auto" />
                    <div className="text-xs font-bold text-white">No direct transit route found</div>
                    <p className="text-[11px] text-slate-400">
                      Try selecting nearby major transit hubs (Nagan, NIPA, Sohrab Goth, or Saddar).
                    </p>
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
              lang={lang}
            />
          )}

          {activeTab === 'CHINGCHI_ADDAS' && (
            <ChingchiDirectory onSelectAdda={handleSelectAdda} lang={lang} />
          )}

          {activeTab === 'FARES' && <FareCalculator lang={lang} />}
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. THE BIG MAP (Fills all remaining space, persistent & deep) */}
      {/* ============================================================ */}
      <main className="flex-1 h-full relative z-10 overflow-hidden">
        <MapView
          selectedPlan={activeTab === 'PLANNER' ? selectedPlan : null}
          selectedRoute={activeTab === 'EXPLORER' ? selectedExplorerRoute : null}
          originStopId={originStopId}
          destStopId={destStopId}
          lang={lang}
          className="w-full h-full relative"
        />

        {/* Floating Button to Re-Open Sidebar when Collapsed */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-[400] flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/95 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 shadow-2xl backdrop-blur-md transition-all cursor-pointer hover:border-emerald-500/50"
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'ur' ? 'سفر پلانر کھولیں' : 'Open Transit Navigator'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}

        {/* Floating Active Route Information Pill (Top-Center of Map) */}
        {selectedPlan && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white truncate max-w-xs">{selectedPlan.title}</span>
            <span className="text-slate-400 font-mono text-[11px]">
              {selectedPlan.totalDurationMinutes}m • Rs. {selectedPlan.totalFarePKR}
            </span>
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* 3. SIMULATED LIVE NAVIGATION MODAL */}
      {/* ============================================================ */}
      {navigatingPlan && (
        <NavigationMode
          plan={navigatingPlan}
          onExit={() => setNavigatingPlan(null)}
          lang={lang}
        />
      )}
    </div>
  );
}

export default App;
