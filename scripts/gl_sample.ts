// Sample Green Line verts and print geographic samples for corridor probing.
import { ROAD_POLYLINES } from "../src/data/roadPolylines.ts";
const gl = ROAD_POLYLINES["GREEN-LINE-BRT"];
const band = gl.filter((p) => p[0] < 24.92 && p[0] > 24.86);
const step = Math.max(1, Math.floor(band.length / 8));
for (let i = 0; i < band.length; i += step) console.log(band[i][0].toFixed(6), band[i][1].toFixed(6));
