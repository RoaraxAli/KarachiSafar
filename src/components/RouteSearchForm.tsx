import { useState, useMemo } from 'react';
import { ArrowUpDown, Search, MapPin, Check } from 'lucide-react';
import { STOPS } from '../data/transitData';

interface RouteSearchFormProps {
  originStopId: string;
  destStopId: string;
  setOriginStopId: (id: string) => void;
  setDestStopId: (id: string) => void;
  onSearch?: () => void;
  filter: 'ALL' | 'FASTEST' | 'CHEAPEST' | 'COMFORTABLE' | 'CHINGCHI';
  setFilter: (filter: 'ALL' | 'FASTEST' | 'CHEAPEST' | 'COMFORTABLE' | 'CHINGCHI') => void;
  allowChingchi: boolean;
  setAllowChingchi: (val: boolean) => void;
  lang: 'en' | 'ur';
}

const PRESET_ROUTES = [
  {
    id: 'test-case',
    title: 'Buffer Zone ➔ Capri Cinema',
    urduTitle: 'بفر زون تا کیپری سنیما',
    originId: 'buffer-zone-15a',
    destId: 'capri-cinema',
    badge: 'Test Case ⭐',
  },
  {
    id: 'student-ku',
    title: 'NIPA ➔ NED / KU Silver Jubilee',
    urduTitle: 'نیپا تا این ای ڈی و جامعہ کراچی',
    originId: 'nipa-chowrangi',
    destId: 'karachi-university',
    badge: 'Student Route 🎓',
  },
  {
    id: 'surjani-tower',
    title: 'Surjani 4K ➔ Merewether Tower',
    urduTitle: 'سرجانی تا میرین ویڈر ٹاور',
    originId: '4k-chowrangi',
    destId: 'merewether-tower',
    badge: 'W-11 / 4K / BRT 🚌',
  },
  {
    id: 'malir-clifton',
    title: 'Malir Halt ➔ Dolmen Mall Clifton',
    urduTitle: 'ملیر ہالٹ تا ڈولمن مال کلفٹن',
    originId: 'malir-halt',
    destId: 'dolmen-mall-clifton',
    badge: 'EV-1 Electric ⚡',
  },
  {
    id: 'orangi-korangi',
    title: 'Orangi No. 5 ➔ Korangi Industrial',
    urduTitle: 'اورنگی تا کورنگی انڈسٹریل',
    originId: 'orangi-5',
    destId: 'korangi-crossing',
    badge: 'Industrial Link 🏭',
  },
  {
    id: 'bahria-numaish',
    title: 'Bahria Town ➔ Numaish BRT',
    urduTitle: 'بحریہ ٹاؤن تا نمائش چورنگی',
    originId: 'bahria-precinct-21',
    destId: 'numaish-chowrangi',
    badge: 'EV Express 🚀',
  },
];

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
    if (!originSearch.trim()) return stopList.slice(0, 10);
    const q = originSearch.toLowerCase();
    return stopList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.urduName.includes(q) ||
        s.area.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [originSearch, stopList]);

  const filteredDestStops = useMemo(() => {
    if (!destSearch.trim()) return stopList.slice(0, 10);
    const q = destSearch.toLowerCase();
    return stopList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.urduName.includes(q) ||
        s.area.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [destSearch, stopList]);

  const originStop = STOPS[originStopId];
  const destStop = STOPS[destStopId];

  const handleSwap = () => {
    const temp = originStopId;
    setOriginStopId(destStopId);
    setDestStopId(temp);
  };

  const handleSelectPreset = (orig: string, dest: string) => {
    setOriginStopId(orig);
    setDestStopId(dest);
    setIsOriginOpen(false);
    setIsDestOpen(false);
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Find closest Karachi stop
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
          // Default to central hub if denied
          setOriginStopId('buffer-zone-15a');
        }
      );
    } else {
      setOriginStopId('buffer-zone-15a');
    }
  };

  return (
    <div className="space-y-3">
      {/* Quick Presets Carousel */}
      <div className="overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center gap-1.5 w-max">
          {PRESET_ROUTES.slice(0, 4).map((preset) => {
            const isSelected = originStopId === preset.originId && destStopId === preset.destId;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.originId, preset.destId)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                  isSelected
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <span>{lang === 'ur' ? preset.urduTitle : preset.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* From / To Unified Input Card */}
      <div className="bg-slate-900/90 rounded-2xl p-2.5 border border-slate-800 shadow-md relative space-y-1.5">
        {/* Origin Field */}
        <div className="relative">
          <div
            onClick={() => setIsOriginOpen(true)}
            className="w-full bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2 text-left flex items-center justify-between cursor-pointer transition"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
              <div className="truncate">
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  {lang === 'ur' ? 'روانگی (کہاں سے)' : 'From (Origin)'}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-white truncate">
                  {originStop ? (lang === 'ur' ? originStop.urduName : originStop.name) : 'Select Origin'}
                  {originStop && <span className="text-[11px] font-normal text-slate-400 ml-1.5">({originStop.area})</span>}
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
                className="p-1 rounded hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                title="Detect Nearest Stop"
              >
                <MapPin className="w-3.5 h-3.5" />
              </button>
              <Search className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Autocomplete Origin */}
          {isOriginOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 max-h-60 overflow-y-auto p-2">
              <input
                type="text"
                value={originSearch}
                onChange={(e) => setOriginSearch(e.target.value)}
                placeholder={lang === 'ur' ? 'روانگی کا اسٹاپ تلاش کریں...' : 'Search origin stop (e.g. Buffer Zone, Nagan)...'}
                className="w-full bg-slate-800 text-white rounded-lg px-3 py-1.5 text-xs border border-slate-700 focus:outline-none focus:border-emerald-500 mb-1.5"
                autoFocus
              />
              <div className="space-y-1">
                {filteredOriginStops.map((stop) => (
                  <div
                    key={stop.id}
                    onClick={() => {
                      setOriginStopId(stop.id);
                      setIsOriginOpen(false);
                      setOriginSearch('');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer hover:bg-slate-800 transition ${
                      stop.id === originStopId ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{lang === 'ur' ? stop.urduName : stop.name}</div>
                      <div className="text-[10px] text-slate-400">{stop.area} {stop.isBRTStation ? '• BRT' : ''}</div>
                    </div>
                    {stop.id === originStopId && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Swap Button Floating */}
        <div className="relative flex justify-end -my-1 pr-3 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSwap();
            }}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-700 shadow-md flex items-center justify-center transition cursor-pointer"
            title="Swap Origin and Destination"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Destination Field */}
        <div className="relative">
          <div
            onClick={() => setIsDestOpen(true)}
            className="w-full bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2 text-left flex items-center justify-between cursor-pointer transition"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
              <div className="truncate">
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  {lang === 'ur' ? 'منزل (کہاں جانا ہے)' : 'To (Destination)'}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-white truncate">
                  {destStop ? (lang === 'ur' ? destStop.urduName : destStop.name) : 'Select Destination'}
                  {destStop && <span className="text-[11px] font-normal text-slate-400 ml-1.5">({destStop.area})</span>}
                </div>
              </div>
            </div>
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          </div>

          {/* Autocomplete Destination */}
          {isDestOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 max-h-60 overflow-y-auto p-2">
              <input
                type="text"
                value={destSearch}
                onChange={(e) => setDestSearch(e.target.value)}
                placeholder={lang === 'ur' ? 'منزل تلاش کریں...' : 'Search destination (e.g. Capri Cinema, Saddar)...'}
                className="w-full bg-slate-800 text-white rounded-lg px-3 py-1.5 text-xs border border-slate-700 focus:outline-none focus:border-red-500 mb-1.5"
                autoFocus
              />
              <div className="space-y-1">
                {filteredDestStops.map((stop) => (
                  <div
                    key={stop.id}
                    onClick={() => {
                      setDestStopId(stop.id);
                      setIsDestOpen(false);
                      setDestSearch('');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer hover:bg-slate-800 transition ${
                      stop.id === destStopId ? 'bg-red-500/20 text-red-300 font-semibold' : 'text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{lang === 'ur' ? stop.urduName : stop.name}</div>
                      <div className="text-[10px] text-slate-400">{stop.area} {stop.isBRTStation ? '• BRT' : ''}</div>
                    </div>
                    {stop.id === destStopId && <Check className="w-3.5 h-3.5 text-red-400" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chingchi Feeder Toggle - Clean, Simple, Uncluttered */}
      <div
        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
          allowChingchi
            ? 'bg-purple-950/30 border-purple-500/40 text-purple-200'
            : 'bg-slate-900/60 border-slate-800 text-slate-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🛺</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">
                {lang === 'ur' ? 'چنگچی رکشہ شامل کریں' : 'Include Chingchi'}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  allowChingchi
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {allowChingchi ? 'ON' : 'OFF'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              {allowChingchi
                ? lang === 'ur'
                  ? '59 لوکل فیڈر روٹس فعال ہیں'
                  : '59 Feeder corridors active (Rs. 30-40)'
                : lang === 'ur'
                ? 'حکومتی پابندیوں کی بنا پر بند'
                : 'Off by default due to bans & safety'}
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={allowChingchi}
          onClick={() => setAllowChingchi(!allowChingchi)}
          className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            allowChingchi ? 'bg-purple-600' : 'bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              allowChingchi ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Filter Tabs - Compact 5-Mode Row */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
            filter === 'ALL'
              ? 'bg-slate-100 text-slate-900 border-white'
              : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
        >
          {lang === 'ur' ? 'تمام' : 'All'}
        </button>

        <button
          onClick={() => setFilter('FASTEST')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
            filter === 'FASTEST'
              ? 'bg-emerald-500 text-white border-emerald-400'
              : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
        >
          🟢 {lang === 'ur' ? 'تیز ترین' : 'Fastest'}
        </button>

        <button
          onClick={() => setFilter('CHEAPEST')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
            filter === 'CHEAPEST'
              ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
              : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
        >
          🚌 {lang === 'ur' ? 'سستا' : 'Cheapest'}
        </button>

        <button
          onClick={() => setFilter('COMFORTABLE')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
            filter === 'COMFORTABLE'
              ? 'bg-cyan-500 text-white border-cyan-400'
              : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
        >
          ❄️ {lang === 'ur' ? 'AC' : 'AC Only'}
        </button>

        <button
          onClick={() => {
            setFilter('CHINGCHI');
            setAllowChingchi(true);
          }}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
            filter === 'CHINGCHI'
              ? 'bg-purple-600 text-white border-purple-400'
              : 'bg-slate-900/80 text-purple-300 border-slate-700 hover:bg-slate-800'
          }`}
        >
          🛺 {lang === 'ur' ? 'چنگچی' : 'Chingchi'}
        </button>
      </div>
    </div>
  );
};
