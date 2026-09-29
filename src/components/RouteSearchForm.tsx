import { useState, useMemo } from 'react';
import { ArrowUpDown, Search, MapPin, Navigation, Check } from 'lucide-react';
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
    <div className="bg-slate-800/80 rounded-2xl p-3 sm:p-5 border border-slate-700/80 shadow-xl backdrop-blur-md">
      {/* Title / Preset Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
          <Navigation className="w-4 h-4 text-emerald-400" />
          <span>{lang === 'ur' ? 'راستہ تلاش کریں' : 'Plan Your Transit Journey'}</span>
        </h2>
        <button
          onClick={handleLocateMe}
          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>{lang === 'ur' ? 'موجودہ مقام' : 'Use Current Stop'}</span>
        </button>
      </div>

      {/* Preset Journey Pills */}
      <div className="mb-3.5 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5 w-max">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            {lang === 'ur' ? 'مشہور راستے:' : 'Popular:'}
          </span>
          {PRESET_ROUTES.map((preset) => {
            const isSelected = originStopId === preset.originId && destStopId === preset.destId;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.originId, preset.destId)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-700/70 hover:bg-slate-700 text-slate-200 border-slate-600/80'
                }`}
              >
                <span>{lang === 'ur' ? preset.urduTitle : preset.title}</span>
                <span className="text-[10px] opacity-75">{preset.badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Fields: Origin & Destination */}
      <div className="space-y-2 relative">
        {/* Origin Field */}
        <div className="relative">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {lang === 'ur' ? 'آغاز (روانگی کا اسٹاپ / چنگچی اڈا)' : 'From (Origin Stop / Chingchi Stand)'}
          </label>
          <div
            onClick={() => setIsOriginOpen(true)}
            className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-2.5 text-left flex items-center justify-between cursor-pointer transition shadow-inner"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
              <div className="truncate">
                <span className="text-sm font-semibold text-white">
                  {originStop ? (lang === 'ur' ? originStop.urduName : originStop.name) : 'Select Origin'}
                </span>
                {originStop && (
                  <span className="text-xs text-slate-400 ml-2">({originStop.area})</span>
                )}
              </div>
            </div>
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </div>

          {/* Origin Autocomplete Popover */}
          {isOriginOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 max-h-64 overflow-y-auto p-2">
              <input
                type="text"
                value={originSearch}
                onChange={(e) => setOriginSearch(e.target.value)}
                placeholder={lang === 'ur' ? 'اسٹاپ یا علاقہ تلاش کریں...' : 'Search stop or area (e.g. Buffer Zone, Nagan)...'}
                className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:outline-none focus:border-emerald-500 mb-2"
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
                    className={`px-3 py-2 rounded-lg text-xs sm:text-sm flex items-center justify-between cursor-pointer hover:bg-slate-800 transition ${
                      stop.id === originStopId ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{lang === 'ur' ? stop.urduName : stop.name}</div>
                      <div className="text-[11px] text-slate-400">{stop.area} {stop.isBRTStation ? '• BRT Station' : ''} {stop.isChingchiAdda ? '• Qingqi Stand' : ''}</div>
                    </div>
                    {stop.id === originStopId && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Swap Button (Floating between) */}
        <div className="flex justify-end -my-2 mr-3 relative z-10">
          <button
            onClick={handleSwap}
            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-600 shadow-md flex items-center justify-center transition-all cursor-pointer"
            title="Swap Origin and Destination"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>

        {/* Destination Field */}
        <div className="relative">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {lang === 'ur' ? 'منزل (جہاں پہنچنا ہے)' : 'To (Destination Stop / Interchange)'}
          </label>
          <div
            onClick={() => setIsDestOpen(true)}
            className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-2.5 text-left flex items-center justify-between cursor-pointer transition shadow-inner"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
              <div className="truncate">
                <span className="text-sm font-semibold text-white">
                  {destStop ? (lang === 'ur' ? destStop.urduName : destStop.name) : 'Select Destination'}
                </span>
                {destStop && (
                  <span className="text-xs text-slate-400 ml-2">({destStop.area})</span>
                )}
              </div>
            </div>
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </div>

          {/* Destination Autocomplete Popover */}
          {isDestOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 max-h-64 overflow-y-auto p-2">
              <input
                type="text"
                value={destSearch}
                onChange={(e) => setDestSearch(e.target.value)}
                placeholder={lang === 'ur' ? 'منزل کا اسٹاپ تلاش کریں...' : 'Search destination stop (e.g. Capri Cinema, Saddar)...'}
                className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:outline-none focus:border-red-500 mb-2"
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
                    className={`px-3 py-2 rounded-lg text-xs sm:text-sm flex items-center justify-between cursor-pointer hover:bg-slate-800 transition ${
                      stop.id === destStopId ? 'bg-red-500/20 text-red-300 font-semibold' : 'text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{lang === 'ur' ? stop.urduName : stop.name}</div>
                      <div className="text-[11px] text-slate-400">{stop.area} {stop.isBRTStation ? '• BRT' : ''}</div>
                    </div>
                    {stop.id === destStopId && <Check className="w-4 h-4 text-red-400" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CHINGCHI FEEDER TOGGLE - OFF BY DEFAULT */}
      <div
        className={`mt-4 p-3.5 rounded-xl border transition-all ${
          allowChingchi
            ? 'bg-purple-950/40 border-purple-500/50 text-purple-100 shadow-md shadow-purple-950/40'
            : 'bg-slate-900/70 border-slate-800 text-slate-300'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 p-2 rounded-lg text-base flex-shrink-0 ${
                allowChingchi ? 'bg-purple-600/30 text-purple-300' : 'bg-slate-800 text-slate-400'
              }`}
            >
              🛺
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white">
                  {lang === 'ur' ? 'چنگچی رکشہ (Qingqi) فیڈرز شامل کریں' : 'Include Chingchi (Qingqi) Feeders'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    allowChingchi
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {allowChingchi
                    ? lang === 'ur'
                      ? 'فعال (59 روٹس)'
                      : 'ENABLED (59 CORRIDORS)'
                    : lang === 'ur'
                    ? 'بند ہے (سفارش کردہ)'
                    : 'OFF BY DEFAULT'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {allowChingchi
                  ? lang === 'ur'
                    ? 'شہر کے 59 لوکل چنگچی روٹس شامل ہیں (فلیٹ کرایہ 30 تا 40 روپے، بفر زون، فیڈرل بی ایریا، اورنگی، گلشن و ملیر کے گلی محلوں سے مین شاہرائیں)'
                    : '59 hyper-local Qingqi corridors enabled (Flat Rs. 30-40, high-frequency feeder shuttles connecting residential blocks to BRT & main arteries).'
                  : lang === 'ur'
                  ? 'چنگچی رکشے حکومتی بندش، مین روڈز پر پابندیوں اور حفاظتی خدشات کے پیش نظر پہلے سے بند ہیں۔ اگر آپ کو گلی محلوں کے سستے فیڈر کی ضرورت ہو تو آن کریں۔'
                  : 'Chingchis are off by default due to frequent municipal bans, unregularized routes, and safety concerns. Toggle ON to include 6-seater neighborhood feeders.'}
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={allowChingchi}
            onClick={() => setAllowChingchi(!allowChingchi)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
              allowChingchi ? 'bg-purple-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                allowChingchi ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Filter Tabs as Specified in Prompt */}
      <div className="mt-4 pt-3 border-t border-slate-700/80">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          {lang === 'ur' ? 'ترجیحات و فلٹر' : 'Journey Preferences & Mode Filters'}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-1 ${
              filter === 'ALL'
                ? 'bg-slate-100 text-slate-900 border-white'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <span>{lang === 'ur' ? 'تمام تجاویز' : 'All Options'}</span>
          </button>

          <button
            onClick={() => setFilter('FASTEST')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-1 ${
              filter === 'FASTEST'
                ? 'bg-emerald-500 text-white border-emerald-400'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <span>🟢 {lang === 'ur' ? 'تیز ترین (BRT)' : 'Fastest (BRT)'}</span>
          </button>

          <button
            onClick={() => setFilter('CHEAPEST')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-1 ${
              filter === 'CHEAPEST'
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <span>🚌 {lang === 'ur' ? 'سستا ترین' : 'Cheapest'}</span>
          </button>

          <button
            onClick={() => setFilter('COMFORTABLE')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-1 ${
              filter === 'COMFORTABLE'
                ? 'bg-cyan-500 text-white border-cyan-400'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <span>❄️ {lang === 'ur' ? 'آرام دہ (AC)' : 'Comfort (AC)'}</span>
          </button>

          <button
            onClick={() => {
              setFilter('CHINGCHI');
              setAllowChingchi(true);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-1 ${
              filter === 'CHINGCHI'
                ? 'bg-purple-600 text-white border-purple-400'
                : 'bg-slate-900 text-purple-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <span>🛺 {lang === 'ur' ? 'صرف چنگچی' : 'Chingchi'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
