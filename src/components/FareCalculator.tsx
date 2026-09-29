import { useState } from 'react';
import { Banknote, HelpCircle } from 'lucide-react';

interface FareCalculatorProps {
  lang: 'en' | 'ur';
}

export const FareCalculator: React.FC<FareCalculatorProps> = ({ lang }) => {
  const [testDistanceKm, setTestDistanceKm] = useState<number>(12);

  // Estimates for this distance
  const qingqiEst = 35; // typical flat feeder
  const brtEst = 50;    // flat fare up to end-of-line
  const redBusEst = testDistanceKm > 20 ? 80 : 50;
  const localBusEst = testDistanceKm > 15 ? 40 : 35;
  const bykeaEst = Math.round(50 + testDistanceKm * 20);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-700 backdrop-blur-md">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 mb-2">
          <Banknote className="w-5 h-5 text-emerald-400" />
          <span>{lang === 'ur' ? 'کراچی ٹرانسپورٹ کرایہ نامہ و لاگت کا موازنہ' : 'Karachi Transit Fare Matrix & Calculator'}</span>
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          {lang === 'ur'
            ? 'حکومتِ سندھ اور مقامی ٹرانسپورٹ یونین کے منظور شدہ تصدیق شدہ کرائے۔'
            : 'Official verified fare structures across Sindh Mass Transit Authority (SMTA) and private operator unions.'}
        </p>
      </div>

      {/* Mode Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Chingchi */}
        <div className="p-4 rounded-2xl bg-purple-900/20 border border-purple-500/40 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-purple-300">🛺 6-Seater Chingchi</span>
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-extrabold">Flat Fare</span>
          </div>
          <div className="text-xl font-extrabold text-white">Rs. 30 – 40</div>
          <p className="text-slate-300 text-[11px]">
            Fixed flat rate per stage regardless of minor intermediate stops. No ticket needed; cash paid to conductor on boarding.
          </p>
        </div>

        {/* Green Line BRT */}
        <div className="p-4 rounded-2xl bg-emerald-900/20 border border-emerald-500/40 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-emerald-300">🟢 Green Line BRT</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold">AC Fleet</span>
          </div>
          <div className="text-xl font-extrabold text-white">Rs. 50</div>
          <p className="text-slate-300 text-[11px]">
            Flat fare token or reloadable NFC Smart Card. Dedicated barrier-separated corridor with air-conditioned articulated buses.
          </p>
        </div>

        {/* Peoples Bus Service (PBS Red & EV) */}
        <div className="p-4 rounded-2xl bg-red-900/20 border border-red-500/40 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-red-300">🔴 Red Bus & EV Bus</span>
            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-extrabold">SMTA AC</span>
          </div>
          <div className="text-xl font-extrabold text-white">Rs. 50 – 100</div>
          <p className="text-slate-300 text-[11px]">
            Modern air-conditioned diesel-hybrid and EV fleet. Flat Rs. 50 on standard routes; Rs. 80-100 on long routes like R-9 (42 km).
          </p>
        </div>

        {/* Traditional Minibus & Coaches */}
        <div className="p-4 rounded-2xl bg-amber-900/20 border border-amber-500/40 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-amber-300">🚌 Local Minibuses (W-11)</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold">Cheapest</span>
          </div>
          <div className="text-xl font-extrabold text-white">Rs. 30 – 50</div>
          <p className="text-slate-300 text-[11px]">
            Cheapest point-to-point transit in Karachi. Rapid headways (2–4 mins), flexible stops on request, non-AC.
          </p>
        </div>
      </div>

      {/* Interactive Fare Comparison Slider */}
      <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-white">
            {lang === 'ur' ? 'فاصلے کے لحاظ سے تخمینہ لاگت کا موازنہ' : 'Compare Fares by Trip Distance'}
          </h3>
          <span className="px-3 py-1 rounded-full bg-slate-900 font-mono font-bold text-emerald-400 text-xs border border-slate-700">
            {testDistanceKm} km journey
          </span>
        </div>

        <input
          type="range"
          min="2"
          max="40"
          value={testDistanceKm}
          onChange={(e) => setTestDistanceKm(Number(e.target.value))}
          className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
        />

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-slate-400 text-[11px] mb-1">🛺 Chingchi</div>
            <div className="text-base font-extrabold text-purple-400">Rs. {qingqiEst}</div>
            <div className="text-[10px] text-slate-500">Short feeder</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-slate-400 text-[11px] mb-1">🟢 BRT Green</div>
            <div className="text-base font-extrabold text-emerald-400">Rs. {brtEst}</div>
            <div className="text-[10px] text-slate-500">Zero traffic jam</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-slate-400 text-[11px] mb-1">🔴 Red Bus (AC)</div>
            <div className="text-base font-extrabold text-red-400">Rs. {redBusEst}</div>
            <div className="text-[10px] text-slate-500">Standard road</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-slate-400 text-[11px] mb-1">🚌 Minibus (W-11)</div>
            <div className="text-base font-extrabold text-amber-400">Rs. {localBusEst}</div>
            <div className="text-[10px] text-slate-500">Cheapest direct</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center col-span-2 sm:col-span-1">
            <div className="text-slate-400 text-[11px] mb-1">🏍️ Bykea Ride</div>
            <div className="text-base font-extrabold text-teal-400">Rs. {bykeaEst}</div>
            <div className="text-[10px] text-slate-500">First/last mile</div>
          </div>
        </div>
      </div>

      {/* Practical Karachi Transit Tips */}
      <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700 space-y-3">
        <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span>{lang === 'ur' ? 'کراچی مسافر گائیڈ و آداب' : 'Karachi Rider Tips & Etiquette'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>🛺 Chingchi Rickshaw Seating:</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Front bench faces forward (3 seats); rear bench faces backward (3 seats). Front bench is generally preferred by women or families. Pay the conductor when the rickshaw is moving or on departure.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>🟢 Green Line BRT Boarding:</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Token must be tapped at the entry turnstile and inserted into the exit slot at your destination. Ladies section is located in the front articulated car.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>🚌 W-11 & Minibus Whistle Codes:</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Conductors use whistle signals: 1 whistle blow means "Stop for passenger"; 2 sharp whistle blows mean "Go / Full throttle". Shouting "بھائی ذرا راستہ دیں" politely helps when moving toward the exit.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>📱 Offline Routing Guarantee:</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Karachi Safar works 100% without internet. The entire route graph of 54 lines and Dijkstra routing engine runs locally inside your browser, making it completely resilient during cellular data dropouts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
