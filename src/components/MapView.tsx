import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Maximize2, Minimize2 } from 'lucide-react';
import type { TripPlan, TransitRoute } from '../types/transit';
import { STOPS, ROUTES } from '../data/transitData';
import { ROAD_POLYLINES } from '../data/roadPolylines';

interface MapViewProps {
  selectedPlan: TripPlan | null;
  selectedRoute: TransitRoute | null;
  originStopId: string;
  destStopId: string;
  onSelectOrigin?: (stopId: string) => void;
  onSelectDest?: (stopId: string) => void;
  className?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  selectedPlan,
  selectedRoute,
  originStopId,
  destStopId,
  onSelectOrigin,
  onSelectDest,
  className,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const baseTileGroupRef = useRef<L.LayerGroup | null>(null);
  const [mapStyle, setMapStyle] = useState<'DARK' | 'STREET'>('STREET');
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

    // Base tile layer group
    const baseTileGroup = L.layerGroup().addTo(map);
    baseTileGroupRef.current = baseTileGroup;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    // Resize observer to auto-adapt map size when sidebar collapses or opens
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update base tile layer on style change
  useEffect(() => {
    const baseGroup = baseTileGroupRef.current;
    if (!baseGroup) return;
    baseGroup.clearLayers();

    if (mapStyle === 'DARK') {
      const darkBase = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          subdomains: ['a', 'b', 'c'],
          maxZoom: 19,
          className: 'map-tiles-dark',
        }
      );
      baseGroup.addLayer(darkBase);
    } else {
      // 100% Free Public OpenStreetMap: NO API KEY EVER REQUIRED, full street-level coverage across Karachi
      const street = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          subdomains: ['a', 'b', 'c'],
          maxZoom: 19,
          className: 'map-tiles-clean-white',
        }
      );
      baseGroup.addLayer(street);
    }
  }, [mapStyle]);

  // Update map contents when selectedPlan, selectedRoute, or showAllCorridors changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const bounds = L.latLngBounds([]);

    // 1. If showAllCorridors is enabled and no specific trip plan is active, render background network along ACTUAL ROADS
    if (showAllCorridors && !selectedPlan) {
      ROUTES.forEach((route) => {
        const roadPoly = ROAD_POLYLINES[route.id];
        const latLngs: [number, number][] =
          roadPoly && roadPoly.length > 1
            ? roadPoly
            : (route.stops.map((sId) => (STOPS[sId] ? [STOPS[sId].lat, STOPS[sId].lng] : null)).filter(Boolean) as [number, number][]);

        if (latLngs.length > 1) {
          L.polyline(latLngs, {
            color: route.color,
            weight: route.category === 'BRT' ? 4 : 2,
            opacity: 0.4,
            lineJoin: 'round',
          }).addTo(layerGroup);
        }
      });
    }

    // 2. If a single route is being explored from Route Explorer
    if (selectedRoute && !selectedPlan) {
      selectedRoute.stops.forEach((sId, idx) => {
        const stop = STOPS[sId];
        if (stop) {
          bounds.extend([stop.lat, stop.lng]);

          // Marker for each stop in route
          const markerIcon = L.divIcon({
            className: 'custom-stop-marker',
            html: `<div style="background-color: ${selectedRoute.color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.4)"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });

          L.marker([stop.lat, stop.lng], { icon: markerIcon })
            .bindPopup(`
              <div style="font-family: sans-serif; color: #0f172a; padding: 4px;">
                <div style="font-size: 11px; font-weight: bold; color: ${selectedRoute.color};">${selectedRoute.code} • Stop ${idx + 1}</div>
                <div style="font-size: 13px; font-weight: 700;">${stop.name}</div>
                <div style="font-size: 11px; margin-top: 4px; color: #475569;">${stop.area}</div>
              </div>
            `)
            .addTo(layerGroup);
        }
      });

      const roadPoly = ROAD_POLYLINES[selectedRoute.id];
      const routeLatLngs: [number, number][] =
        roadPoly && roadPoly.length > 1
          ? roadPoly
          : (selectedRoute.stops.map((sId) => (STOPS[sId] ? [STOPS[sId].lat, STOPS[sId].lng] : null)).filter(Boolean) as [number, number][]);

      if (routeLatLngs.length > 1) {
        L.polyline(routeLatLngs, {
          color: selectedRoute.color,
          weight: 5,
          opacity: 0.95,
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
            markerBg = '#059669'; // Emerald
            markerSymbol = 'A';
          }

          const fromIcon = L.divIcon({
            className: 'custom-stop-marker',
            html: `<div style="background-color: ${markerBg}; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: white; box-shadow: 0 2px 6px rgba(0,0,0,0.5)">${markerSymbol}</div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          L.marker([from.lat, from.lng], { icon: fromIcon })
            .bindPopup(`
              <div style="font-family: sans-serif; color: #0f172a; padding: 4px;">
                <div style="font-size: 11px; font-weight: bold; color: ${leg.color};">${leg.routeCode || leg.mode}</div>
                <div style="font-size: 13px; font-weight: 700;">${from.name}</div>
                <div style="font-size: 11px; margin-top: 4px; color: #334155;">${from.area}</div>
              </div>
            `)
            .addTo(layerGroup);

          // If last leg, mark final destination
          if (isDest) {
            const to = leg.toStop;
            const destIcon = L.divIcon({
              className: 'custom-stop-marker',
              html: `<div style="background-color: #dc2626; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: white; box-shadow: 0 2px 8px rgba(220,38,38,0.5)">🏁</div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });

            L.marker([to.lat, to.lng], { icon: destIcon })
              .bindPopup(`
                <div style="font-family: sans-serif; color: #0f172a; padding: 4px;">
                  <div style="font-size: 11px; font-weight: bold; color: #dc2626;">Final Destination</div>
                  <div style="font-size: 13px; font-weight: 700;">${to.name}</div>
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
      // 4. Render all interactive transit stops across Karachi
      Object.values(STOPS).forEach((stop) => {
        const isBRT = stop.isBRTStation;
        const isHub = stop.isHub;
        const isOrig = stop.id === originStopId;
        const isDest = stop.id === destStopId;

        // Skip origin & destination here - rendered as prominent pins below
        if (isOrig || isDest) return;

        const circle = L.circleMarker([stop.lat, stop.lng], {
          radius: isBRT ? 6 : isHub ? 5 : 3.5,
          fillColor: isBRT ? '#16a34a' : isHub ? '#0f172a' : '#64748b',
          color: '#ffffff',
          weight: isBRT || isHub ? 2 : 1.5,
          fillOpacity: 0.85,
        });

        const popupDiv = document.createElement('div');
        popupDiv.style.cssText = 'font-family: sans-serif; min-width: 170px; padding: 2px;';
        popupDiv.innerHTML = `
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: ${isBRT ? '#16a34a' : '#64748b'}; margin-bottom: 2px;">
            ${isBRT ? '🟢 BRT Station' : isHub ? '⭐ Transit Hub' : '🚏 Bus Stop'}
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${stop.name}</div>
          <div style="font-size: 11px; color: #475569; margin-top: 2px;">${stop.area} • <span class="urdu-font">${stop.urduName}</span></div>
          <div style="display: flex; gap: 6px; margin-top: 8px;">
            <button id="pop-orig-${stop.id}" style="flex: 1; padding: 5px 8px; font-size: 11px; font-weight: 700; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer;">
              Set Origin (A)
            </button>
            <button id="pop-dest-${stop.id}" style="flex: 1; padding: 5px 8px; font-size: 11px; font-weight: 700; background: #dc2626; color: white; border: none; border-radius: 6px; cursor: pointer;">
              Set Dest (🏁)
            </button>
          </div>
        `;

        circle.bindPopup(popupDiv);

        circle.on('popupopen', () => {
          const btnOrig = popupDiv.querySelector(`#pop-orig-${CSS.escape(stop.id)}`);
          const btnDest = popupDiv.querySelector(`#pop-dest-${CSS.escape(stop.id)}`);
          if (btnOrig && onSelectOrigin) {
            btnOrig.addEventListener('click', () => {
              onSelectOrigin(stop.id);
              map.closePopup();
            });
          }
          if (btnDest && onSelectDest) {
            btnDest.addEventListener('click', () => {
              onSelectDest(stop.id);
              map.closePopup();
            });
          }
        });

        circle.addTo(layerGroup);
      });

      // Clean custom SVG pins for selected origin and destination
      const orig = STOPS[originStopId];
      const dst = STOPS[destStopId];
      if (orig) {
        bounds.extend([orig.lat, orig.lng]);
        const origIcon = L.divIcon({
          className: 'custom-stop-marker',
          html: `<div style="background-color: #059669; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: white; box-shadow: 0 2px 6px rgba(0,0,0,0.4)">A</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        L.marker([orig.lat, orig.lng], { icon: origIcon, zIndexOffset: 1000 })
          .bindPopup(`<div style="font-weight: 700; font-size: 12px; color: #0f172a;">Origin: ${orig.name}</div>`)
          .addTo(layerGroup);
      }
      if (dst) {
        bounds.extend([dst.lat, dst.lng]);
        const dstIcon = L.divIcon({
          className: 'custom-stop-marker',
          html: `<div style="background-color: #dc2626; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: white; box-shadow: 0 2px 8px rgba(220,38,38,0.5)">🏁</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        L.marker([dst.lat, dst.lng], { icon: dstIcon, zIndexOffset: 1000 })
          .bindPopup(`<div style="font-weight: 700; font-size: 12px; color: #0f172a;">Destination: ${dst.name}</div>`)
          .addTo(layerGroup);
      }
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
      }
    }
  }, [selectedPlan, selectedRoute, showAllCorridors, originStopId, destStopId, onSelectOrigin, onSelectDest]);

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
      className={
        className ||
        `relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl transition-all ${
          isExpanded ? 'h-[75vh]' : 'h-80 sm:h-[420px]'
        }`
      }
    >
      {/* Leaflet Map Div */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Controls & Overlays on Top-Right */}
      <div className="absolute top-3 right-3 z-[400] flex flex-wrap items-center gap-2">
        {/* Network Overlay Toggle */}
        <button
          onClick={() => setShowAllCorridors(!showAllCorridors)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-sm transition cursor-pointer ${
            showAllCorridors
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title="Toggle All Karachi Transit Corridors"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{showAllCorridors ? 'Hide Transit Mesh' : 'Show All Karachi Corridors'}</span>
        </button>

        {/* Style Switcher (Street vs Dark) */}
        <button
          onClick={() => setMapStyle(mapStyle === 'DARK' ? 'STREET' : 'DARK')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm transition cursor-pointer"
          title="Switch Basemap Style"
        >
          <span>{mapStyle === 'DARK' ? '🗺️ Street Map' : '🌙 Dark Canvas'}</span>
        </button>

        {/* Expand/Contract Map Button only if not full screen className */}
        {!className && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition cursor-pointer"
            title={isExpanded ? 'Minimize Map' : 'Expand Map'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Legend Bar at Bottom of Map */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md text-[11px] flex items-center flex-wrap gap-x-3 gap-y-1 text-slate-700">
        <span className="font-bold text-slate-400 uppercase text-[10px]">Map:</span>
        <span className="flex items-center gap-1 text-slate-900 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <span>Public Transit</span>
        </span>
        <span className="flex items-center gap-1 text-slate-600 font-medium">
          <span className="w-3 border-t-2 border-dashed border-slate-500" />
          <span>Walking Link</span>
        </span>
      </div>
    </div>
  );
};
