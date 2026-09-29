import { useState, useMemo } from 'react';
import { ArrowUpDown, Search, MapPin, Check } from 'lucide-react';
import { STOPS } from '../data/transitData';
import type { FilterCategory } from '../types/transit';

interface RouteSearchFormProps {
  originStopId: string;
  destStopId: string;
  setOriginStopId: (id: string) => void;
  setDestStopId: (id: string) => void;
  filter: FilterCategory;
  setFilter: (filter: FilterCategory) => void;
}

export const RouteSearchForm: React.FC<RouteSearchFormProps> = ({
  originStopId,
  destStopId,
  setOriginStopId,
  setDestStopId,
  filter,
  setFilter,
}) => {
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [isOriginOpen, setIsOriginOpen] = useState(false);
  const [isDestOpen, setIsDestOpen] = useState(false);

  const stopList = useMemo(() => Object.values(STOPS), []);

  const filteredOriginStops = useMemo(() => {
    if (!originSearch.trim()) return stopList.slice(0, 12);
    const q = originSearch.toLowerCase();
    return stopList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.area.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [originSearch, stopList]);

  const filteredDestStops = useMemo(() => {
    if (!destSearch.trim()) return stopList.slice(0, 12);
    const q = destSearch.toLowerCase();
    return stopList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.area.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [destSearch, stopList]);

  const originStop = originStopId ? STOPS[originStopId] : null;
  const destStop = destStopId ? STOPS[destStopId] : null;

  const handleSwap = () => {
    const temp = originStopId;
    setOriginStopId(destStopId);
    setDestStopId(temp);
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          let closest = stopList[0];
          let minDist = Infinity;
          for (const s of stopList) {
            const d = Math.hypot(s.lat - userLat, s.lng - userLng);
            if (d < minDist) {
              minDist = d;
              closest = s;
            }
          }
          setOriginStopId(closest.id);
        },
        () => {
          // If denied, leave empty
        }
      );
    }
  };

  return (
    <div className="space-y-3">
      {/* From / To Connected Card */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm relative space-y-2">
        {/* Origin Field */}
        <div className="relative">
          <div
            onClick={() => setIsOriginOpen(true)}
            className="w-full bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-lg px-3 py-2 text-left flex items-center justify-between cursor-pointer transition"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 flex-shrink-0" />
              <div className="truncate">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Origin Stop
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                  {originStop ? (
                    <>
                      <span>{originStop.name}</span>
                      <span className="text-[11px] font-normal text-slate-500 ml-1.5">({originStop.area})</span>
                    </>
                  ) : (
                    <span className="text-slate-400 font-normal">
                      Select Origin Stop
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLocateMe();
                }}
                className="p-1 rounded hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                title="Nearest Stop to GPS"
              >
                <MapPin className="w-3.5 h-3.5" />
              </button>
              <Search className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Autocomplete Origin */}
          {isOriginOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto p-2">
              <input
                type="text"
                value={originSearch}
                onChange={(e) => setOriginSearch(e.target.value)}
                placeholder="Search origin stop..."
                className="w-full bg-slate-50 text-slate-900 rounded-lg px-3 py-1.5 text-xs border border-slate-300 focus:outline-none focus:border-slate-900 mb-1.5"
                autoFocus
              />
              <div className="space-y-0.5">
                {filteredOriginStops.map((stop) => (
                  <div
                    key={stop.id}
                    onClick={() => {
                      setOriginStopId(stop.id);
                      setIsOriginOpen(false);
                      setOriginSearch('');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer hover:bg-slate-100 transition ${
                      stop.id === originStopId ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{stop.name}</div>
                      <div className="text-[10px] text-slate-500">{stop.area} {stop.isBRTStation ? '• BRT' : ''}</div>
                    </div>
                    {stop.id === originStopId && <Check className="w-3.5 h-3.5 text-slate-900" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Swap Button Floating */}
        <div className="relative flex justify-end -my-1.5 pr-3 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSwap();
            }}
            className="w-6 h-6 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm flex items-center justify-center transition cursor-pointer"
            title="Swap Origin & Destination"
          >
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>

        {/* Destination Field */}
        <div className="relative">
          <div
            onClick={() => setIsDestOpen(true)}
            className="w-full bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-lg px-3 py-2 text-left flex items-center justify-between cursor-pointer transition"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-600 flex-shrink-0" />
              <div className="truncate">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Destination Stop
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                  {destStop ? (
                    <>
                      <span>{destStop.name}</span>
                      <span className="text-[11px] font-normal text-slate-500 ml-1.5">({destStop.area})</span>
                    </>
                  ) : (
                    <span className="text-slate-400 font-normal">
                      Select Destination Stop
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          </div>

          {/* Autocomplete Destination */}
          {isDestOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto p-2">
              <input
                type="text"
                value={destSearch}
                onChange={(e) => setDestSearch(e.target.value)}
                placeholder="Search destination stop..."
                className="w-full bg-slate-50 text-slate-900 rounded-lg px-3 py-1.5 text-xs border border-slate-300 focus:outline-none focus:border-slate-900 mb-1.5"
                autoFocus
              />
              <div className="space-y-0.5">
                {filteredDestStops.map((stop) => (
                  <div
                    key={stop.id}
                    onClick={() => {
                      setDestStopId(stop.id);
                      setIsDestOpen(false);
                      setDestSearch('');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer hover:bg-slate-100 transition ${
                      stop.id === destStopId ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{stop.name}</div>
                      <div className="text-[10px] text-slate-500">{stop.area} {stop.isBRTStation ? '• BRT' : ''}</div>
                    </div>
                    {stop.id === destStopId && <Check className="w-3.5 h-3.5 text-slate-900" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs - Crisp Professional Neutral */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
            filter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Routes
        </button>

        <button
          onClick={() => setFilter('FASTEST')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
            filter === 'FASTEST'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          🟢 Fastest
        </button>

        <button
          onClick={() => setFilter('COMFORTABLE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
            filter === 'COMFORTABLE'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          ❄️ AC Fleet
        </button>

        <button
          onClick={() => setFilter('LOCAL_BUS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
            filter === 'LOCAL_BUS'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          🚌 Minibuses
        </button>
      </div>
    </div>
  );
};
