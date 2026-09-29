import { useState } from 'react';
import type { TripPlan, TripLeg, TransitStop } from '../types/transit';
import { X, Navigation, ArrowRight, Volume2 } from 'lucide-react';

interface NavigationModeProps {
  plan: TripPlan;
  onExit: () => void;
  lang: 'en' | 'ur';
}

export const NavigationMode: React.FC<NavigationModeProps> = ({ plan, onExit, lang }) => {
  const [currentLegIndex, setCurrentLegIndex] = useState(0);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [hasArrived, setHasArrived] = useState(false);
  const [audioFeedback, setAudioFeedback] = useState<string | null>(null);

  const currentLeg: TripLeg = plan.legs[currentLegIndex];

  // List of all stops in this leg: [fromStop, ...intermediateStops, toStop]
  const legStops: TransitStop[] = [
    currentLeg.fromStop,
    ...currentLeg.intermediateStops,
    currentLeg.toStop,
  ];

  const currentStop = legStops[currentStopIndex] || currentLeg.fromStop;
  const nextStop = legStops[currentStopIndex + 1] || currentLeg.toStop;
  const isLastStopInLeg = currentStopIndex >= legStops.length - 1;
  const isFinalLeg = currentLegIndex >= plan.legs.length - 1;

  // Handle advancing to next stop
  const handleAdvanceStop = () => {
    // Play subtle audio alert simulation
    if ('speechSynthesis' in window && lang === 'ur') {
      try {
        const utterance = new SpeechSynthesisUtterance(`اگلا اسٹاپ: ${nextStop.urduName}`);
        utterance.lang = 'ur-PK';
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        // ignore speech error
      }
    }

    setAudioFeedback(`🔔 Next Stop: ${nextStop.name}`);
    setTimeout(() => setAudioFeedback(null), 2500);

    if (!isLastStopInLeg) {
      setCurrentStopIndex((prev) => prev + 1);
    } else {
      // Advance to next leg or complete journey
      if (!isFinalLeg) {
        setCurrentLegIndex((prev) => prev + 1);
        setCurrentStopIndex(0);
      } else {
        setHasArrived(true);
      }
    }
  };

  const getLegBadge = (mode: string) => {
    switch (mode) {
      case 'CHINGCHI':
        return '🛺 6-Seater Chingchi';
      case 'BRT':
        return '🟢 Green Line BRT';
      case 'RED_BUS':
        return '🔴 Peoples Red Bus';
      case 'EV_BUS':
        return '⚡ Electric EV Bus';
      case 'LOCAL_BUS':
        return '🚌 Minibus';
      case 'WALK':
        return '🚶 Pedestrian Transfer';
      default:
        return mode;
    }
  };

  if (hasArrived) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center text-4xl border border-emerald-400/40">
            🎉
          </div>
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {lang === 'ur' ? 'سفر مکمل!' : 'Journey Completed!'}
            </span>
            <h2 className="text-2xl font-black text-white mt-2">
              {lang === 'ur' ? 'منزل پر خوش آمدید' : 'You have arrived!'}
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              {plan.legs[plan.legs.length - 1].toStop.name}
            </p>
            <p className="text-xs text-slate-400 urdu-font">
              {plan.legs[plan.legs.length - 1].toStop.urduName}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs">
            <div>
              <div className="text-slate-400">Total Duration</div>
              <div className="text-lg font-bold text-white">{plan.totalDurationMinutes} mins</div>
            </div>
            <div>
              <div className="text-slate-400">Total Fare</div>
              <div className="text-lg font-bold text-emerald-400">Rs. {plan.totalFarePKR}</div>
            </div>
          </div>

          <button
            onClick={onExit}
            className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition cursor-pointer shadow-lg shadow-emerald-950/40"
          >
            {lang === 'ur' ? 'نیویگیشن بند کریں' : 'Exit Navigation'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col justify-between p-3 sm:p-6 backdrop-blur-lg">
      {/* Top Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <Navigation className="w-5 h-5 fill-current animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                {lang === 'ur' ? 'لائیو نیویگیشن موڈ' : 'Live Navigation Simulator'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div className="text-xs text-slate-400">
              Leg {currentLegIndex + 1} of {plan.legs.length} • {getLegBadge(currentLeg.mode)}
            </div>
          </div>
        </div>

        <button
          onClick={onExit}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          title="Exit"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Guidance Cockpit */}
      <div className="max-w-xl mx-auto w-full my-auto space-y-4">
        {/* Next Stop Announcement Card */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-900/90 border-2 border-emerald-500/70 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-4 relative overflow-hidden">
          {/* Subtle vehicle glow badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-800 border border-slate-700 text-slate-200">
            <span>{currentLeg.routeCode || currentLeg.mode}</span>
            <span className="text-slate-500">•</span>
            <span>{currentLeg.durationMinutes} min leg</span>
          </div>

          <div>
            <div className="text-xs uppercase font-extrabold tracking-widest text-slate-400 mb-1">
              {lang === 'ur' ? 'اگلا اسٹاپ' : 'Next Stop'}
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {nextStop.name}
            </h2>
            <div className="text-lg sm:text-2xl font-bold text-emerald-400 urdu-font mt-1">
              {nextStop.urduName}
            </div>
            <div className="text-xs text-slate-400 mt-1">{nextStop.area}</div>
          </div>

          {/* Leg Instruction */}
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-200 leading-relaxed text-left">
            <div className="font-semibold text-emerald-400 mb-0.5">
              {lang === 'ur' ? 'ہدایات:' : 'Current Step Instruction:'}
            </div>
            <div>{lang === 'ur' ? currentLeg.urduInstruction : currentLeg.instruction}</div>
          </div>

          {/* Stop Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Current: {currentStop.name}</span>
              <span>
                Stop {currentStopIndex + 1} of {legStops.length}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{
                  width: `${((currentStopIndex + 1) / legStops.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Audio Chime Notification banner */}
          {audioFeedback && (
            <div className="absolute top-2 left-4 right-4 bg-emerald-600 text-white font-bold text-xs py-1.5 px-3 rounded-xl shadow-lg flex items-center justify-center gap-1.5 animate-bounce">
              <Volume2 className="w-4 h-4" />
              <span>{audioFeedback}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="max-w-xl mx-auto w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <button
          onClick={handleAdvanceStop}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition cursor-pointer"
        >
          <span>
            {isLastStopInLeg
              ? isFinalLeg
                ? lang === 'ur'
                  ? 'منزل پر پہنچ گئے 🏁'
                  : 'Arrive at Final Destination 🏁'
                : lang === 'ur'
                ? 'اگلی بس / چنگچی میں تبدیل کریں ➔'
                : 'Transfer to Next Leg ➔'
              : lang === 'ur'
              ? 'اگلے اسٹاپ پر جائیں ➔'
              : 'Next Stop Approached ➔'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Total Fare: Rs. {plan.totalFarePKR}</span>
          <span>{plan.legs.length - currentLegIndex} legs remaining</span>
        </div>
      </div>
    </div>
  );
};
