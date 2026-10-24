// Parse the fresh official KML and compare with current roadPolylines.ts geometry.
import { readFileSync, writeFileSync } from "node:fs";

const kml = readFileSync(new URL("./official_kml_fresh.kml", import.meta.url), "utf8");

// Extract all Placemark blocks with name + coordinates
const placemarks: { name: string; coords: [number, number][] }[] = [];
const pmRegex = /<Placemark>([\s\S]*?)<\/Placemark>/g;
let m: RegExpExecArray | null;
while ((m = pmRegex.exec(kml)) !== null) {
  const block = m[1];
  const nameMatch = block.match(/<name>([^<]*)<\/name>/);
  const coordMatch = block.match(/<coordinates>([\s\S]*?)<\/coordinates>/);
  if (!nameMatch || !coordMatch) continue;
  const name = nameMatch[1].trim();
  const coordsStr = coordMatch[1].trim().split(/\s+/).filter(Boolean);
  const coords: [number, number][] = [];
  for (const c of coordsStr) {
    const parts = c.split(",");
    if (parts.length >= 2) {
      const lng = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) coords.push([lat, lng]);
    }
  }
  if (coords.length > 0) placemarks.push({ name, coords });
}

console.log("Total placemarks in KML:", placemarks.length);
for (const p of placemarks) {
  console.log(`  "${p.name}": ${p.coords.length} vertices, start=[${p.coords[0][0].toFixed(5)},${p.coords[0][1].toFixed(5)}], end=[${p.coords[p.coords.length-1][0].toFixed(5)},${p.coords[p.coords.length-1][1].toFixed(5)}]`);
}

// Write parsed routes as JSON
const out: Record<string, [number, number][]> = {};
for (const p of placemarks) {
  out[p.name] = p.coords;
}
writeFileSync(new URL("./kml_routes_fresh.json", import.meta.url), JSON.stringify(out));
console.log("\nWrote kml_routes_fresh.json with", Object.keys(out).length, "routes");
