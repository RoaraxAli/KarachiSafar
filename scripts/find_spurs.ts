// Detects and (with --fix) collapses "excursion spur" artifacts in route
// polylines: the line leaves a road, wanders, and rejoins near where it
// left (goes to nowhere and comes back). A spur is only collapsed when it
// contains NO official stop vertex, so real out-and-back legs serve stops
// and stay.
//
// Report:  node --experimental-strip-types scripts/find_spurs.ts
// Fix:     node --experimental-strip-types scripts/find_spurs.ts --fix
import { ROAD_POLYLINES, ROUTE_STOP_OFFSETS } from "../src/data/roadPolylines.ts";
import { writeFileSync } from "node:fs";

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

function hav(a: number[], b: number[]): number {
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const la1 = rad(a[0]), la2 = rad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Tunables (meters)
const REVISIT_M = 100;  // spur returns within this of its start
const MIN_SPUR = 120;   // excursion must be at least this long
const MAX_SPUR = 900;   // longer loops may be real terminal circles -> keep
const RATIO = 1.8;      // spur length must beat revisit distance by this
const MIN_VERTS = 5;

function cumLen(pts: number[][]): number[] {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + hav(pts[i - 1], pts[i]));
  return cum;
}

interface Spur { i: number; j: number; len: number; back: number; }

function findSpur(pts: number[][], cum: number[], blocked: Set<number>): Spur | null {
  let best: Spur | null = null;
  const n = pts.length;
  for (let i = 0; i < n - MIN_VERTS - 1; i++) {
    for (let j = i + MIN_VERTS + 1; j < n; j++) {
      const len = cum[j] - cum[i];
      if (len > MAX_SPUR) break;          // longer than we ever remove
      if (len < MIN_SPUR) continue;
      const back = hav(pts[i], pts[j]);
      if (back > REVISIT_M) continue;
      if (len <= RATIO * back) continue;
      // no official stop may live inside the span (i exclusive..j exclusive)
      let hasStop = false;
      for (let k = i + 1; k < j; k++) {
        if (blocked.has(k)) { hasStop = true; break; }
      }
      if (hasStop) continue;
      if (!best || len > best.len) best = { i, j, len, back };
    }
  }
  return best;
}

function processRoute(rid: string, src: number[][], srcOff: number[]) {
  let pts = src;
  let stopIdx: number[] = [];
  const notes: string[] = [];

  // Preserve official stop vertex indices (only those that exist/bound-ok).
  stopIdx = srcOff.filter((v) => Number.isInteger(v) && v >= 0 && v < pts.length);
  if (srcOff.length !== stopIdx.length) notes.push(`${srcOff.length - stopIdx.length} bad stop idx dropped`);

  // 1. dedupe near-identical consecutive vertices, remapping stop idx
  {
    const keep: number[] = [0];
    for (let i = 1; i < pts.length; i++) {
      if (hav(pts[keep[keep.length - 1]], pts[i]) > 0.8) keep.push(i);
    }
    const map = new Map<number, number>();
    keep.forEach((oldI, newI) => map.set(oldI, newI));
    const before = pts.length;
    pts = keep.map((i) => pts[i]);
    stopIdx = stopIdx
      .map((v) => map.get(v))
      .filter((v): v is number => v !== undefined)
      .sort((a, b) => a - b);
    const dd = before - pts.length;
    if (dd > 0) notes.push(`${dd} dup verts`);
  }

  // 2. iteratively collapse spurs that contain no stop vertex
  const spurs: Spur[] = [];
  for (let guard = 0; guard < 40; guard++) {
    if (pts.length < 12) break;
    const cum = cumLen(pts);
    const s = findSpur(pts, cum, new Set(stopIdx));
    if (!s) break;
    const removed = s.j - s.i - 1;
    pts = pts.slice(0, s.i + 1).concat(pts.slice(s.j));
    stopIdx = stopIdx
      .map((v) => (v <= s.i ? v : v >= s.j ? v - removed : v)) // v==s.j -> i+1
      .sort((a, b) => a - b);
    spurs.push(s);
  }

  // sanity: every stop still inside bounds
  const bad = stopIdx.filter((v) => v >= pts.length).length;
  if (bad > 0) notes.push(`WARN ${bad} stop idx out of bounds`);

  return { pts, stopIdx, spurs, notes };
}

const FIX = process.argv.includes("--fix");
// Official PBS geometry came from the government Google My Maps KML -
// never touch those.
const KML_IDS = new Set([
  "R-1", "R-2", "R-3", "R-4", "R-8", "R-9", "R-10", "R-11", "R-12", "R-13",
  "EV-1", "EV-2", "EV-3", "EV-4", "EV-5",
]);
const report: any = {};
let totalSpurs = 0, totalVerts = 0;

const newLines: Record<string, number[][]> = {};
const newOffsets: Record<string, number[]> = {};

for (const [rid, pts] of Object.entries(ROAD_POLYLINES)) {
  if (KML_IDS.has(rid)) {
    report[rid] = { verts: `${pts.length} (kept, official KML)`, spurs: [], notes: [] };
    newLines[rid] = pts.map((p) => [p[0], p[1]]);
    newOffsets[rid] = [...(ROUTE_STOP_OFFSETS[rid] ?? [])];
    continue;
  }
  const src = pts.map((p) => [p[0], p[1]]);
  const srcOff: number[] = ROUTE_STOP_OFFSETS[rid] ?? [];
  const { pts: cur, stopIdx, spurs, notes } = processRoute(rid, src, srcOff);

  totalSpurs += spurs.length;
  totalVerts += src.length - cur.length;

  report[rid] = {
    verts: `${src.length} -> ${cur.length} (-${src.length - cur.length})`,
    spurs: spurs.map((s) => `${Math.round(s.len)}m at v${s.i}, returns ${Math.round(s.back)}m away`),
    notes,
  };

  newLines[rid] = cur;
  newOffsets[rid] = stopIdx;
}

console.log(JSON.stringify(report, null, 1));
console.log("TOTAL spurs:", totalSpurs, "| verts removed:", totalVerts);

if (FIX) {
  const round6 = (v: number) => Math.round(v * 1e6) / 1e6;
  const lines: string[] = [];
  lines.push("// Official route polylines: Google My Maps KML for PBS routes, OSRM for others.");
  lines.push("// Stop-less excursion spurs collapsed; stop-served out-and-backs kept.");
  lines.push("export const ROAD_POLYLINES: Record<string, [number, number][]> = {");
  for (const [rid, pts2] of Object.entries(newLines)) {
    lines.push(`  "${rid}": [`);
    for (const [a, b] of pts2) lines.push(`    [${round6(a)}, ${round6(b)}],`);
    lines.push("  ],");
  }
  lines.push("};");
  lines.push("");
  lines.push("export const ROUTE_STOP_OFFSETS: Record<string, number[]> = {");
  for (const [rid, offs] of Object.entries(newOffsets)) {
    lines.push(`  "${rid}": [${offs.join(", ")}],`);
  }
  lines.push("};");
  const target = new URL("../src/data/roadPolylines.ts", import.meta.url);
  writeFileSync(target, lines.join("\n") + "\n");
  console.log("WROTE", decodeURIComponent(target.pathname));
}
