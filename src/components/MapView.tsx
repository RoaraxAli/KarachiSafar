import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Maximize2, Minimize2 } from 'lucide-react';
import type { TripPlan, TransitRoute } from '../types/transit';
import { STOPS, ROUTES } from '../data/transitData';

interface MapViewProps {
  selectedPlan: TripPlan | null;
  selectedRoute: TransitRoute | null;
  originStopId: string;
  destStopId: string;
  onSelectStop?: (stopId: string) => void;
  lang: 'en' | 'ur';
}

export const MapView: React.FC<MapViewProps> = ({
  selectedPlan,
  selectedRoute,
  originStopId,
  destStopId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [showAllCorridors, setShowAllCorridors] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Karachi Coordinates Center: 24.8900, 67.0400
    const map = L.map(mapContainerRef.current, {
      center: [24.8900, 67.0400],
      zoom: 12,
      zoomControl: false,
    });

    // Dark-mode OSM TileLayer (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CartoDB</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map contents when selectedPlan, selectedRoute, or showAllCorridors changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const bounds = L.latLngBounds([]);

    // 1. If showAllCorridors is enabled, render background network polylines
    if (showAllCorridors) {
      ROUTES.forEach((route) => {
        const latLngs: [number, number][] = [];
        route.stops.forEach((sId) => {
          const stop = STOPS[sId];
          if (stop) {
            latLngs.push([stop.lat, stop.lng]);
          }
        });

        if (latLngs.length > 1) {
          L.polyline(latLngs, {
            color: route.color,
            weight: route.category === 'BRT' ? 4 : 2,
            opacity: 0.35,
            lineJoin: 'round',
          }).addTo(layerGroup);
        }
      });
    }

    // 2. If a single route is being explored from Route Explorer
    if (selectedRoute && !selectedPlan) {
      const latLngs: [number, number][] = [];
      selectedRoute.stops.forEach((sId, idx) => {
        const stop = STOPS[sId];
        if (stop) {
          latLngs.push([stop.lat, stop.lng]);
          bounds.extend([stop.lat, stop.lng]);

          // Marker for each stop in route
          const markerIcon = L.divIcon({
            className: 'custom-stop-marker',
            html: `<div style="background-color: ${selectedRoute.color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.5)"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });

          L.marker([stop.lat, stop.lng], { icon: markerIcon })
            .bindPopup(`
              <div style="font-family: sans-serif; color: #0f172a; padding: 4px;">
                <div style="font-size: 11px; font-weight: bold; color: ${selectedRoute.color};">${selectedRoute.code} • Stop ${idx + 1}</div>
                <div style="font-size: 13px; font-weight: 700;">${stop.name}</div>
                <div style="font-size: 12px; color: #64748b;">${stop.urduName}</div>
                <div style="font-size: 11px; margin-top: 4px; color: #475569;">${stop.area}</div>
              </div>
            `)
            .addTo(layerGroup);
        }
      });

      if (latLngs.length > 1) {
        L.polyline(latLngs, {
          color: selectedRoute.color,
          weight: 5,
          opacity: 0.9,
          lineJoin: 'round',
        }).addTo(layerGroup);
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
      return;
    }

    // 3. Render Selected Journey Plan
    if (selectedPlan) {
      selectedPlan.legs.forEach((leg, legIdx) => {
        const latLngs = leg.polyline;
        if (latLngs.length > 0) {
          latLngs.forEach((pt) => bounds.extend(pt));

          // Draw polyline with color coding specified in prompt
          const isWalking = leg.mode === 'WALK';
          L.polyline(latLngs, {
            color: leg.color,
            weight: isWalking ? 4 : 6,
            opacity: 0.9,
            dashArray: isWalking ? '6, 8' : undefined,
            lineJoin: 'round',
          }).addTo(layerGroup);

          // Start Stop Marker
          const from = leg.fromStop;
          const isOrigin = legIdx === 0;
          const isDest = legIdx === selectedPlan.legs.length - 1;

          let markerBg = leg.color;
          let markerSymbol = `${legIdx + 1}`;
          if (isOrigin) {
            markerBg = '#10b981'; // Green
            markerSymbol = 'A';
          }

          const fromIcon = L.divIcon({
            className: 'custom-stop-marker',
            html: `<div style="background-color: ${markerBg}; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: white; box-shadow: 0 2px 6px rgba(0,0,0,0.6)">${markerSymbol}</div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          L.marker([from.lat, from.lng], { icon: fromIcon })
            .bindPopup(`
              <div style="font-family: sans-serif; color: #0f172a; padding: 4px;">
                <div style="font-size: 11px; font-weight: bold; color: ${leg.color};">${leg.routeCode || leg.mode}</div>
                <div style="font-size: 13px; font-weight: 700;">${from.name}</div>
                <div style="font-size: 12px; color: #64748b;">${from.urduName}</div>
                <div style="font-size: 11px; margin-top: 4px; color: #334155;">${from.area}</div>
              </div>
            `)
            .addTo(layerGroup);

          // If last leg, mark final destination
          if (isDest) {
            const to = leg.toStop;
            const destIcon = L.divIcon({
              className: 'custom-stop-marker',
              html: `<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: white; box-shadow: 0 2px 8px rgba(239,68,68,0.6)">🏁</div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });

            L.marker([to.lat, to.lng], { icon: destIcon })
              .bindPopup(`
                <div style="font-family: sans-serif; color: #0f172a; padding: 4px;">
                  <div style="font-size: 11px; font-weight: bold; color: #ef4444;">Final Destination</div>
                  <div style="font-size: 13px; font-weight: 700;">${to.name}</div>
                  <div style="font-size: 12px; color: #64748b;">${to.urduName}</div>
                </div>
              `)
              .addTo(layerGroup);
          }

          // Intermediate Stop Dots
          leg.intermediateStops.forEach((iStop) => {
            const intermediateIcon = L.divIcon({
              className: 'custom-stop-marker',
              html: `<div style="background-color: ${leg.color}; width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid white;"></div>`,
              iconSize: [8, 8],
              iconAnchor: [4, 4],
            });

            L.marker([iStop.lat, iStop.lng], { icon: intermediateIcon })
              .bindPopup(`
                <div style="font-family: sans-serif; color: #0f172a; padding: 2px;">
                  <div style="font-size: 12px; font-weight: 600;">${iStop.name}</div>
                  <div style="font-size: 11px; color: #64748b;">${iStop.urduName}</div>
                </div>
              `)
              .addTo(layerGroup);
          });
        }
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    } else {
      // Default: Origin and destination pins if selected
      const orig = STOPS[originStopId];
      const dst = STOPS[destStopId];
      if (orig) {
        bounds.extend([orig.lat, orig.lng]);
        L.marker([orig.lat, orig.lng]).addTo(layerGroup).bindPopup(orig.name);
      }
      if (dst) {
        bounds.extend([dst.lat, dst.lng]);
        L.marker([dst.lat, dst.lng]).addTo(layerGroup).bindPopup(dst.name);
      }
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }
  }, [selectedPlan, selectedRoute, showAllCorridors, originStopId, destStopId]);

  // Recalculate size on expansion
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 250);
    }
  }, [isExpanded]);

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl transition-all ${
        isExpanded ? 'h-[75vh]' : 'h-80 sm:h-[420px]'
      }`}
    >
      {/* Leaflet Map Div */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Controls & Overlays */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-2">
        {/* Network Overlay Toggle */}
        <button
          onClick={() => setShowAllCorridors(!showAllCorridors)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-lg backdrop-blur-md transition cursor-pointer ${
            showAllCorridors
              ? 'bg-purple-600 text-white border-purple-400'
              : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:bg-slate-800'
          }`}
          title="Toggle All Karachi Transit Corridors"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{showAllCorridors ? 'Hide Transit Mesh' : 'Show All Karachi Corridors'}</span>
        </button>
      </div>

      {/* Expand/Contract Map Button */}
      <div className="absolute top-3 right-3 z-[400]">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-lg backdrop-blur-md transition cursor-pointer"
          title={isExpanded ? 'Minimize Map' : 'Expand Map'}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Legend Bar at Bottom of Map */}
      <div className="absolute bottom-2 left-2 right-2 sm:right-auto z-[400] bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl text-[11px] flex items-center flex-wrap gap-x-3 gap-y-1">
        <span className="font-bold text-slate-400 uppercase text-[10px]">Legend:</span>
        <span className="flex items-center gap-1 text-purple-300">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>Chingchi</span>
        </span>
        <span className="flex items-center gap-1 text-emerald-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>BRT Green</span>
        </span>
        <span className="flex items-center gap-1 text-red-300">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>Red Bus</span>
        </span>
        <span className="flex items-center gap-1 text-cyan-300">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span>EV Bus</span>
        </span>
        <span className="flex items-center gap-1 text-amber-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Minibus / Coach</span>
        </span>
        <span className="flex items-center gap-1 text-blue-300">
          <span className="w-3 border-t-2 border-dashed border-blue-400" />
          <span>Walk</span>
        </span>
      </div>
    </div>
  );
};
