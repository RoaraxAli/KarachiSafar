// Check stop offsets for monotonicity and reasonableness.
import { readFileSync } from "node:fs";
import { ROAD_POLYLINES, ROUTE_STOP_OFFSETS } from "../src/data/roadPolylines.ts";
import { STOPS, ROUTES } from "../src/data/transitData.ts";

function hav(a: number[], b: number[]): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const la1 = rad(a[0]), la2 = rad(b[0]);
  return 2 * R * Math.asin(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2));
}

console.log("OFFSET AUDIT:\n");
let totalProblems = 0;
for (const r of ROUTES) {
  const pts = ROAD_POLYLINES[r.id];
  const offs = ROUTE_STOP_OFFSETS[r.id];
  const stops = r.stops;
  if (!pts || !offs) {
    console.log(`${r.id}: MISSING data`);
    totalProblems++;
    continue;
  }
  if (offs.length !== stops.length) {
    console.log(`${r.id}: offsets(${offs.length}) != stops(${stops.length})`);
    totalProblems++;
    continue;
  }
  
  let nonMonotonic = 0;
  let oob = 0;
  let zeroDist = 0;
  for (let i = 0; i < offs.length; i++) {
    if (offs[i] < 0 || offs[i] >= pts.length) { oob++; continue; }
    if (i > 0 && offs[i] < offs[i-1]) nonMonotonic++;
    if (i > 0 && offs[i] === offs[i-1]) zeroDist++;
  }
  
  // Check distances between consecutive stops
  let unreasonable = 0;
  for (let i = 1; i < offs.length; i++) {
    if (offs[i] < 0 || offs[i] >= pts.length || offs[i-1] < 0 || offs[i-1] >= pts.length) continue;
    const d = hav(pts[offs[i-1]], pts[offs[i]]);
    if (d > 3000) unreasonable++; // more than 3km between stops is suspicious
  }
  
  if (nonMonotonic > 0 || oob > 0 || zeroDist > 0 || unreasonable > 0) {
    console.log(`${r.id} (${r.name}): nonMono=${nonMonotonic} OOB=${oob} samePos=${zeroDist} >3km gaps=${unreasonable}`);
    totalProblems += nonMonotonic + oob + zeroDist + unreasonable;
  }
}
console.log(`\nTotal problems: ${totalProblems}`);

// Show R-2 offsets in detail (had decreasing values)
const r2 = ROUTES.find((x: any) => x.id === "R-2");
if (r2) {
  const offs = ROUTE_STOP_OFFSETS["R-2"];
  const pts = ROAD_POLYLINES["R-2"];
  console.log("\nR-2 stop locations:");
  offs.forEach((o: number, i: number) => {
    const p = pts[o];
    const stopName = STOPS[r2.stops[i]]?.name || r2.stops[i];
    console.log(`  ${i}: v${o} [${p[0].toFixed(5)},${p[1].toFixed(5)}] ${stopName}`);
  });
}
