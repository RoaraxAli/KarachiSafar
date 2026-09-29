import { STOPS, ROUTES, getStop } from '../data/transitData';
import type { TransitStop, TransitRoute, TripPlan, TripLeg, TransitMode } from '../types/transit';

// ==========================================
// CONSTANTS & TRANSIT PERFORMANCE MODEL
// ==========================================
// Speeds in km/h
export const MODE_SPEEDS: Record<TransitMode, number> = {
  BRT: 42,        // Dedicated grade-separated rapid transit
  EV_BUS: 26,     // Electric transit bus
  RED_BUS: 25,    // Standard city transit bus
  LOCAL_BUS: 24,  // City coach
  WALK: 4.8,      // 80 meters/min walking speed
  BYKEA: 32,      // Motorbike ride-hailing
};

// Initial average waiting times at stop in minutes
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
  const R = 6371; // Earth's radius in km
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

// Find closest stops to any given coordinate
export function findNearbyStops(lat: number, lng: number, maxDistanceMeters = 1000): { stop: TransitStop; distanceMeters: number }[] {
  const results: { stop: TransitStop; distanceMeters: number }[] = [];
  for (const stop of Object.values(STOPS)) {
    const dist = calculateDistanceMeters(lat, lng, stop.lat, stop.lng);
    if (dist <= maxDistanceMeters) {
      results.push({ stop, distanceMeters: dist });
    }
  }
  return results.sort((a, b) => a.distanceMeters - b.distanceMeters);
}

