import { CHINGCHI_ADDAS } from '../data/transitData';
import { MapPin, Navigation, Lightbulb } from 'lucide-react';
import type { ChingchiAdda } from '../types/transit';

interface ChingchiDirectoryProps {
  onSelectAdda: (adda: ChingchiAdda) => void;
}

export const ChingchiDirectory: React.FC<ChingchiDirectoryProps> = ({ onSelectAdda }) => {
  return (
    <div className="space-y-3">
      {/* Intro Banner */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🛺</span>
          <h2 className="text-sm font-bold text-slate-900">
            Qingqi Rickshaw Addas
          </h2>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Key neighborhood terminals connecting residential sectors to main transit arteries
        </p>
      </div>

      {/* List of Addas */}
      <div className="space-y-2.5">
        {CHINGCHI_ADDAS.map((adda) => (
          <div
            key={adda.id}
            className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm space-y-2 hover:border-blue-300 transition"
          >
            {/* Adda Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>{adda.name}</span>
                </h3>
                <p className="text-[11px] text-slate-500">{adda.location}</p>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 whitespace-nowrap">
                Feeder Stand
              </span>
            </div>

            {/* Destinations (Fares removed) */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Outgoing Feeder Corridors:
              </div>
              <div className="space-y-1">
                {adda.destinations.map((dest, dIdx) => (
                  <div
                    key={dIdx}
                    className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold text-[10px]">
                        {dest.routeCode}
                      </span>
                      <span className="text-slate-800 font-medium text-xs truncate">{dest.destination}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 flex-shrink-0">
                      ~{dest.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rider Tip */}
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{adda.riderTip}</span>
            </div>

            {/* Set as Origin Button */}
            <button
              onClick={() => onSelectAdda(adda)}
              className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Navigation className="w-3 h-3" />
              <span>Set as Journey Origin</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
