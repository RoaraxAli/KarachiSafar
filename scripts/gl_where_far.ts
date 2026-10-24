// Where does the snapped Green Line still sit far from the busway chain?
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
// resample all fragments individually (8m) - global distance, no chaining
const samples: number[][] = [];
for (const e of osm.elements) {
  const g: number[][] = e.geometry.map((x: any) => [x.lat, x.lon]);
  for (let i = 1; i < g.length; i++) {
    const a = g[i - 1], b = g[i];
    const d = hav(a, b); const steps = Math.max(1, Math.round(d / 8));
    for (let t = 0; t < steps; t++) samples.push([a[0] + (b[0] - a[0]) * t / steps, a[1] + (b[1] - a[1]) * t / steps]);
  }
  samples.push(g[g.length - 1]);
}

const gl = ROAD_POLYLINES["GREEN-LINE-BRT"].map((p) => [p[0], p[1]]);
const dists = gl.map((p) => {
  let m = Infinity;
  for (const q of samples) { const d = hav(p, q); if (d < m) m = d; }
  return m;
});
const farSegs: string[] = [];
let cur: { s: number; e: number } | null = null;
for (let i = 0; i < gl.length; i++) {
  if (dists[i] >= 25) { if (!cur) cur = { s: i, e: i }; else cur.e = i; }
  else if (cur) { if (cur.e >= cur.s) farSegs.push(`v${cur.s}-${cur.e} @ ${gl[cur.s][0].toFixed(4)},${gl[cur.s][1].toFixed(4)}..${gl[cur.e][0].toFixed(4)},${gl[cur.e][1].toFixed(4)} (~${Math.round(dists[cur.s])}m)`); cur = null; }
}
if (cur) farSegs.push(`v${cur.s}-${cur.e} @ ${gl[cur.s][0].toFixed(4)},${gl[cur.s][1].toFixed(4)}..${gl[cur.e][0].toFixed(4)},${gl[cur.e][1].toFixed(4)}`);
const near = dists.filter((d) => d < 25).length;
console.log(`within25m=${near}/${gl.length}`);
console.log(farSegs.join("\n"));
