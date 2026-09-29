import { useState, useMemo } from 'react';
import { Search, Bus, Eye, Clock, Banknote, Shield } from 'lucide-react';
import { ROUTES, STOPS } from '../data/transitData';
import type { TransitRoute, TransitMode } from '../types/transit';

interface RouteExplorerProps {
  onSelectRoute: (route: TransitRoute) => void;
  selectedRouteId: string | null;
  onSetAsOrigin: (stopId: string) => void;
  onSetAsDestination: (stopId: string) => void;
  lang: 'en' | 'ur';
}

export const RouteExplorer: React.FC<RouteExplorerProps> = ({
  onSelectRoute,
  selectedRouteId,
  onSetAsOrigin,
  onSetAsDestination,
  lang,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | TransitMode>('ALL');
  const [selectedRouteInternal, setSelectedRouteInternal] = useState<TransitRoute | null>(
    ROUTES.find((r) => r.id === selectedRouteId) || ROUTES[0]
  );

  const filteredRoutes = useMemo(() => {
    return ROUTES.filter((r) => {
      const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.urduName.includes(q) ||
        r.stops.some((sId) => STOPS[sId]?.name.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [search, categoryFilter]);

  const [activeView, setActiveView] = useState<'LIST' | 'DETAIL'>('LIST');

  const handleRouteClick = (route: TransitRoute) => {
    setSelectedRouteInternal(route);
    onSelectRoute(route);
    setActiveView('DETAIL');
  };

  const getModeLabel = (mode: TransitMode) => {
    switch (mode) {
      case 'CHINGCHI':
        return '🛺 6-Seater Chingchi';
      case 'BRT':
        return '🟢 Green Line BRT';
      case 'RED_BUS':
        return '🔴 Peoples Red Bus';
      case 'EV_BUS':
        return '⚡ Peoples Electric (EV)';
      case 'LOCAL_BUS':
        return '🚌 Minibus & Coach';
      default:
        return mode;
    }
  };

  const counts = useMemo(() => {
    return {
      ALL: ROUTES.length,
      CHINGCHI: ROUTES.filter((r) => r.category === 'CHINGCHI').length,
      BRT: ROUTES.filter((r) => r.category === 'BRT').length,
      RED_BUS: ROUTES.filter((r) => r.category === 'RED_BUS').length,
      EV_BUS: ROUTES.filter((r) => r.category === 'EV_BUS').length,
      LOCAL_BUS: ROUTES.filter((r) => r.category === 'LOCAL_BUS').length,
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Header and Search */}
      <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bus className="w-5 h-5 text-emerald-400" />
              <span>{lang === 'ur' ? 'کراچی ٹرانسپورٹ روٹ ڈائریکٹری' : 'Karachi Transit Routes Directory'}</span>
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'ur'
                ? `${counts.ALL} تصدیق شدہ روٹس: ${counts.CHINGCHI} چنگچی کوریڈورز، بی آر ٹی، ریڈ بس، ای وی اور روایتی منی بسیں`
                : `${counts.ALL} Verified Routes: ${counts.CHINGCHI} Qingqi Feeders, Green Line BRT, Red Bus, Electric Bus & Iconic Minibuses`}
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-slate-900 text-emerald-400 font-bold border border-slate-700">
              {filteredRoutes.length} Routes
            </span>
          </div>
        </div>

        {/* Search input */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              lang === 'ur'
                ? 'روٹ کوڈ یا اسٹاپ تلاش کریں (مثلاً W-11، A-18، K-18، R-4، ناگن)...'
                : 'Search by route code, name, or stop (e.g. W-11, A-18, K-18, R-4, Nagan)...'
            }
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border transition cursor-pointer ${
              categoryFilter === 'ALL'
                ? 'bg-white text-slate-900 border-white'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            All ({counts.ALL})
          </button>
          <button
            onClick={() => setCategoryFilter('CHINGCHI')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border transition cursor-pointer ${
              categoryFilter === 'CHINGCHI'
                ? 'bg-purple-600 text-white border-purple-400'
                : 'bg-slate-900 text-purple-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            🛺 Chingchi ({counts.CHINGCHI})
          </button>
          <button
            onClick={() => setCategoryFilter('BRT')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border transition cursor-pointer ${
              categoryFilter === 'BRT'
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-slate-900 text-emerald-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            🟢 Green Line BRT ({counts.BRT})
          </button>
          <button
            onClick={() => setCategoryFilter('RED_BUS')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border transition cursor-pointer ${
              categoryFilter === 'RED_BUS'
                ? 'bg-red-600 text-white border-red-400'
                : 'bg-slate-900 text-red-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            🔴 Red Bus PBS ({counts.RED_BUS})
          </button>
          <button
            onClick={() => setCategoryFilter('EV_BUS')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border transition cursor-pointer ${
              categoryFilter === 'EV_BUS'
                ? 'bg-cyan-600 text-white border-cyan-400'
                : 'bg-slate-900 text-cyan-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            ⚡ Electric EV ({counts.EV_BUS})
          </button>
          <button
            onClick={() => setCategoryFilter('LOCAL_BUS')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border transition cursor-pointer ${
              categoryFilter === 'LOCAL_BUS'
                ? 'bg-amber-600 text-white border-amber-400'
                : 'bg-slate-900 text-amber-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            🚌 Minibuses & Coaches ({counts.LOCAL_BUS})
          </button>
        </div>

        {/* Regulatory Chingchi Tip */}
        <div className="mt-3 px-3 py-2 rounded-xl bg-purple-950/20 border border-purple-800/30 text-[11px] text-purple-200/90 flex items-center justify-between gap-2">
          <span>
            {lang === 'ur'
              ? '💡 معلوماتی نوٹ: سفر پلانر میں چنگچی رکشے حکومتی بندش اور حفاظتی وجوہات کی بنا پر پہلے سے بند (OFF) ہیں۔ آپ سرچ فارم میں "چنگچی شامل کریں" ٹوگل آن کر کے استعمال کر سکتے ہیں۔'
              : '💡 Note on Qingqi Routing: In the Journey Planner, Chingchis are OFF by default due to periodic municipal crackdowns & safety bans. Enable the "Include Chingchi" toggle in the search bar to route via them.'}
          </span>
        </div>
      </div>

      {/* Content: Either Detail View or List View */}
      {activeView === 'DETAIL' && selectedRouteInternal ? (
        <div className="space-y-3">
          {/* Back button */}
          <button
            onClick={() => setActiveView('LIST')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <span>← {lang === 'ur' ? 'روٹس کی فہرست پر واپس جائیں' : 'Back to Routes List'}</span>
          </button>

          {/* Selected Route Detail */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3">
            {/* Route Heading */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-2.5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="px-2.5 py-0.5 rounded text-xs font-extrabold text-white"
                    style={{ backgroundColor: selectedRouteInternal.color }}
                  >
                    {selectedRouteInternal.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    {getModeLabel(selectedRouteInternal.category)}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {lang === 'ur' ? selectedRouteInternal.urduName : selectedRouteInternal.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {lang === 'ur'
                    ? selectedRouteInternal.urduDescription
                    : selectedRouteInternal.description}
                </p>
              </div>
            </div>

            {/* Route Attributes */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
                <div className="text-slate-400 flex items-center gap-1 mb-0.5">
                  <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fare</span>
                </div>
                <div className="font-bold text-white text-xs sm:text-sm">
                  Rs. {typeof selectedRouteInternal.fare === 'number'
                    ? selectedRouteInternal.fare
                    : `${selectedRouteInternal.fare.min} - ${selectedRouteInternal.fare.max}`}
                </div>
              </div>

              <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
                <div className="text-slate-400 flex items-center gap-1 mb-0.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Frequency</span>
                </div>
                <div className="font-bold text-white text-xs sm:text-sm">
                  {typeof selectedRouteInternal.intervalMinutes === 'number'
                    ? `${selectedRouteInternal.intervalMinutes} mins`
                    : `${selectedRouteInternal.intervalMinutes.min}-${selectedRouteInternal.intervalMinutes.max} mins`}
                </div>
              </div>

              <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
                <div className="text-slate-400 flex items-center gap-1 mb-0.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Type</span>
                </div>
                <div className="font-bold text-white text-xs">
                  {selectedRouteInternal.comfort === 'AC' ? 'Air-Conditioned ❄️' : 'Regular Open-Air'}
                </div>
              </div>

              <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
                <div className="text-slate-400 flex items-center gap-1 mb-0.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Hours</span>
                </div>
                <div className="font-bold text-white text-xs truncate">
                  {selectedRouteInternal.operatingHours}
                </div>
              </div>
            </div>

            {/* Stop Sequence */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Stops ({selectedRouteInternal.stops.length})
              </h4>
              <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                {selectedRouteInternal.stops.map((stopId, sIdx) => {
                  const stop = STOPS[stopId];
                  if (!stop) return null;
                  return (
                    <div
                      key={stopId}
                      className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-between text-xs hover:border-slate-600 transition"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="w-4 h-4 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-mono font-bold text-[9px] flex-shrink-0">
                          {sIdx + 1}
                        </span>
                        <div className="truncate">
                          <span className="font-medium text-white text-xs">
                            {lang === 'ur' ? stop.urduName : stop.name}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">({stop.area})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => onSetAsOrigin(stop.id)}
                          className="px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-medium text-[9px] transition cursor-pointer"
                        >
                          From
                        </button>
                        <button
                          onClick={() => onSetAsDestination(stop.id)}
                          className="px-1.5 py-0.5 rounded bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white font-medium text-[9px] transition cursor-pointer"
                        >
                          To
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Route List View */
        <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {filteredRoutes.map((route) => {
            const isSelected = selectedRouteInternal?.id === route.id;
            return (
              <div
                key={route.id}
                onClick={() => handleRouteClick(route)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800/90'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: route.color }}
                  >
                    {route.code}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Rs. {typeof route.fare === 'number' ? route.fare : `${route.fare.min}-${route.fare.max}`}
                  </span>
                </div>

                <div className="font-semibold text-xs sm:text-sm text-slate-100 line-clamp-1">
                  {lang === 'ur' ? route.urduName : route.name}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>{route.stops.length} stops</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                    <Eye className="w-3 h-3" />
                    <span>Plot on map</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
