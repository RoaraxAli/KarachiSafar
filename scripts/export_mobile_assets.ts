// Exports the web app's road-following polylines + stop offsets
// as a compact JSON asset for the Flutter mobile app.
// Run: node --experimental-strip-types scripts/export_mobile_assets.ts
import { ROAD_POLYLINES, ROUTE_STOP_OFFSETS } from "../src/data/roadPolylines.ts";
import { writeFileSync } from "node:fs";

const round6 = (v: number) => Math.round(v * 1e6) / 1e6;

const out: Record<string, { p: number[][]; o: number[] }> = {};
for (const [rid, pts] of Object.entries(ROAD_POLYLINES)) {
  out[rid] = {
    p: pts.map(([a, b]) => [round6(a), round6(b)]),
    o: (ROUTE_STOP_OFFSETS[rid] ?? []).map((v) => Math.round(v * 10) / 10),
  };
}

writeFileSync(
  new URL("../mobile-app/assets/route_polylines.json", import.meta.url),
  JSON.stringify(out)
);
console.log("routes exported:", Object.keys(out).length);
