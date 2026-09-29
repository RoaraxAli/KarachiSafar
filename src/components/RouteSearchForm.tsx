import { useState, useMemo } from 'react';
import { ArrowUpDown, Search, MapPin, Check } from 'lucide-react';
import { STOPS } from '../data/transitData';

interface RouteSearchFormProps {
  originStopId: string;
  destStopId: string;
  setOriginStopId: (id: string) => void;
  setDestStopId: (id: string) => void;
  filter: 'ALL' | 'FASTEST' | 'COMFORTABLE' | 'CHINGCHI';
  setFilter: (filter: 'ALL' | 'FASTEST' | 'COMFORTABLE' | 'CHINGCHI') => void;
  allowChingchi: boolean;
  setAllowChingchi: (val: boolean) => void;
  lang: 'en' | 'ur';
}

export const RouteSearchForm: React.FC<RouteSearchFormProps> = ({
  originStopId,
  destStopId,
  setOriginStopId,
  setDestStopId,
  filter,
  setFilter,
  allowChingchi,
  setAllowChingchi,
  lang,
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
        s.urduName.includes(q) ||
        s.area.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [originSearch, stopList]);

  const filteredDestStops = useMemo(() => {
    if (!destSearch.trim()) return stopList.slice(0, 12);
    const q = destSearch.toLowerCase();
    return stopList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.urduName.includes(q) ||
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
            className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg px-3 py-2 text-left flex items-center justify-between cursor-pointer transition"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0" />
              <div className="truncate">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  {lang === 'ur' ? 'روانگی کا مقام' : 'Origin Stop'}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                  {originStop ? (
                    <>
                      <span>{lang === 'ur' ? originStop.urduName : originStop.name}</span>
                      <span className="text-[11px] font-normal text-slate-500 ml-1.5">({originStop.area})</span>
                    </>
                  ) : (
                    <span className="text-slate-400 font-normal">
                      {lang === 'ur' ? 'روانگی کا اسٹاپ منتخب کریں' : 'Select Origin Stop'}
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
                className="p-1 rounded hover:bg-slate-200 text-blue-600 transition cursor-pointer"
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
                placeholder={lang === 'ur' ? 'اسٹاپ تلاش کریں...' : 'Search origin stop...'}
                className="w-full bg-slate-50 text-slate-900 rounded-lg px-3 py-1.5 text-xs border border-slate-300 focus:outline-none focus:border-blue-600 mb-1.5"
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
                    className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer hover:bg-blue-50 transition ${
                      stop.id === originStopId ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{lang === 'ur' ? stop.urduName : stop.name}</div>
                      <div className="text-[10px] text-slate-500">{stop.area} {stop.isBRTStation ? '• BRT' : ''}</div>
                    </div>
                    {stop.id === originStopId && <Check className="w-3.5 h-3.5 text-blue-600" />}
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
            className="w-6 h-6 rounded-full bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-300 shadow-sm flex items-center justify-center transition cursor-pointer"
            title="Swap Origin & Destination"
          >
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>

        {/* Destination Field */}
        <div className="relative">
          <div
            onClick={() => setIsDestOpen(true)}
            className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg px-3 py-2 text-left flex items-center justify-between cursor-pointer transition"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
              <div className="truncate">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  {lang === 'ur' ? 'منزل کا مقام' : 'Destination Stop'}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                  {destStop ? (
                    <>
                      <span>{lang === 'ur' ? destStop.urduName : destStop.name}</span>
                      <span className="text-[11px] font-normal text-slate-500 ml-1.5">({destStop.area})</span>
                    </>
                  ) : (
                    <span className="text-slate-400 font-normal">
                      {lang === 'ur' ? 'منزل کا اسٹاپ منتخب کریں' : 'Select Destination Stop'}
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
                placeholder={lang === 'ur' ? 'منزل تلاش کریں...' : 'Search destination stop...'}
                className="w-full bg-slate-50 text-slate-900 rounded-lg px-3 py-1.5 text-xs border border-slate-300 focus:outline-none focus:border-blue-600 mb-1.5"
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
                    className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer hover:bg-blue-50 transition ${
                      stop.id === destStopId ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{lang === 'ur' ? stop.urduName : stop.name}</div>
                      <div className="text-[10px] text-slate-500">{stop.area} {stop.isBRTStation ? '• BRT' : ''}</div>
                    </div>
                    {stop.id === destStopId && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chingchi Feeder Toggle - Professional Clean Card */}
      <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🛺</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                {lang === 'ur' ? 'چنگچی رکشہ شامل کریں' : 'Include Chingchi Feeders'}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  allowChingchi
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {allowChingchi ? 'Active' : 'Off (Default)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
              {allowChingchi
                ? (lang === 'ur' ? '59 مقامی فیڈر روٹس فعال ہیں' : '59 Local Qingqi feeder routes enabled')
                : (lang === 'ur' ? 'حکومتی پابندیوں کی وجہ سے پہلے سے بند ہے' : 'Off by default due to municipal regulations')}
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={allowChingchi}
          onClick={() => setAllowChingchi(!allowChingchi)}
          className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            allowChingchi ? 'bg-blue-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              allowChingchi ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Filter Tabs - 4 Clean Options (Fares/Cheapest removed as requested) */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
            filter === 'ALL'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
        >
          {lang === 'ur' ? 'تمام' : 'All Routes'}
        </button>

        <button
          onClick={() => setFilter('FASTEST')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
            filter === 'FASTEST'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
        >
          🟢 {lang === 'ur' ? 'تیز ترین' : 'Fastest'}
        </button>

        <button
          onClick={() => setFilter('COMFORTABLE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
            filter === 'COMFORTABLE'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
        >
          ❄️ {lang === 'ur' ? 'صرف AC' : 'AC Only'}
        </button>

        <button
          onClick={() => {
            setFilter('CHINGCHI');
            setAllowChingchi(true);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
            filter === 'CHINGCHI'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
        >
          🛺 {lang === 'ur' ? 'چنگچی' : 'Chingchi'}
        </button>
      </div>
    </div>
  );
};
