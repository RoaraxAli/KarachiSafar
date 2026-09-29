import { useState, useMemo } from 'react';
import { Search, Bus, Eye, Clock, Shield, ArrowLeft } from 'lucide-react';
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
  const [activeView, setActiveView] = useState<'LIST' | 'DETAIL'>('LIST');

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

  const handleRouteClick = (route: TransitRoute) => {
    setSelectedRouteInternal(route);
    onSelectRoute(route);
    setActiveView('DETAIL');
  };

  const getModeLabel = (mode: TransitMode) => {
    switch (mode) {
      case 'CHINGCHI':
        return '🛺 Qingqi Feeder';
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
    <div className="space-y-3">
      {/* Header and Search */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Bus className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              {lang === 'ur' ? 'روٹ ڈائریکٹری' : 'Transit Routes Directory'}
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {filteredRoutes.length} Routes
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              lang === 'ur'
                ? 'روٹ کوڈ یا اسٹاپ تلاش کریں (مثلاً W-11، A-18، R-4)...'
                : 'Search route code or stop (e.g. W-11, A-18, R-4)...'
            }
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition cursor-pointer whitespace-nowrap ${
              categoryFilter === 'ALL'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            All ({counts.ALL})
          </button>
          <button
            onClick={() => setCategoryFilter('CHINGCHI')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition cursor-pointer whitespace-nowrap ${
              categoryFilter === 'CHINGCHI'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            🛺 Qingqi ({counts.CHINGCHI})
          </button>
          <button
            onClick={() => setCategoryFilter('BRT')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition cursor-pointer whitespace-nowrap ${
              categoryFilter === 'BRT'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            🟢 BRT ({counts.BRT})
          </button>
          <button
            onClick={() => setCategoryFilter('RED_BUS')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition cursor-pointer whitespace-nowrap ${
              categoryFilter === 'RED_BUS'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            🔴 Red Bus ({counts.RED_BUS})
          </button>
          <button
            onClick={() => setCategoryFilter('EV_BUS')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition cursor-pointer whitespace-nowrap ${
              categoryFilter === 'EV_BUS'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            ⚡ EV ({counts.EV_BUS})
          </button>
          <button
            onClick={() => setCategoryFilter('LOCAL_BUS')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition cursor-pointer whitespace-nowrap ${
              categoryFilter === 'LOCAL_BUS'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            🚌 Minibuses ({counts.LOCAL_BUS})
          </button>
        </div>
      </div>

      {/* Content: Either Detail View or List View */}
      {activeView === 'DETAIL' && selectedRouteInternal ? (
        <div className="space-y-2.5">
          {/* Back button */}
          <button
            onClick={() => setActiveView('LIST')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 shadow-sm transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === 'ur' ? 'روٹس کی فہرست' : 'Back to Routes List'}</span>
          </button>

          {/* Selected Route Detail */}
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm space-y-2.5">
            {/* Route Heading */}
            <div className="border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: selectedRouteInternal.color }}
                >
                  {selectedRouteInternal.code}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  {getModeLabel(selectedRouteInternal.category)}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {lang === 'ur' ? selectedRouteInternal.urduName : selectedRouteInternal.name}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {lang === 'ur'
                  ? selectedRouteInternal.urduDescription
                  : selectedRouteInternal.description}
              </p>
            </div>

            {/* Route Attributes (Fares removed) */}
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <div className="text-slate-500 flex items-center gap-1 mb-0.5 text-[10px]">
                  <Clock className="w-3 h-3 text-blue-600" />
                  <span>Headway</span>
                </div>
                <div className="font-bold text-slate-900 text-xs">
                  {typeof selectedRouteInternal.intervalMinutes === 'number'
                    ? `${selectedRouteInternal.intervalMinutes}m`
                    : `${selectedRouteInternal.intervalMinutes.min}-${selectedRouteInternal.intervalMinutes.max}m`}
                </div>
              </div>

              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <div className="text-slate-500 flex items-center gap-1 mb-0.5 text-[10px]">
                  <Shield className="w-3 h-3 text-blue-600" />
                  <span>Fleet</span>
                </div>
                <div className="font-bold text-slate-900 text-xs truncate">
                  {selectedRouteInternal.comfort === 'AC' ? 'AC ❄️' : 'Regular'}
                </div>
              </div>

              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <div className="text-slate-500 flex items-center gap-1 mb-0.5 text-[10px]">
                  <Clock className="w-3 h-3 text-blue-600" />
                  <span>Hours</span>
                </div>
                <div className="font-bold text-slate-900 text-xs truncate">
                  {selectedRouteInternal.operatingHours}
                </div>
              </div>
            </div>

            {/* Stop Sequence */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Stop Sequence ({selectedRouteInternal.stops.length} Stops)
              </div>
              <div className="space-y-1 max-h-72 overflow-y-auto pr-0.5">
                {selectedRouteInternal.stops.map((stopId, sIdx) => {
                  const stop = STOPS[stopId];
                  if (!stop) return null;
                  return (
                    <div
                      key={stopId}
                      className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:border-blue-300 transition"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-mono font-bold text-[9px] flex-shrink-0">
                          {sIdx + 1}
                        </span>
                        <div className="truncate">
                          <span className="font-medium text-slate-900 text-xs">
                            {lang === 'ur' ? stop.urduName : stop.name}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1">({stop.area})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => onSetAsOrigin(stop.id)}
                          className="px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-medium text-[10px] transition cursor-pointer"
                        >
                          From
                        </button>
                        <button
                          onClick={() => onSetAsDestination(stop.id)}
                          className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-red-600 text-slate-700 hover:text-white font-medium text-[10px] transition cursor-pointer"
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
        <div className="space-y-1.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-0.5">
          {filteredRoutes.map((route) => {
            const isSelected = selectedRouteInternal?.id === route.id;
            return (
              <div
                key={route.id}
                onClick={() => handleRouteClick(route)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/40 border-blue-600 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: route.color }}
                  >
                    {route.code}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {getModeLabel(route.category)}
                  </span>
                </div>

                <div className="font-semibold text-xs sm:text-sm text-slate-900 line-clamp-1">
                  {lang === 'ur' ? route.urduName : route.name}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>{route.stops.length} stops</span>
                  <span className="flex items-center gap-1 text-blue-600 font-medium text-[11px]">
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
