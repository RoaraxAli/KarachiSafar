import { useState, Fragment } from 'react';
import { Shuffle, Wind, ChevronDown, ChevronUp, Navigation, ArrowRight } from 'lucide-react';
import type { TripPlan, TransitMode } from '../types/transit';

interface TripCardProps {
  plan: TripPlan;
  isSelected: boolean;
  onSelect: (plan: TripPlan) => void;
  onStartNavigation: (plan: TripPlan) => void;
  lang: 'en' | 'ur';
}

export const TripCard: React.FC<TripCardProps> = ({
  plan,
  isSelected,
  onSelect,
  onStartNavigation,
  lang,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper for mode background color
  const getBadgeStyle = (mode: TransitMode) => {
    switch (mode) {
      case 'CHINGCHI':
        return 'bg-purple-900/40 text-purple-300 border-purple-500/60';
      case 'BRT':
        return 'bg-emerald-900/40 text-emerald-300 border-emerald-500/60';
      case 'RED_BUS':
        return 'bg-red-900/40 text-red-300 border-red-500/60';
      case 'EV_BUS':
        return 'bg-cyan-900/40 text-cyan-300 border-cyan-500/60';
      case 'LOCAL_BUS':
        return 'bg-amber-900/40 text-amber-300 border-amber-500/60';
      case 'WALK':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'BYKEA':
        return 'bg-teal-900/40 text-teal-300 border-teal-500/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getTagColor = (tag: TripPlan['tag']) => {
    switch (tag) {
      case 'FASTEST':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'CHEAPEST':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MOST_COMFORTABLE':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
    }
  };

  return (
    <div
      onClick={() => onSelect(plan)}
      className={`rounded-2xl transition-all border p-3.5 sm:p-5 cursor-pointer ${
        isSelected
          ? 'bg-slate-800/95 border-emerald-500 shadow-xl shadow-emerald-950/30 ring-1 ring-emerald-500/40'
          : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800/80 hover:border-slate-600'
      }`}
    >
      {/* Top Header: Tag Badge & Total Metrics */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div>
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wide uppercase ${getTagColor(
              plan.tag
            )}`}
          >
            {lang === 'ur' ? plan.tagUrdu : plan.tag}
          </span>
          <h3 className="text-base sm:text-lg font-bold text-white mt-1 leading-snug">
            {lang === 'ur' ? plan.urduTitle : plan.title}
          </h3>
        </div>

        {/* Big Duration & Fare */}
        <div className="text-right flex-shrink-0">
          <div className="text-xl sm:text-2xl font-extrabold text-white flex items-center justify-end gap-1">
            <span>{plan.totalDurationMinutes}</span>
            <span className="text-xs font-normal text-slate-400">min</span>
          </div>
          <div className="text-emerald-400 font-bold text-sm sm:text-base">
            Rs. {plan.totalFarePKR}
          </div>
        </div>
      </div>

      {/* Summary Chips: Transfers, Comfort AC, Distance */}
      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-slate-300">
        <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700/60">
          <Shuffle className="w-3 h-3 text-slate-400" />
          <span>
            {plan.transferCount === 0
              ? lang === 'ur'
                ? 'براہِ راست (زیرو ٹرانسفر)'
                : 'Direct (0 Transfers)'
              : lang === 'ur'
              ? `${plan.transferCount} ٹرانسفر`
              : `${plan.transferCount} Transfer${plan.transferCount > 1 ? 's' : ''}`}
          </span>
        </span>

        <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700/60">
          <Wind className={`w-3 h-3 ${plan.hasAC ? 'text-cyan-400' : 'text-slate-400'}`} />
          <span>{plan.hasAC ? '❄️ Air-Conditioned (AC)' : '🌬️ Open Air / Regular'}</span>
        </span>

        <span className="text-slate-400 text-[11px]">
          {plan.totalDistanceKm} km total
        </span>
      </div>

      {/* Leg Badges Chain (as required in prompt) */}
      <div className="mb-3 p-2 rounded-xl bg-slate-900/70 border border-slate-800/80">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">
          {lang === 'ur' ? 'سفر کی ترتیب (ٹرانزٹ چین):' : 'Journey Chain (Step by Step):'}
        </div>
        <div className="flex items-center flex-wrap gap-1.5">
          {plan.summaryBadges.map((badge, idx) => (
            <Fragment key={idx}>
              <span
                className={`px-2 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 ${getBadgeStyle(
                  badge.mode
                )}`}
              >
                <span>{badge.label}</span>
                <span className="text-[10px] opacity-80">({badge.duration}m)</span>
              </span>
              {idx < plan.summaryBadges.length - 1 && (
                <ArrowRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
              )}
            </Fragment>
          ))}
          <ArrowRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <span className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/50">
            🏁 {lang === 'ur' ? 'منزل پر آمد' : 'Arrive'}
          </span>
        </div>
      </div>

      {/* Action Buttons: Expand Details & Start Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-xs text-slate-300 hover:text-white flex items-center gap-1 py-1 px-2 rounded-lg bg-slate-700/40 hover:bg-slate-700 transition cursor-pointer"
        >
          <span>{isExpanded ? (lang === 'ur' ? 'مختصر دیکھیں' : 'Hide Steps') : (lang === 'ur' ? 'تفصیلات دیکھیں' : 'View Itinerary & Stops')}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartNavigation(plan);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-950/40 transition cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5 fill-current" />
          <span>{lang === 'ur' ? 'نیویگیشن شروع کریں' : 'Start Navigation'}</span>
        </button>
      </div>

      {/* Expanded Itinerary Drill-down */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-3">
          {plan.legs.map((leg, lIdx) => (
            <div
              key={lIdx}
              className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getBadgeStyle(leg.mode)}`}
                >
                  {leg.routeCode || leg.mode}
                </span>
                <span className="text-slate-400 font-mono">
                  {leg.durationMinutes} min • {leg.farePKR > 0 ? `Rs. ${leg.farePKR}` : 'Free walk'}
                </span>
              </div>

              <div className="text-slate-200 font-medium leading-relaxed">
                {lang === 'ur' ? leg.urduInstruction : leg.instruction}
              </div>

              {/* Intermediate Stops */}
              {leg.intermediateStops.length > 0 && (
                <div className="mt-1.5 pl-2 border-l-2 border-slate-700 text-slate-400 text-[11px]">
                  <div className="font-semibold text-slate-300">
                    {leg.intermediateStops.length} intermediate stops:
                  </div>
                  <div className="truncate">
                    {leg.intermediateStops.map((s) => s.name).join(' ➔ ')}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
