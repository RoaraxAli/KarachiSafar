/**
 * Regenerates src/data/roadPolylines.ts from the current route stop sequence.
 *
 * For every consecutive stop pair we ask OSRM for a road-following path and
 * keep the shortest sensible profile (drive / foot / bike). Each route polyline
 * is rebuilt as one continuous line and we record the polyline index of every
 * stop so the router can slice legs without guessing by nearest coordinate.
 *
 * Run with: node --experimental-strip-types scripts/generateRoadPolylines.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTES, STOPS } from '../src/data/transitData.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '..', 'src', 'data', 'roadPolylines.ts');

type LatLng = [number, number];

const PROFILES = [
  {
    name: 'driving',
    base: 'https://router.project-osrm.org/route/v1/driving/',
  },
  {
    name: 'foot',
    base: 'https://routing.openstreetmap.de/routed-foot/route/v1/driving/',
  },
  {
    name: 'bike',
    base: 'https://routing.openstreetmap.de/routed-bike/route/v1/driving/',
  },
] as const;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const distanceMeters = (a: LatLng, b: LatLng) => {
  const R = 6371000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

interface OsrmStep {
  geometry: { coordinates: [number, number][] };
}
interface OsrmLeg {
  distance: number;
  steps: OsrmStep[];
}
interface OsrmRoute {
  distance: number;
  legs: OsrmLeg[];
}
interface OsrmResponse {
  code: string;
  routes?: OsrmRoute[];
}

async function fetchProfile(
  base: string,
  stops: LatLng[],
  attempt = 0
): Promise<OsrmRoute | null> {
  const coords = stops.map(([lat, lng]) => `${lng},${lat}`).join(';');
  const url = `${base}${coords}?overview=false&steps=true&geometries=geojson&annotations=false`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'KarachiSafar-road-geometry/1.0' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as OsrmResponse;
    if (data.code !== 'Ok' || !data.routes?.length) {
      throw new Error(`OSRM ${data.code}`);
    }
    return data.routes[0];
  } catch (error) {
    if (attempt < 3) {
      await sleep(1200 * (attempt + 1));
      return fetchProfile(base, stops, attempt + 1);
    }
    console.warn(`  ! ${base.split('/')[2]} failed: ${(error as Error).message}`);
    return null;
  }
}

function legCoords(leg: OsrmLeg): LatLng[] {
  const points: LatLng[] = [];
  for (const step of leg.steps) {
    for (const [lng, lat] of step.geometry.coordinates) {
      const point: LatLng = [lat, lng];
      if (!points.length || distanceMeters(points[points.length - 1], point) > 1) {
        points.push(point);
      }
    }
  }
  return points;
}

function appendLeg(full: LatLng[], leg: LatLng[]): void {
  for (let i = 0; i < leg.length; i++) {
    const point = leg[i];
    const isLast = i === leg.length - 1;
    const last = full[full.length - 1];
    if (!isLast && last && distanceMeters(last, point) < 1) continue;
    full.push(point);
  }
}

async function main() {
  const roadPolylines: Record<string, LatLng[]> = {};
  const stopOffsets: Record<string, number[]> = {};
  const report: string[] = [];

  for (const route of ROUTES) {
    const stopIds = route.stops.filter((id) => STOPS[id]);
    if (stopIds.length < 2) {
      console.warn(`Skipping ${route.id}: not enough stops`);
      continue;
    }
    const stopCoords = stopIds.map((id) => [STOPS[id].lat, STOPS[id].lng] as LatLng);
    console.log(`\n${route.id}: ${stopIds.length} stops`);
    await sleep(350);

    const profiles: { name: string; route: OsrmRoute }[] = [];
    for (const profile of PROFILES) {
      const result = await fetchProfile(profile.base, stopCoords);
      if (result) {
        profiles.push({ name: profile.name, route: result });
        console.log(`  ${profile.name}: ${(result.distance / 1000).toFixed(1)} km`);
      }
      await sleep(350);
    }

    const full: LatLng[] = [];
    const offsets: number[] = [];
    let totalDirect = 0;
    let totalRouted = 0;
    let worstLeg = { label: '', ratio: 0 };
    let switches = 0;
    let lastProfile = 'driving';

    for (let i = 0; i < stopCoords.length - 1; i++) {
      const candidates = profiles
        .map((p) => ({ name: p.name, leg: p.route.legs[i] }))
        .filter((c) => c.leg && Number.isFinite(c.leg.distance));
      if (!candidates.length) {
        // Last-resort straight connection for this single pair only.
        const fallback: LatLng[] = [stopCoords[i], stopCoords[i + 1]];
        if (i === 0) full.push(fallback[0]);
        appendLeg(full, fallback.slice(1));
        offsets[i + 1] = full.length - 1;
        continue;
      }

      const shortest = candidates.reduce((a, b) =>
        a.leg.distance <= b.leg.distance ? a : b
      );
      const driving = candidates.find((c) => c.name === 'driving');
      // Prefer driving unless it is a clear detour compared with the shortest profile.
      const chosen =
        driving && driving.leg.distance <= shortest.leg.distance * 1.6 + 300
          ? driving
          : shortest;

      if (i > 0 && chosen.name !== lastProfile) switches++;
      lastProfile = chosen.name;

      const coords = legCoords(chosen.leg);
      if (i === 0) {
        full.push(coords[0]);
        appendLeg(full, coords.slice(1));
        offsets.push(0);
      } else {
        appendLeg(full, coords);
      }
      offsets[i + 1] = full.length - 1;

      const direct = distanceMeters(stopCoords[i], stopCoords[i + 1]);
      totalDirect += direct;
      totalRouted += chosen.leg.distance;
      const ratio = chosen.leg.distance / Math.max(direct, 1);
      if (ratio > worstLeg.ratio) {
        worstLeg = { label: `${stopIds[i]} -> ${stopIds[i + 1]}`, ratio };
      }
    }

    // Trim leading/trailing duplicates.
    const clean: LatLng[] = [];
    for (const point of full) {
      if (!clean.length || distanceMeters(clean[clean.length - 1], point) > 0.5) {
        clean.push(point);
      }
    }
    const rounded: LatLng[] = clean.map(
      ([lat, lng]) => [Number(lat.toFixed(6)), Number(lng.toFixed(6))] as LatLng
    );

    roadPolylines[route.id] = rounded;
    stopOffsets[route.id] = offsets;
    report.push(
      `${route.id.padEnd(15)} ${String(rounded.length).padStart(5)} pts  ` +
        `${(totalRouted / 1000).toFixed(1).padStart(5)} km  ` +
        `direct ${(totalDirect / 1000).toFixed(1).padStart(5)} km  ` +
        `worst x${worstLeg.ratio.toFixed(1)} (${worstLeg.label})  ` +
        `profile switches ${switches}`
    );
    console.log(`  -> ${report[report.length - 1]}`);
  }

  const body =
    `// AUTO-GENERATED by scripts/generateRoadPolylines.ts\n` +
    `// Road-following geometry for every transit route, rebuilt from the current\n` +
    `// stop sequence with OSRM. ROUTE_STOP_OFFSETS maps each stop in route.stops\n` +
    `// to its vertex index in ROAD_POLYLINES so legs can be sliced exactly.\n` +
    `export const ROAD_POLYLINES: Record<string, [number, number][]> = ${JSON.stringify(
      roadPolylines
    )};\n\n` +
    `export const ROUTE_STOP_OFFSETS: Record<string, number[]> = ${JSON.stringify(
      stopOffsets
    )};\n`;

  fs.writeFileSync(OUT_FILE, body, 'utf8');
  console.log('\n' + report.join('\n'));
  console.log(`\nWrote ${OUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
