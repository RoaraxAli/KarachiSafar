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

  // Helper for mode background color in crisp professional style
  const getBadgeStyle = (mode: TransitMode) => {
    switch (mode) {
      case 'CHINGCHI':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'BRT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'RED_BUS':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'EV_BUS':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'LOCAL_BUS':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'WALK':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'BYKEA':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTagColor = (tag: TripPlan['tag']) => {
    switch (tag) {
      case 'FASTEST':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'MOST_COMFORTABLE':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div
      onClick={() => onSelect(plan)}
      className={`rounded-xl transition-all border p-3.5 cursor-pointer ${
        isSelected
          ? 'bg-blue-50/30 border-blue-600 shadow-sm ring-1 ring-blue-600/30'
          : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
      }`}
    >
      {/* Top Header: Tag Badge & Total Duration (No fares) */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span
            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border tracking-wider uppercase ${getTagColor(
              plan.tag
            )}`}
          >
            {lang === 'ur' ? plan.tagUrdu : plan.tag}
          </span>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1 leading-snug">
            {lang === 'ur' ? plan.urduTitle : plan.title}
          </h3>
        </div>

        {/* Big Duration (Fares removed as requested) */}
        <div className="text-right flex-shrink-0">
          <div className="text-lg sm:text-xl font-bold text-slate-900 flex items-center justify-end gap-0.5">
            <span>{plan.totalDurationMinutes}</span>
            <span className="text-xs font-normal text-slate-500">min</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {plan.totalDistanceKm} km
          </div>
        </div>
      </div>

      {/* Summary Chips: Transfers & AC (No fares) */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2.5 text-xs text-slate-600">
        <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
          <Shuffle className="w-3 h-3 text-slate-400" />
          <span>
            {plan.transferCount === 0
              ? lang === 'ur'
                ? 'براہِ راست'
                : 'Direct'
              : lang === 'ur'
              ? `${plan.transferCount} ٹرانسفر`
              : `${plan.transferCount} Transfer${plan.transferCount > 1 ? 's' : ''}`}
          </span>
        </span>

        {plan.hasAC && (
          <span className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-blue-700 text-[11px] font-medium">
            <Wind className="w-3 h-3 text-blue-500" />
            <span>AC Available</span>
          </span>
        )}
      </div>

      {/* Leg Badges Chain */}
      <div className="mb-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200">
        <div className="flex items-center flex-wrap gap-1">
          {plan.summaryBadges.map((badge, idx) => (
            <Fragment key={idx}>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border flex items-center gap-1 ${getBadgeStyle(
                  badge.mode
                )}`}
              >
                <span>{badge.label}</span>
                <span className="text-[9px] opacity-75">({badge.duration}m)</span>
              </span>
              {idx < plan.summaryBadges.length - 1 && (
                <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
              )}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Action Buttons: Expand Details & Start Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 py-1 px-2 rounded hover:bg-slate-100 transition cursor-pointer"
        >
          <span>{isExpanded ? (lang === 'ur' ? 'مختصر کریں' : 'Hide Details') : (lang === 'ur' ? 'اسٹاپس دیکھیں' : 'View Stops')}</span>
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartNavigation(plan);
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer shadow-sm"
        >
          <Navigation className="w-3 h-3 fill-current" />
          <span>{lang === 'ur' ? 'نیویگیشن' : 'Navigate'}</span>
        </button>
      </div>

      {/* Expanded Itinerary Drill-down (No fares) */}
      {isExpanded && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2">
          {plan.legs.map((leg, lIdx) => (
            <div
              key={lIdx}
              className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(leg.mode)}`}
                >
                  {leg.routeCode || leg.mode}
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {leg.durationMinutes} min
                </span>
              </div>

              <div className="text-slate-700 font-medium leading-relaxed text-xs">
                {lang === 'ur' ? leg.urduInstruction : leg.instruction}
              </div>

              {/* Intermediate Stops */}
              {leg.intermediateStops.length > 0 && (
                <div className="mt-1 pl-2 border-l-2 border-slate-300 text-slate-500 text-[11px]">
                  <div className="font-semibold text-slate-700">
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
