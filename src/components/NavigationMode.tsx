import { useState } from 'react';
import type { TripPlan, TripLeg, TransitStop } from '../types/transit';
import { X, Navigation, ArrowRight, Volume2 } from 'lucide-react';

interface NavigationModeProps {
  plan: TripPlan;
  onExit: () => void;
}

export const NavigationMode: React.FC<NavigationModeProps> = ({ plan, onExit }) => {
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
    if ('speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(`Next stop: ${nextStop.name}`);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        // ignore speech error
      }
    }

    setAudioFeedback(`Next Stop: ${nextStop.name}`);
    setTimeout(() => setAudioFeedback(null), 2500);

    if (!isLastStopInLeg) {
      setCurrentStopIndex((prev) => prev + 1);
    } else {
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
      case 'BRT':
        return '🟢 Green Line BRT';
      case 'RED_BUS':
        return '🔴 Red Bus';
      case 'EV_BUS':
        return '⚡ EV Bus';
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
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center text-3xl border border-emerald-200">
            ✓
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Journey Completed
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">
              Arrived at Destination
            </h2>
            <p className="text-sm font-semibold text-slate-700 mt-1">
              {plan.legs[plan.legs.length - 1].toStop.name}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <div className="text-slate-500">Duration</div>
              <div className="text-base font-bold text-slate-900">{plan.totalDurationMinutes} mins</div>
            </div>
            <div>
              <div className="text-slate-500">Distance</div>
              <div className="text-base font-bold text-slate-900">{plan.totalDistanceKm} km</div>
            </div>
          </div>

          <button
            onClick={onExit}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition cursor-pointer shadow-sm"
          >
            Close Navigation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-between p-3 sm:p-6">
      {/* Top Header Bar */}
      <div className="max-w-2xl mx-auto w-full bg-white border border-slate-200 rounded-xl p-3 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
            <Navigation className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900">
                Live Transit Guidance
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            </div>
            <div className="text-[11px] text-slate-500">
              Leg {currentLegIndex + 1} of {plan.legs.length} • {getLegBadge(currentLeg.mode)}
            </div>
          </div>
        </div>

        <button
          onClick={onExit}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition cursor-pointer"
          title="Exit"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Center Guidance Cockpit */}
      <div className="max-w-lg mx-auto w-full my-auto space-y-3">
        {/* Next Stop Announcement Card */}
        <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-xl text-center space-y-3 relative">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-slate-100 border border-slate-300 text-slate-800">
            <span>{currentLeg.routeCode || currentLeg.mode}</span>
          </div>

          {/* Current vs Next Stop Display */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Approaching Next Stop
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {nextStop.name}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {nextStop.area}
            </div>
          </div>

          {/* Audio Feedback toast */}
          {audioFeedback && (
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold animate-pulse border border-slate-300">
              <Volume2 className="w-3.5 h-3.5" />
              <span>{audioFeedback}</span>
            </div>
          )}

          {/* Stop Progress Tracker inside current leg */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span>{currentStop.name}</span>
              <span className="font-semibold text-slate-900">
                Stop {currentStopIndex + 1} of {legStops.length}
              </span>
              <span>{currentLeg.toStop.name}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-slate-900 h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${((currentStopIndex + 1) / legStops.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAdvanceStop}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-md transition cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{isLastStopInLeg && isFinalLeg ? 'Complete Trip' : 'Advance to Next Stop'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="max-w-2xl mx-auto w-full bg-white border border-slate-200 rounded-xl p-3 shadow-md flex items-center justify-between text-xs text-slate-600">
        <div>
          <span className="font-semibold text-slate-900">{plan.title}</span>
        </div>
        <div className="font-mono text-slate-600">
          {plan.totalDurationMinutes} mins • {plan.totalDistanceKm} km
        </div>
      </div>
    </div>
  );
};
