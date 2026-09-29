import { STOPS, ROUTES, getStop } from '../data/transitData';
import type { TransitStop, TransitRoute, TripPlan, TripLeg, TransitMode } from '../types/transit';

// ==========================================
// CONSTANTS & TRANSIT PERFORMANCE MODEL
// ==========================================
export const MODE_SPEEDS: Record<TransitMode, number> = {
  BRT: 42,        // Dedicated grade-separated rapid transit corridor
  EV_BUS: 26,     // Electric transit bus
  RED_BUS: 25,    // Peoples Red Bus
  LOCAL_BUS: 24,  // Standard city transit
  WALK: 4.8,      // 80 meters/min walking speed
  BYKEA: 32,      // Motorbike ride-hailing
};

export const MODE_WAIT_TIMES: Record<TransitMode, number> = {
  BRT: 2.5,
  LOCAL_BUS: 3.0,
  RED_BUS: 6.0,
  EV_BUS: 8.0,
  WALK: 0.0,
  BYKEA: 3.5,
};

// ==========================================
// HAVERSINE DISTANCE HELPER
// ==========================================
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return Math.round(calculateDistanceKm(lat1, lon1, lat2, lon2) * 1000);
}

// Find nearby stops with adaptive radius
export function findNearbyStops(lat: number, lng: number, maxDistanceMeters = 1800): { stop: TransitStop; distanceMeters: number }[] {
  const results: { stop: TransitStop; distanceMeters: number }[] = [];
  for (const stop of Object.values(STOPS)) {
    const dist = calculateDistanceMeters(lat, lng, stop.lat, stop.lng);
    if (dist <= maxDistanceMeters) {
      results.push({ stop, distanceMeters: dist });
    }
  }
  return results.sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export function findClosestStop(lat: number, lng: number): { stop: TransitStop; distanceMeters: number } {
  let closest: TransitStop = Object.values(STOPS)[0];
  let minDistance = Infinity;

  for (const stop of Object.values(STOPS)) {
    const dist = calculateDistanceMeters(lat, lng, stop.lat, stop.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = stop;
    }
  }

  return { stop: closest, distanceMeters: minDistance };
}

// ==========================================
// BIDIRECTIONAL ROUTE LEG BUILDER
// Supports both forward (0 -> n) and reverse (n -> 0) travel
// ==========================================
function buildTransitLeg(
  route: TransitRoute,
  fromStop: TransitStop,
  toStop: TransitStop,
  startIndex: number,
  endIndex: number
): TripLeg {
  const intermediateStops: TransitStop[] = [];
  const polyline: [number, number][] = [];

  let totalDistKm = 0;
  let prevStop: TransitStop = fromStop;
  polyline.push([fromStop.lat, fromStop.lng]);

  const step = startIndex < endIndex ? 1 : -1;
  const isForward = step > 0;

  for (let i = startIndex + step; isForward ? i <= endIndex : i >= endIndex; i += step) {
    const stopId = route.stops[i];
    const stop = getStop(stopId);
    if (stop) {
      if (isForward ? i < endIndex : i > endIndex) {
        intermediateStops.push(stop);
      }
      polyline.push([stop.lat, stop.lng]);
      totalDistKm += calculateDistanceKm(prevStop.lat, prevStop.lng, stop.lat, stop.lng);
      prevStop = stop;
    }
  }

  const speed = MODE_SPEEDS[route.category] || 24;
  const runningTimeMinutes = (totalDistKm / speed) * 60;
  const dwellTimeMinutes = intermediateStops.length * (route.category === 'BRT' ? 0.5 : 0.7);
  const waitTime = MODE_WAIT_TIMES[route.category] || 4.0;
  const totalDurationMinutes = Math.max(3, Math.round(waitTime + runningTimeMinutes + dwellTimeMinutes));

  let farePKR = typeof route.fare === 'number' ? route.fare : route.fare.min;
  if (typeof route.fare === 'object' && totalDistKm > 15) {
    farePKR = route.fare.max;
  }

  const instruction = `Board ${route.code} at ${fromStop.name} towards ${toStop.name} (${intermediateStops.length + 1} stops).`;
  const urduInstruction = `${fromStop.urduName} سے ${route.code} لیں اور ${toStop.urduName} اتریں۔`;

  return {
    mode: route.category,
    routeId: route.id,
    routeCode: route.code,
    routeName: route.name,
    routeUrduName: route.urduName,
    color: route.color,
    vehicleType: route.vehicleType,
    fromStop,
    toStop,
    intermediateStops,
    distanceMeters: Math.round(totalDistKm * 1000),
    durationMinutes: totalDurationMinutes,
    farePKR,
    instruction,
    urduInstruction,
    polyline,
  };
}

function buildWalkLeg(fromStop: TransitStop, toStop: TransitStop): TripLeg {
  const distMeters = calculateDistanceMeters(fromStop.lat, fromStop.lng, toStop.lat, toStop.lng);
  const durationMinutes = Math.max(1, Math.round((distMeters / 1000 / MODE_SPEEDS.WALK) * 60));

  return {
    mode: 'WALK',
    color: '#64748b',
    fromStop,
    toStop,
    intermediateStops: [],
    distanceMeters: distMeters,
    durationMinutes,
    farePKR: 0,
    instruction: `Walk ${distMeters}m from ${fromStop.name} to ${toStop.name}.`,
    urduInstruction: `${fromStop.urduName} سے ${toStop.urduName} تک پیدل چلیں۔`,
    polyline: [
      [fromStop.lat, fromStop.lng],
      [toStop.lat, toStop.lng],
    ],
  };
}

function buildBykeaLeg(fromStop: TransitStop, toStop: TransitStop): TripLeg {
  const distKm = calculateDistanceKm(fromStop.lat, fromStop.lng, toStop.lat, toStop.lng);
  const durationMinutes = Math.max(4, Math.round(MODE_WAIT_TIMES.BYKEA + (distKm / MODE_SPEEDS.BYKEA) * 60));
  const farePKR = Math.round(50 + distKm * 20);

  return {
    mode: 'BYKEA',
    color: '#059669',
    vehicleType: 'Ride Link',
    fromStop,
    toStop,
    intermediateStops: [],
    distanceMeters: Math.round(distKm * 1000),
    durationMinutes,
    farePKR,
    instruction: `Connect from ${fromStop.name} to ${toStop.name} (${distKm.toFixed(1)} km).`,
    urduInstruction: `${fromStop.urduName} سے ${toStop.urduName} تک رابطہ کریں۔`,
    polyline: [
      [fromStop.lat, fromStop.lng],
      [toStop.lat, toStop.lng],
    ],
  };
}

function generateBadges(legs: TripLeg[]): TripPlan['summaryBadges'] {
  return legs.map((leg) => {
    let icon = 'bus';
    let label = leg.routeCode || leg.mode;

    if (leg.mode === 'BRT') {
      icon = 'brt';
      label = `🟢 ${leg.routeCode || 'BRT'}`;
    } else if (leg.mode === 'WALK') {
      icon = 'walk';
      label = `🚶 Walk`;
    } else if (leg.mode === 'BYKEA') {
      icon = 'bykea';
      label = `🏍️ Ride`;
    } else {
      icon = 'bus';
      label = `🚌 ${leg.routeCode || 'Bus'}`;
    }

    return {
      mode: leg.mode,
      label,
      duration: leg.durationMinutes,
      color: leg.color,
      icon,
    };
  });
}

function createTripPlan(
  id: string,
  title: string,
  urduTitle: string,
  tag: TripPlan['tag'],
  tagUrdu: string,
  legs: TripLeg[]
): TripPlan {
  const totalDurationMinutes = legs.reduce((acc, l) => acc + l.durationMinutes, 0);
  const totalFarePKR = legs.reduce((acc, l) => acc + l.farePKR, 0);
  const totalDistanceKm = Number((legs.reduce((acc, l) => acc + l.distanceMeters, 0) / 1000).toFixed(1));
  const transferCount = legs.filter((l) => l.mode !== 'WALK').length - 1;
  const modes = Array.from(new Set(legs.map((l) => l.mode)));

  return {
    id,
    title,
    urduTitle,
    tag,
    tagUrdu,
    totalDurationMinutes,
    totalFarePKR,
    totalDistanceKm,
    transferCount: Math.max(0, transferCount),
    modes,
    legs,
    summaryBadges: generateBadges(legs),
  };
}

// ==========================================
// CORE FASTEST MULTIMODAL ROUTING ENGINE
// ==========================================
export function planJourney(
  originStopId: string,
  destStopId: string
): TripPlan[] {
  const origin = getStop(originStopId);
  const dest = getStop(destStopId);

  if (!origin || !dest) return [];
  if (originStopId === destStopId) return [];

  const plans: TripPlan[] = [];
  const candidateRoutes = ROUTES;

  // Direct walk fallback if under 800m
  const directDistance = calculateDistanceMeters(origin.lat, origin.lng, dest.lat, dest.lng);
  if (directDistance <= 800) {
    const walkLeg = buildWalkLeg(origin, dest);
    plans.push(
      createTripPlan(
        'plan-direct-walk',
        'Direct Walking Route',
        'پیدل راستہ',
        'FASTEST',
        'تیز ترین (پیدل)',
        [walkLeg]
      )
    );
    return plans;
  }

  // 1. Direct Routes on a single transit vehicle (Bidirectional!)
  for (const route of candidateRoutes) {
    const fromIdx = route.stops.indexOf(originStopId);
    const toIdx = route.stops.indexOf(destStopId);
    if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
      const leg = buildTransitLeg(route, origin, dest, fromIdx, toIdx);
      plans.push(
        createTripPlan(
          `plan-direct-${route.id}-${fromIdx}-${toIdx}`,
          `Direct ${route.code} Route`,
          `براہِ راست ${route.code}`,
          'DIRECT',
          'براہِ راست',
          [leg]
        )
      );
    }
  }

  // 2. Direct with Walk at Origin or Destination (Adaptive radius up to 2000m)
  const nearbyOrigins = findNearbyStops(origin.lat, origin.lng, 2000);
  const nearbyDests = findNearbyStops(dest.lat, dest.lng, 2000);

  for (const { stop: nOrigin, distanceMeters: origDist } of nearbyOrigins) {
    for (const { stop: nDest, distanceMeters: destDist } of nearbyDests) {
      for (const route of candidateRoutes) {
        const fromIdx = route.stops.indexOf(nOrigin.id);
        const toIdx = route.stops.indexOf(nDest.id);
        if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
          const legs: TripLeg[] = [];
          if (origDist > 80) {
            legs.push(
              origDist <= 1200
                ? buildWalkLeg(origin, nOrigin)
                : buildBykeaLeg(origin, nOrigin)
            );
          }
          legs.push(buildTransitLeg(route, nOrigin, nDest, fromIdx, toIdx));
          if (destDist > 80) {
            legs.push(
              destDist <= 1200
                ? buildWalkLeg(nDest, dest)
                : buildBykeaLeg(nDest, dest)
            );
          }

          let title = `Via ${route.code}`;
          if (route.category === 'BRT') {
            title = `Green Line BRT (${nOrigin.name} ➔ ${nDest.name})`;
          } else {
            title = `${route.code} (${nOrigin.name} ➔ ${nDest.name})`;
          }

          plans.push(
            createTripPlan(
              `plan-near-${route.id}-${nOrigin.id}-${nDest.id}`,
              title,
              `${route.code}`,
              'RECOMMENDED',
              'تجویز کردہ',
              legs
            )
          );
        }
      }
    }
  }

  // 3. 2-leg Multimodal Transit Transfers (Connecting through transit hubs)
  // Limit to closest 4 origins and closest 4 dests for fast execution
  const topOrigins = nearbyOrigins.slice(0, 4).map((o) => o.stop);
  const topDests = nearbyDests.slice(0, 4).map((d) => d.stop);

  for (const startStop of topOrigins) {
    for (const route1 of candidateRoutes) {
      const idx1 = route1.stops.indexOf(startStop.id);
      if (idx1 === -1) continue;

      // Check key transfer points along route1 in both directions
      for (let t = 0; t < route1.stops.length; t++) {
        if (t === idx1) continue;
        const transferStopId = route1.stops[t];
        const transferStop = getStop(transferStopId);
        if (!transferStop) continue;

        const transferNearby = findNearbyStops(transferStop.lat, transferStop.lng, 600);

        for (const { stop: t2Stop, distanceMeters: tWalkDist } of transferNearby) {
          for (const route2 of candidateRoutes) {
            if (route1.id === route2.id) continue;
            const idx2 = route2.stops.indexOf(t2Stop.id);
            if (idx2 === -1) continue;

            for (const endStop of topDests) {
              const destIdx = route2.stops.indexOf(endStop.id);
              if (destIdx !== -1 && destIdx !== idx2) {
                const legs: TripLeg[] = [];

                const initWalk = calculateDistanceMeters(origin.lat, origin.lng, startStop.lat, startStop.lng);
                if (initWalk > 80) {
                  legs.push(
                    initWalk <= 1200
                      ? buildWalkLeg(origin, startStop)
                      : buildBykeaLeg(origin, startStop)
                  );
                }

                legs.push(buildTransitLeg(route1, startStop, transferStop, idx1, t));

                if (tWalkDist > 80) {
                  legs.push(buildWalkLeg(transferStop, t2Stop));
                }

                legs.push(buildTransitLeg(route2, t2Stop, endStop, idx2, destIdx));

                const finalWalk = calculateDistanceMeters(endStop.lat, endStop.lng, dest.lat, dest.lng);
                if (finalWalk > 80) {
                  legs.push(
                    finalWalk <= 1200
                      ? buildWalkLeg(endStop, dest)
                      : buildBykeaLeg(endStop, dest)
                  );
                }

                plans.push(
                  createTripPlan(
                    `plan-transfer-${route1.id}-${route2.id}-${transferStop.id}`,
                    `${route1.code} ➔ ${route2.code}`,
                    `${route1.code} ➔ ${route2.code}`,
                    'RECOMMENDED',
                    'تجویز کردہ',
                    legs
                  )
                );
              }
            }
          }
        }
      }
    }
  }

  // 4. Bykea First-Mile / Last-Mile Fallback if stops > 1200m
  const closestToOrigin = findClosestStop(origin.lat, origin.lng);
  if (closestToOrigin.distanceMeters > 1200) {
    const hubStop = closestToOrigin.stop;
    const bykeaLeg = buildBykeaLeg(origin, hubStop);

    for (const route of candidateRoutes) {
      const fromIdx = route.stops.indexOf(hubStop.id);
      const toIdx = route.stops.indexOf(dest.id);
      if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
        const transitLeg = buildTransitLeg(route, hubStop, dest, fromIdx, toIdx);
        plans.push(
          createTripPlan(
            `plan-bykea-${hubStop.id}-${route.id}`,
            `Ride Feeder + ${route.code}`,
            `رائیڈ + ${route.code}`,
            'RECOMMENDED',
            'تجویز کردہ',
            [bykeaLeg, transitLeg]
          )
        );
      }
    }
  }

  // Deduplicate: Keep fastest plan for each route combination
  const bestPlanByTransitRoutes = new Map<string, TripPlan>();

  for (const plan of plans) {
    const transitModesAndRoutes = plan.legs
      .filter((l) => l.mode !== 'WALK')
      .map((l) => `${l.routeCode || l.mode}`)
      .join(' + ');

    const key = transitModesAndRoutes || 'WALK_ONLY';
    const existing = bestPlanByTransitRoutes.get(key);
    if (!existing || plan.totalDurationMinutes < existing.totalDurationMinutes) {
      bestPlanByTransitRoutes.set(key, plan);
    }
  }

  const uniquePlans = Array.from(bestPlanByTransitRoutes.values());

  // STRICT SORT: Fastest transit route first (duration ascending)
  uniquePlans.sort((a, b) => a.totalDurationMinutes - b.totalDurationMinutes);

  // Mark the #1 fastest plan
  if (uniquePlans.length > 0) {
    uniquePlans[0].tag = 'FASTEST';
    uniquePlans[0].tagUrdu = 'تیز ترین';
  }

  return uniquePlans.slice(0, 5);
}
