// Generates a standalone Leaflet HTML overlay (routes_preview.html) with the
// fixed polylines, stop dots and per-route toggles so the geometry can be
// eyeballed without running the dev server.
import { writeFileSync } from "node:fs";
import { ROAD_POLYLINES, ROUTE_STOP_OFFSETS } from "../src/data/roadPolylines.ts";
import { STOPS, ROUTES } from "../src/data/transitData.ts";

const round6 = (v: number) => Math.round(v * 1e6) / 1e6;
const data: any = { routes: [], stops: {} };
for (const r of ROUTES) {
  const pts = ROAD_POLYLINES[r.id] || [];
  const offs = ROUTE_STOP_OFFSETS[r.id] || [];
  const stopPts = r.stops.map((sid: string) => STOPS[sid]).filter(Boolean).map((s: any) => [s.lat, s.lng]);
  data.routes.push({
    id: r.id, code: r.code, name: r.name, color: r.color,
    line: pts.map((p) => [round6(p[0]), round6(p[1])]),
    stops: stopPts,
  });
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Karachi Safar - fixed routes preview</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body { height:100%; margin:0; font-family:system-ui,sans-serif; }
  #map { height:100%; }
  .panel { position:absolute; top:10px; left:10px; z-index:1000; background:#fff;
           padding:10px 12px; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,.35);
           max-height:90vh; overflow:auto; width:250px; font-size:12px; }
  .panel h3 { margin:0 0 6px; font-size:13px; }
  .row { display:flex; align-items:center; gap:6px; padding:3px 0; cursor:pointer; }
  .sw { width:14px; height:14px; border-radius:3px; flex:0 0 auto; }
  .row.off { opacity:.35; }
  .hint { color:#666; margin:4px 0 8px; }
</style>
</head>
<body>
<div id="map"></div>
<div class="panel">
  <h3>Fixed route geometry (de-spurred + Green Line on BRT busway)</h3>
  <div class="hint">Click a route to show/hide. Toggle ALL:</div>
  <div class="row" id="btnAll"><b>ALL ROUTES ON/OFF</b></div>
  <div id="list"></div>
</div>
<script>
const DATA = ${JSON.stringify(data)};
const map = L.map('map', { zoomControl: true }).setView([24.9, 67.03], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
const layers = [];
DATA.routes.forEach((r, i) => {
  const poly = L.polyline(r.line, { color: r.color, weight: 4, opacity: 0.9 });
  const dots = L.layerGroup(r.stops.map(s => L.circleMarker(s, {
    radius: 3.5, color: '#111', weight: 1, fillColor: '#fff', fillOpacity: 1 })));
  const grp = L.layerGroup([poly, dots]);
  layers.push(grp);
  const row = document.createElement('div');
  row.className = 'row off';
  row.innerHTML = '<span class="sw" style="background:' + r.color + '"></span>' + (r.name || r.id);
  row.onclick = () => {
    if (map.hasLayer(grp)) { map.removeLayer(grp); row.classList.add('off'); }
    else { grp.addTo(map); row.classList.remove('off'); map.fitBounds(poly.getBounds().pad(0.05)); }
  };
  document.getElementById('list').appendChild(row);
  r._grp = grp; r._row = row; r._poly = poly;
});
document.getElementById('btnAll').onclick = () => {
  const anyOff = DATA.routes.some(r => !map.hasLayer(r._grp));
  DATA.routes.forEach(r => {
    if (anyOff) { r._grp.addTo(map); r._row.classList.remove('off'); }
    else { map.removeLayer(r._grp); r._row.classList.add('off'); }
  });
};
// Show the two heavies by default: W-11 and Green Line
DATA.routes.filter(r => r.id === 'W-11' || r.id === 'GREEN-LINE-BRT' || r.id === 'MARWAT-COACH')
  .forEach(r => { r._grp.addTo(map); r._row.classList.remove('off'); });
const some = DATA.routes.filter(r => map.hasLayer(r._grp));
if (some.length) map.fitBounds(L.featureGroup(some.map(r => r._poly)).getBounds().pad(0.05));
</script>
</body>
</html>`;

writeFileSync(new URL("../routes_preview.html", import.meta.url), html);
console.log("routes_preview.html written,", (html.length / 1024).toFixed(0), "KB");
