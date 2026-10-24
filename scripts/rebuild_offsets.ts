// REBUILD ALL stop offsets: nearest vertex on ENTIRE polyline per stop.
// No forced monotonicity — routes can double back legitimately.
// Then audit for problems.
import { ROAD_POLYLINES, ROUTE_STOP_OFFSETS } from "../src/data/roadPolylines.ts";
import { STOPS, ROUTES } from "../src/data/transitData.ts";
import { writeFileSync } from "node:fs";

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;
const hav = (a: number[], b: number[]): number => {
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const la1 = rad(a[0]), la2 = rad(b[0]);
  return 2 * R * Math.asin(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2));
};

function nearestVertex(pts: number[][], stop: [number, number]): { idx: number; dist: number } {
  let bi = 0, bd = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const d = hav(pts[i], stop);
    if (d < bd) { bd = d; bi = i; }
  }
  return { idx: bi, dist: bd };
}

const newOffsets: Record<string, number[]> = {};
const report: Record<string, any> = {};
let totalWarn = 0;

for (const r of ROUTES) {
  const pts = ROAD_POLYLINES[r.id];
  const stops = r.stops.map((sid: string) => STOPS[sid]).filter((s: any) => s && s.lat !== undefined);
  if (!pts || stops.length === 0) continue;

  const offs: number[] = [];
  const dists: number[] = [];
  for (const s of stops) {
    const stop: [number, number] = [s.lat, s.lng];
    const { idx, dist } = nearestVertex(pts, stop);
    offs.push(idx);
    dists.push(dist);
  }

  let nonMono = 0, samePos = 0, farStop = 0;
  for (let i = 1; i < offs.length; i++) {
    if (offs[i] < offs[i-1]) nonMono++;
    if (offs[i] === offs[i-1]) samePos++;
  }
  for (const d of dists) if (d > 100) farStop++; // stop more than 100m from line

  const maxGapM = stops.length > 1 ? Math.max(...stops.slice(1).map((_, i) => hav(pts[offs[i]], pts[offs[i+1]]))) : 0;

  const issues: string[] = [];
  if (nonMono > 0) issues.push(`nonMono=${nonMono}`);
  if (samePos > 0) issues.push(`samePos=${samePos}`);
  if (farStop > 0) issues.push(`farStop=${farStop}`);
  if (maxGapM > 3000) issues.push(`maxGap=${Math.round(maxGapM)}m`);

  report[r.id] = { name: r.name, stops: stops.length, offsets: offs.join(","), issues: issues.join(", ") };
  newOffsets[r.id] = offs;
  if (issues.length > 0) totalWarn++;
}

console.log("OFFSETS REBUILT (nearest vertex, no forced monotonic):\n");
for (const [id, rep] of Object.entries(report)) {
  const flag = rep.issues ? ` <-- ${rep.issues}` : "";
  console.log(`${id}: ${rep.stops} stops${flag}`);
}
console.log(`\nRoutes with issues: ${totalWarn}`);

// Write back
const round6 = (v: number) => Math.round(v * 1e6) / 1e6;
const lines: string[] = [];
lines.push("// Official route polylines: Google My Maps KML for PBS routes, OSRM for others.");
lines.push("// Offsets rebuilt: each stop snapped to nearest vertex on the polyline.");
lines.push("export const ROAD_POLYLINES: Record<string, [number, number][]> = {");
for (const [rid, pts] of Object.entries(ROAD_POLYLINES)) {
  lines.push(`  "${rid}": [`);
  for (const [a, b] of pts) lines.push(`    [${round6(a)}, ${round6(b)}],`);
  lines.push("  ],");
}
lines.push("};");
lines.push("");
lines.push("export const ROUTE_STOP_OFFSETS: Record<string, number[]> = {");
for (const [rid, offs] of Object.entries(newOffsets)) {
  lines.push(`  "${rid}": [${offs.join(", ")}],`);
}
lines.push("};");
writeFileSync(new URL("../src/data/roadPolylines.ts", import.meta.url), lines.join("\n") + "\n");
console.log("WROTE roadPolylines.ts");
