// Check how much of the Green Line polyline actually lies on the official
// BRT busway (highway=busway, name:en="Green Line BRT").
import { readFileSync } from "node:fs";
import { ROAD_POLYLINES } from "../src/data/roadPolylines.ts";

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;
const hav = (a: number[], b: number[]) => {
  const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1]);
  const la1 = rad(a[0]), la2 = rad(b[0]);
  return 2 * R * Math.asin(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2));
};

const osm = JSON.parse(
  readFileSync(new URL("./busway_full.json", import.meta.url), "utf8").replace(/^\uFEFF/, "")
);
const ways: number[][][] = osm.elements.map((e: any) => e.geometry.map((g: any) => [g.lat, g.lon]));
const allPts: number[][] = ways.flat();
console.log("busway ways:", ways.length, "busway verts:", allPts.length);

const gl = ROAD_POLYLINES["GREEN-LINE-BRT"];
let on = 0, near = 0, off = 0;
for (const p of gl) {
  let dmin = Infinity;
  for (const q of allPts) {
    const d = hav(p, q);
    if (d < dmin) dmin = d;
  }
  if (dmin < 12) on++;
  else if (dmin < 30) near++;
  else off++;
}
console.log(`GL verts total=${gl.length} onBusway(<12m)=${on} near(<30m)=${near} off(>=30m)=${off}`);

// Where are the off segments? approximate index laps
let run: { start: number; end: number }[] = [];
let cur: { start: number; end: number } | null = null;
gl.forEach((p, i) => {
  let dmin = Infinity;
  for (const q of allPts) { const d = hav(p, q); if (d < dmin) dmin = d; }
  const isOff = dmin >= 30;
  if (isOff) { if (!cur) cur = { start: i, end: i }; else cur.end = i; }
  else if (cur && cur.end - cur.start >= 4) { run.push(cur); cur = null; }
  else cur = null;
});
if (cur && cur.end - cur.start >= 4) run.push(cur);
console.log("offSegments:", JSON.stringify(run));
