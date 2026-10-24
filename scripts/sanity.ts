// Quick sanity checks on the fixed polylines + definition of Green Line corridor.
import { ROAD_POLYLINES, ROUTE_STOP_OFFSETS } from "../src/data/roadPolylines.ts";
import { STOPS, ROUTES } from "../src/data/transitData.ts";

let bad = 0;
for (const r of ROUTES) {
  const pts = ROAD_POLYLINES[r.id];
  const offs = ROUTE_STOP_OFFSETS[r.id];
  if (!pts || pts.length < 2) { console.log(`${r.id}: MISSING POLYLINE`); bad++; continue; }
  if (!offs || offs.length !== r.stops.length) { console.log(`${r.id}: offsets ${offs?.length} != stops ${r.stops.length}`); bad++; continue; }
  for (const o of offs) {
    if (!Number.isInteger(o) || o < 0 || o >= pts.length) { console.log(`${r.id}: bad offset ${o}`); bad++; break; }
  }
}
console.log("bad routes:", bad);
console.log("stop key sample:", Object.keys(STOPS)[0], (Object.values(STOPS)[0] as any).name);

// Green Line corridor rough check: sample vertices between Nagan (24.93) and Lasbela (24.87)
const gl = ROAD_POLYLINES["GREEN-LINE-BRT"];
const inBand = gl.filter((p) => p[0] < 24.93 && p[0] > 24.86);
console.log("GL verts:", gl.length, "in Sher Shah band:", inBand.length);
console.log("GL lng range in band:", Math.min(...inBand.map(p => p[1])), Math.max(...inBand.map(p => p[1])));