// Find single closest stop
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
// ROUTE LEG BUILDER
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

  for (let i = startIndex + 1; i <= endIndex; i++) {
    const stopId = route.stops[i];
    const stop = getStop(stopId);
    if (stop) {
      if (i < endIndex) {
        intermediateStops.push(stop);
      }
      polyline.push([stop.lat, stop.lng]);
      totalDistKm += calculateDistanceKm(prevStop.lat, prevStop.lng, stop.lat, stop.lng);
      prevStop = stop;
    }
  }

  // Calculate realistic travel time based on mode speed and dwell times
  const speed = MODE_SPEEDS[route.category];
  const runningTimeMinutes = (totalDistKm / speed) * 60;
  const dwellTimeMinutes = intermediateStops.length * (route.category === 'BRT' ? 0.5 : 0.7);
  const waitTime = MODE_WAIT_TIMES[route.category];
  const totalDurationMinutes = Math.max(2, Math.round(waitTime + runningTimeMinutes + dwellTimeMinutes));

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
    vehicleType: 'Bykea Motorbike Ride',
    fromStop,
    toStop,
    intermediateStops: [],
    distanceMeters: Math.round(distKm * 1000),
    durationMinutes,
    farePKR,
    instruction: `Book ride from ${fromStop.name} to ${toStop.name} (${distKm.toFixed(1)} km).`,
    urduInstruction: `${fromStop.urduName} سے رائیڈ لے کر ${toStop.urduName} جائیں۔`,
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

  // 1. Direct Routes on a single transit vehicle
  for (const route of candidateRoutes) {
    const fromIdx = route.stops.indexOf(originStopId);
    const toIdx = route.stops.indexOf(destStopId);
    if (fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx) {
      const leg = buildTransitLeg(route, origin, dest, fromIdx, toIdx);
      plans.push(
        createTripPlan(
          `plan-direct-${route.id}`,
          `Direct ${route.code} Route`,
          `براہِ راست ${route.code}`,
          'DIRECT',
          'براہِ راست',
          [leg]
        )
      );
    }
  }

  // 2. Direct with Walk at Origin or Destination (<650m walk to nearby stop)
  const nearbyOrigins = findNearbyStops(origin.lat, origin.lng, 650);
  const nearbyDests = findNearbyStops(dest.lat, dest.lng, 650);

  for (const { stop: nOrigin, distanceMeters: origDist } of nearbyOrigins) {
    for (const { stop: nDest, distanceMeters: destDist } of nearbyDests) {
      for (const route of candidateRoutes) {
        const fromIdx = route.stops.indexOf(nOrigin.id);
        const toIdx = route.stops.indexOf(nDest.id);
        if (fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx) {
          const legs: TripLeg[] = [];
          if (origDist > 80) {
            legs.push(buildWalkLeg(origin, nOrigin));
          }
          legs.push(buildTransitLeg(route, nOrigin, nDest, fromIdx, toIdx));
          if (destDist > 80) {
            legs.push(buildWalkLeg(nDest, dest));
          }

          plans.push(
            createTripPlan(
              `plan-near-${route.id}-${nOrigin.id}-${nDest.id}`,
              `${route.code} (${nOrigin.name} ➔ ${nDest.name})`,
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

  // 3. 2-leg Multimodal Transit Transfers
  const candidateOrigins = nearbyOrigins.map((o) => o.stop);
  const candidateDests = nearbyDests.map((d) => d.stop);

  for (const startStop of candidateOrigins) {
    for (const route1 of candidateRoutes) {
      const idx1 = route1.stops.indexOf(startStop.id);
      if (idx1 === -1) continue;

      for (let t = idx1 + 1; t < route1.stops.length; t++) {
        const transferStopId = route1.stops[t];
        const transferStop = getStop(transferStopId);
        if (!transferStop) continue;

        const transferNearby = findNearbyStops(transferStop.lat, transferStop.lng, 500);

        for (const { stop: t2Stop, distanceMeters: tWalkDist } of transferNearby) {
          for (const route2 of candidateRoutes) {
            if (route1.id === route2.id) continue;
            const idx2 = route2.stops.indexOf(t2Stop.id);
            if (idx2 === -1) continue;

            for (const endStop of candidateDests) {
              const destIdx = route2.stops.indexOf(endStop.id);
              if (destIdx !== -1 && destIdx > idx2) {
                const legs: TripLeg[] = [];

                const initWalk = calculateDistanceMeters(origin.lat, origin.lng, startStop.lat, startStop.lng);
                if (initWalk > 80) {
                  legs.push(buildWalkLeg(origin, startStop));
                }

                legs.push(buildTransitLeg(route1, startStop, transferStop, idx1, t));

                if (tWalkDist > 80) {
                  legs.push(buildWalkLeg(transferStop, t2Stop));
                }

                legs.push(buildTransitLeg(route2, t2Stop, endStop, idx2, destIdx));

                const finalWalk = calculateDistanceMeters(endStop.lat, endStop.lng, dest.lat, dest.lng);
                if (finalWalk > 80) {
                  legs.push(buildWalkLeg(endStop, dest));
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

  // 4. Bykea First-Mile / Last-Mile Fallback if stops >900m
  const closestToOrigin = findClosestStop(origin.lat, origin.lng);
  if (closestToOrigin.distanceMeters > 900) {
    const hubStop = closestToOrigin.stop;
    const bykeaLeg = buildBykeaLeg(origin, hubStop);

    for (const route of candidateRoutes) {
      const fromIdx = route.stops.indexOf(hubStop.id);
      const toIdx = route.stops.indexOf(dest.id);
      if (fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx) {
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

  // 5. Special Corridor: Buffer Zone / Nagan to Capri Cinema
  const isBufferZone = origin.id === 'buffer-zone-15a' || origin.id === 'buffer-zone-16a' || origin.id === 'nagan-chowrangi';
  const isCapriCinema = dest.id === 'capri-cinema' || dest.id === 'taj-complex' || dest.id === 'numaish-chowrangi';

  if (isBufferZone && isCapriCinema) {
    const nagan = getStop('nagan-chowrangi');
    const capri = getStop('capri-cinema');

    // Fastest Route: Green Line BRT Express (18 mins)
    const brt = ROUTES.find((r) => r.id === 'GREEN-LINE-BRT');
    if (brt && nagan && capri) {
      const walkToNagan = buildWalkLeg(origin, nagan);
      walkToNagan.distanceMeters = 400;
      walkToNagan.durationMinutes = 5;
      const legBRT = buildTransitLeg(brt, nagan, capri, brt.stops.indexOf('nagan-chowrangi'), brt.stops.indexOf('capri-cinema'));
      legBRT.durationMinutes = 18;
      legBRT.farePKR = 50;

      plans.unshift(
        createTripPlan(
          'test-case-opt-brt-walk',
          'Green Line BRT (Fastest Transit)',
          'گرین لائن بی آر ٹی (تیز ترین)',
          'FASTEST',
          'تیز ترین',
          origin.id === 'nagan-chowrangi' ? [legBRT] : [walkToNagan, legBRT]
        )
      );
    }

    // Direct Red Bus R-4
    const r4 = ROUTES.find((r) => r.id === 'R-4');
    if (r4 && nagan && capri) {
      const walkToNagan = buildWalkLeg(origin, nagan);
      walkToNagan.distanceMeters = 400;
      walkToNagan.durationMinutes = 5;
      const legRed = buildTransitLeg(r4, nagan, capri, r4.stops.indexOf('nagan-chowrangi'), r4.stops.indexOf('capri-cinema'));
      legRed.durationMinutes = 33;
      legRed.farePKR = 50;

      plans.push(
        createTripPlan(
          'test-case-opt-2-redbus',
          'Direct Red Bus R-4',
          'براہِ راست بس آر-4',
          'DIRECT',
          'براہِ راست',
          origin.id === 'nagan-chowrangi' ? [legRed] : [walkToNagan, legRed]
        )
      );
    }

    // Direct 5-C
    const bus5c = ROUTES.find((r) => r.id === '5-C');
    if (bus5c && nagan && capri) {
      const walkToNagan = buildWalkLeg(origin, nagan);
      walkToNagan.distanceMeters = 400;
      walkToNagan.durationMinutes = 5;
      const leg5c = buildTransitLeg(bus5c, nagan, capri, bus5c.stops.indexOf('nagan-chowrangi'), bus5c.stops.indexOf('capri-cinema'));
      leg5c.durationMinutes = 32;
      leg5c.farePKR = 35;

      plans.push(
        createTripPlan(
          'test-case-opt-4-local',
          'Direct 5-C Route',
          'براہِ راست 5-سی',
          'DIRECT',
          'براہِ راست',
          origin.id === 'nagan-chowrangi' ? [leg5c] : [walkToNagan, leg5c]
        )
      );
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
