import { useState, useMemo } from 'react';
import { Search, Bus, Eye, Clock, ArrowLeft } from 'lucide-react';
import { ROUTES, STOPS } from '../data/transitData';
import type { TransitRoute } from '../types/transit';

interface RouteExplorerProps {
  onSelectRoute: (route: TransitRoute) => void;
  selectedRouteId: string | null;
  onSetAsOrigin: (stopId: string) => void;
  onSetAsDestination: (stopId: string) => void;
}

export const RouteExplorer: React.FC<RouteExplorerProps> = ({
  onSelectRoute,
  selectedRouteId,
  onSetAsOrigin,
  onSetAsDestination,
}) => {
  const [search, setSearch] = useState('');
  const [selectedRouteInternal, setSelectedRouteInternal] = useState<TransitRoute | null>(
    ROUTES.find((r) => r.id === selectedRouteId) || ROUTES[0]
  );
  const [activeView, setActiveView] = useState<'LIST' | 'DETAIL'>('LIST');

  const filteredRoutes = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return ROUTES;
    return ROUTES.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.stops.some((sId) => STOPS[sId]?.name.toLowerCase().includes(q))
    );
  }, [search]);

  const handleRouteClick = (route: TransitRoute) => {
    setSelectedRouteInternal(route);
    onSelectRoute(route);
    setActiveView('DETAIL');
  };

  return (
    <div className="space-y-3">
      {/* Header and Search */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Bus className="w-4 h-4 text-slate-900" />
            <h2 className="text-sm font-bold text-slate-900">
              Transit Lines
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
            {filteredRoutes.length} Available
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search route or stop (e.g. Green Line, R-4, W-11)..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {/* Content: Either Detail View or List View */}
      {activeView === 'DETAIL' && selectedRouteInternal ? (
        <div className="space-y-2.5">
          {/* Back button */}
          <button
            onClick={() => setActiveView('LIST')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 shadow-sm transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Lines</span>
          </button>

          {/* Selected Route Detail */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm space-y-3">
            {/* Route Heading */}
            <div className="border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="px-2.5 py-0.5 rounded text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: selectedRouteInternal.color }}
                >
                  {selectedRouteInternal.code}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {selectedRouteInternal.name}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {selectedRouteInternal.description}
              </p>
            </div>

            {/* Route Attributes */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="text-slate-500 flex items-center gap-1 mb-0.5 text-[10px]">
                  <Clock className="w-3 h-3 text-slate-700" />
                  <span>Frequency / Interval</span>
                </div>
                <div className="font-bold text-slate-900 text-xs">
                  {typeof selectedRouteInternal.intervalMinutes === 'number'
                    ? `Every ${selectedRouteInternal.intervalMinutes} mins`
                    : `Every ${selectedRouteInternal.intervalMinutes.min}-${selectedRouteInternal.intervalMinutes.max} mins`}
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="text-slate-500 flex items-center gap-1 mb-0.5 text-[10px]">
                  <Clock className="w-3 h-3 text-slate-700" />
                  <span>Operating Hours</span>
                </div>
                <div className="font-bold text-slate-900 text-xs truncate">
                  {selectedRouteInternal.operatingHours}
                </div>
              </div>
            </div>

            {/* Stop Sequence */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Stop Sequence ({selectedRouteInternal.stops.length} Stops)
              </div>
              <div className="space-y-1 max-h-72 overflow-y-auto pr-0.5">
                {selectedRouteInternal.stops.map((stopId, sIdx) => {
                  const stop = STOPS[stopId];
                  if (!stop) return null;
                  return (
                    <div
                      key={stopId}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-mono font-bold text-[9px] flex-shrink-0">
                          {sIdx + 1}
                        </span>
                        <div className="truncate">
                          <span className="font-medium text-slate-900 text-xs">
                            {stop.name}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1">({stop.area})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => onSetAsOrigin(stop.id)}
                          className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-900 text-slate-800 hover:text-white font-medium text-[10px] transition cursor-pointer"
                        >
                          From
                        </button>
                        <button
                          onClick={() => onSetAsDestination(stop.id)}
                          className="px-2 py-0.5 rounded bg-slate-200 hover:bg-rose-600 text-slate-800 hover:text-white font-medium text-[10px] transition cursor-pointer"
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
        <div className="space-y-1.5 max-h-[calc(100vh-230px)] overflow-y-auto pr-0.5">
          {filteredRoutes.map((route) => {
            const isSelected = selectedRouteInternal?.id === route.id;
            return (
              <div
                key={route.id}
                onClick={() => handleRouteClick(route)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-50 border-slate-900 shadow-sm ring-1 ring-slate-900/10'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: route.color }}
                  >
                    {route.code}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {route.stops.length} stops
                  </span>
                </div>

                <div className="font-semibold text-xs sm:text-sm text-slate-900 line-clamp-1">
                  {route.name}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span className="truncate max-w-[200px]">{route.description}</span>
                  <span className="flex items-center gap-1 text-slate-700 font-medium text-[11px] flex-shrink-0">
                    <Eye className="w-3 h-3" />
                    <span>View route</span>
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
