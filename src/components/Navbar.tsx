import { Bus, Compass, Sparkles, Wifi, Bookmark } from 'lucide-react';

interface NavbarProps {
  activeTab: 'PLANNER' | 'EXPLORER' | 'CHINGCHI_ADDAS' | 'FARES';
  setActiveTab: (tab: 'PLANNER' | 'EXPLORER' | 'CHINGCHI_ADDAS' | 'FARES') => void;
  lang: 'en' | 'ur';
  setLang: (lang: 'en' | 'ur') => void;
  onOpenQuickDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  onOpenQuickDemo,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-lg">
      {/* Truck art colored accent line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-amber-400 via-emerald-500 via-cyan-400 to-purple-600" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('PLANNER')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-xl shadow-md shadow-emerald-950/40 border border-emerald-400/30">
            🛺
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Karachi Safar
                <span className="text-emerald-400 font-semibold text-sm sm:text-base urdu-font">
                  (کراچی سفر)
                </span>
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 hidden xs:block">
              {lang === 'ur'
                ? 'ملٹی ماڈل پبلک ٹرانزٹ نیویگیٹر • چنگچی، بی آر ٹی، ریڈ بس'
                : 'Multimodal Transit Navigator • Chingchi, BRT & Bus'}
            </p>
          </div>
        </div>

        {/* Action Controls & Offline badge */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Quick test case shortcut button */}
          <button
            onClick={onOpenQuickDemo}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer"
            title="Load Buffer Zone to Capri Cinema test route"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Test Route:</span>
            <span>Buffer Zone ➔ Capri</span>
          </button>

          {/* Offline Ready Badge */}
          <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800 text-slate-300 text-[11px] border border-slate-700">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span>100% Offline Ready</span>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition cursor-pointer"
            title="Switch Language"
          >
            {lang === 'en' ? 'اردو' : 'English'}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <nav className="flex overflow-x-auto no-scrollbar border-t border-slate-800/80 bg-slate-900/60 px-3 sm:px-6">
        <button
          onClick={() => setActiveTab('PLANNER')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'PLANNER'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>{lang === 'ur' ? 'سفر کی منصوبہ بندی' : 'Plan Journey'}</span>
        </button>

        <button
          onClick={() => setActiveTab('EXPLORER')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'EXPLORER'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bus className="w-3.5 h-3.5" />
          <span>{lang === 'ur' ? 'تمام روٹس (54)' : 'Explore Routes (54)'}</span>
        </button>

        <button
          onClick={() => setActiveTab('CHINGCHI_ADDAS')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'CHINGCHI_ADDAS'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-sm">🛺</span>
          <span>{lang === 'ur' ? 'چنگچی اڈا گائیڈ' : 'Chingchi Addas'}</span>
        </button>

        <button
          onClick={() => setActiveTab('FARES')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'FARES'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>{lang === 'ur' ? 'کرایہ نامہ و رہنمائی' : 'Fare Guide & Bykea'}</span>
        </button>
      </nav>
    </header>
  );
};
