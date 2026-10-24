// Rebuilds GREEN-LINE-BRT geometry: monotone-snap its vertices onto the
// official OSM busway centerline (highway=busway name:en="Green Line BRT").
// Ordering parameter = arc distance along the official stop-to-stop corridor,
// so parallel one-way rails and mapping gaps don't break the snap.
import { readFileSync, writeFileSync } from "node:fs";
import { ROAD_POLYLINES, ROUTE_STOP_OFFSETS } from "../src/data/roadPolylines.ts";
import { STOPS, ROUTES } from "../src/data/transitData.ts";

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;
const hav = (a: number[], b: number[]) => {
  const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1]);
  const la1 = rad(a[0]), la2 = rad(b[0]);
  return 2 * R * Math.asin(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2));
};

// ---------- official stop-anchored corridor path ----------
const glRoute = ROUTES.find((r: any) => r.id === "GREEN-LINE-BRT");
const anchor: number[][] = (glRoute?.stops ?? [])
  .map((sid: string) => STOPS[sid])
  .filter((s: any) => s && s.lat !== undefined)
  .map((s: any) => [s.lat, s.lng]);
if (anchor.length < 4) throw new Error("GL stops missing");

// stop path resampled at 8m with cumulative meters
const anchorS: { p: number[]; d: number }[] = [];
let D = 0;
{
  anchorS.push({ p: anchor[0], d: 0 });
  for (let i = 1; i < anchor.length; i++) {
    const a = anchor[i - 1], b = anchor[i];
    const sec = hav(a, b);
    const steps = Math.max(1, Math.round(sec / 8));
    for (let t = 1; t <= steps; t++) {
      const k = t / steps;
      anchorS.push({ p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], d: D + (sec * k) });
    }
    D += sec;
  }
}
console.log("anchor path:", anchor.length, "stops,", Math.round(D), "m,", anchorS.length, "samples");

// ---------- busway samples, parameterized by nearest anchor arc ----------
const osm = JSON.parse(
  readFileSync(new URL("./busway_full.json", import.meta.url), "utf8").replace(/^\uFEFF/, "")
);
type Samp = { p: number[]; d: number };
const bw: Samp[] = [];
for (const e of osm.elements) {
  const g: number[][] = e.geometry.map((x: any) => [x.lat, x.lon]);
  for (let i = 1; i < g.length; i++) {
    const a = g[i - 1], b = g[i];
    const sec = hav(a, b);
    const steps = Math.max(1, Math.round(sec / 8));
    for (let t = 0; t < steps; t++) {
      const k = t / steps;
      bw.push({ p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], d: -1 });
    }
  }
  bw.push({ p: g[g.length - 1], d: -1 });
}
for (const s of bw) {
  let bi = 0, bd = Infinity;
  for (let i = 0; i < anchorS.length; i++) {
    const d = hav(s.p, anchorS[i].p);
    if (d < bd) { bd = d; bi = i; }
  }
  s.d = anchorS[bi].d;
}
bw.sort((a, b) => a.d - b.d);
console.log("busway samples:", bw.length);

// ---------- monotone snap ----------
const KEEP_FAR_M = 45;
const BACK_M = 60, FWD_M = 500;
const gl = ROAD_POLYLINES["GREEN-LINE-BRT"].map((p) => [p[0], p[1]]);
const snapped: number[][] = [];
let ptr = 0;
for (const p of gl) {
  let best: Samp | null = null, bestCost = Infinity;
  for (const s of bw) {
    if (s.d < ptr - BACK_M) continue;
    if (s.d > ptr + FWD_M) break;
    const dist = hav(p, s.p);
    const cost = dist + Math.abs(s.d - ptr) * 0.02; // prefer continuity
    if (cost < bestCost) { bestCost = cost; best = s; }
  }
  if (best && bestCost - Math.abs(best.d - ptr) * 0.02 < KEEP_FAR_M) {
    snapped.push(best.p);
    ptr = best.d;
  } else {
    snapped.push(p);
  }
}

// de-dupe
const out: number[][] = [snapped[0]];
for (let i = 1; i < snapped.length; i++) {
  if (hav(out[out.length - 1], snapped[i]) > 0.8) out.push(snapped[i]);
}

// ---------- offsets (nearest vertex index) ----------
const offsets = (glRoute?.stops ?? [])
  .map((sid: string) => STOPS[sid])
  .filter((s: any) => s && s.lat !== undefined)
  .map((s: any) => {
    let bi = 0, bd = Infinity;
    for (let i = 0; i < out.length; i++) {
      const d = hav(out[i], [s.lat, s.lng]);
      if (d < bd) { bd = d; bi = i; }
    }
    return bi;
  });

// ---------- report ----------
let near = 0;
for (const p of out) {
  let m = Infinity;
  for (const s of bw) { const d = hav(p, s.p); if (d < m) m = d; }
  if (m < 15) near++;
}
console.log(`GL after snap: verts=${out.length} within15m=${near} (${Math.round(100 * near / out.length)}%)`);
console.log("offsets:", offsets.join(", "), "| stops:", glRoute?.stops.length, "| ok:", Math.max(...offsets) < out.length);

// ---------- write file back (only GL changes) ----------
const round6 = (v: number) => Math.round(v * 1e6) / 1e6;
const lines: string[] = [];
lines.push("// Official route polylines: Google My Maps KML for PBS routes, OSRM for others.");
lines.push("// Stop-less excursion spurs collapsed; stop-served out-and-backs kept.");
lines.push("// GREEN-LINE-BRT monotone-snapped onto the official OSM busway.");
lines.push("export const ROAD_POLYLINES: Record<string, [number, number][]> = {");
for (const [rid, pts] of Object.entries(ROAD_POLYLINES)) {
  const use: number[][] = rid === "GREEN-LINE-BRT" ? out : pts.map((p) => [p[0], p[1]]);
  lines.push(`  "${rid}": [`);
  for (const [a, b] of use) lines.push(`    [${round6(a)}, ${round6(b)}],`);
  lines.push("  ],");
}
lines.push("};");
lines.push("");
lines.push("export const ROUTE_STOP_OFFSETS: Record<string, number[]> = {");
for (const [rid, offs] of Object.entries(ROUTE_STOP_OFFSETS)) {
  const use = rid === "GREEN-LINE-BRT" ? offsets : offs;
  lines.push(`  "${rid}": [${use.join(", ")}],`);
}
lines.push("};");
writeFileSync(new URL("../src/data/roadPolylines.ts", import.meta.url), lines.join("\n") + "\n");
console.log("WROTE roadPolylines.ts");
