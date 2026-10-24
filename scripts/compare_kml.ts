// Compare fresh KML routes with current roadPolylines.ts routes.
import { readFileSync } from "node:fs";
import { ROAD_POLYLINES } from "../src/data/roadPolylines.ts";

const kml: Record<string, [number, number][]> = JSON.parse(
  readFileSync(new URL("./kml_routes_fresh.json", import.meta.url), "utf8")
);

// Map KML names to route IDs
const nameToId: Record<string, string> = {
  "R1 (Khokrapar No. 1 to Dockyard)": "R-1",
  "R2 (Power House Chowrangi to Korangi Crossing)": "R-2",
  "R3 (Power House Chowrangi to Nasir Jump)": "R-3",
  "R4 (Power House Chowrangi to Keamari)": "R-4",
  "R8 (Yousuf Goth to Tower)": "R-8",
  "R9 (Al Khidmat Hadeed to Tower)": "R-9",
  "R10 (Numaish to Ibrahim Hyderi)": "R-10",
  "R11 (Miran Nakka to Ziauddin Hospital)": "R-11",
  "R12 (Memon Goth to Lucky Star)": "R-12",
  "R13 (Hawksbay to Tower )": "R-13",
  "EV1 (Malir Cantt to Dolmen Mall Clifton)": "EV-1",
  "EV2 (Bahria Town to Malir Halt)": "EV-2",
  "EV4 (Bahria Town to Ayesha Manzil)": "EV-4",
  "EV3 (Malir Cantt to Numaish)": "EV-3",
  "EV5 (DHA City to Sohrab Goth)": "EV-5",
};

function hav(a: number[], b: number[]): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const la1 = rad(a[0]), la2 = rad(b[0]);
  return 2 * R * Math.asin(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2));
}

console.log("ROUTE COMPARISON (KML vs current roadPolylines.ts):\n");
for (const [kmlName, routeId] of Object.entries(nameToId)) {
  const kCoords = kml[kmlName];
  const cCoords = ROAD_POLYLINES[routeId];
  if (!cCoords) {
    console.log(`${routeId} (${kmlName}): MISSING from roadPolylines.ts`);
    continue;
  }
  
  // Compare start and end points
  const startDist = hav(kCoords[0], cCoords[0]);
  const endDist = hav(kCoords[kCoords.length - 1], cCoords[cCoords.length - 1]);
  
  // Check if they're the same by sampling middle points
  const midK = kCoords[Math.floor(kCoords.length / 2)];
  const midC = cCoords[Math.floor(cCoords.length / 2)];
  const midDist = hav(midK, midC);
  
  const exact = kCoords.length === cCoords.length && 
    kCoords.every((p, i) => hav(p, cCoords[i]) < 1);
  
  console.log(`${routeId} (${kmlName}):`);
  console.log(`  KML: ${kCoords.length} verts, current: ${cCoords.length} verts`);
  console.log(`  Start dist: ${startDist.toFixed(0)}m, End dist: ${endDist.toFixed(0)}m, Mid dist: ${midDist.toFixed(0)}m`);
  console.log(`  Exact match: ${exact}`);
  console.log(`  KML start: [${kCoords[0][0].toFixed(5)},${kCoords[0][1].toFixed(5)}]`);
  console.log(`  Curr start: [${cCoords[0][0].toFixed(5)},${cCoords[0][1].toFixed(5)}]`);
  console.log();
}
