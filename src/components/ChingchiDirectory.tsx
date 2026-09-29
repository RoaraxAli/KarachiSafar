import { CHINGCHI_ADDAS } from '../data/transitData';
import { MapPin, Navigation, Lightbulb } from 'lucide-react';
import type { ChingchiAdda } from '../types/transit';

interface ChingchiDirectoryProps {
  onSelectAdda: (adda: ChingchiAdda) => void;
  lang: 'en' | 'ur';
}

export const ChingchiDirectory: React.FC<ChingchiDirectoryProps> = ({ onSelectAdda, lang }) => {
  return (
    <div className="space-y-4">
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-purple-900/40 via-slate-800 to-slate-900 rounded-2xl p-4 sm:p-5 border border-purple-500/30 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-2xl flex-shrink-0">
            🛺
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{lang === 'ur' ? 'کراچی چنگچی اڈا گائیڈ (6-سیٹر رکشہ)' : 'Karachi Chingchi Adda Guide'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500 text-white">
                Feeder Spine
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {lang === 'ur'
                ? 'چھ سیٹر چنگچی رکشے کراچی کی اندرونی گلیوں اور کالونیوں کو بڑی شاہراہوں اور بی آر ٹی اسٹیشنز سے جوڑنے والی سب سے تیز ترین لائف لائن ہیں۔'
                : '6-Seater Qingqi rickshaws are Karachi\'s hyper-frequent short-haul feeders connecting residential neighborhoods to BRT platforms and main arteries.'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Addas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CHINGCHI_ADDAS.map((adda) => (
          <div
            key={adda.id}
            className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 shadow-lg hover:border-purple-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Adda Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    <span>{lang === 'ur' ? adda.urduName : adda.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{adda.location}</p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-purple-900/60 text-purple-300 text-[10px] font-bold border border-purple-500/40 whitespace-nowrap">
                  Qingqi Hub
                </span>
              </div>

              {/* Destinations & Fares */}
              <div className="space-y-1.5 my-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {lang === 'ur' ? 'یہاں سے جانے والے روٹس:' : 'Outgoing Shuttle Routes:'}
                </div>
                {adda.destinations.map((dest, dIdx) => (
                  <div
                    key={dIdx}
                    className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold text-[10px] border border-purple-500/30">
                        {dest.routeCode}
                      </span>
                      <span className="text-slate-200 font-medium">{dest.destination}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-emerald-400">Rs. {dest.fare}</span>
                      <span className="text-[11px] text-slate-400">({dest.time})</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rider Tip */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>{adda.riderTip}</span>
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => onSelectAdda(adda)}
              className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-purple-950/40 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{lang === 'ur' ? 'یہاں سے سفر کی منصوبہ بندی کریں' : 'Plan Journey from this Adda'}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
