import { useState, useMemo, useEffect } from 'react';
import { ArrowUpDown, Search, MapPin, Check, Building2, Loader2 } from 'lucide-react';
import { STOPS } from '../data/transitData';
import type { TransitStop } from '../types/transit';

interface RouteSearchFormProps {
  originStopId: string;
  destStopId: string;
  setOriginStopId: (id: string) => void;
  setDestStopId: (id: string) => void;
}

interface GeocodedPlace {
  id: string;
  name: string;
  fullName: string;
  lat: number;
  lng: number;
  closestStop: TransitStop;
  distanceToStopM: number;
}

const MAPTILER_KEY = (import.meta.env.VITE_MAPTILER_KEY as string) || 'AOvhgXtMBXhIC38VrZSe';

export const RouteSearchForm: React.FC<RouteSearchFormProps> = ({
  originStopId,
  destStopId,
  setOriginStopId,
  setDestStopId,
}) => {
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [isOriginOpen, setIsOriginOpen] = useState(false);
  const [isDestOpen, setIsDestOpen] = useState(false);

  // MapTiler places search results
  const [originPlaces, setOriginPlaces] = useState<GeocodedPlace[]>([]);
  const [destPlaces, setDestPlaces] = useState<GeocodedPlace[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);

  const stopList = useMemo(() => Object.values(STOPS), []);

  // Helper to find nearest stop to a coordinate
  const findClosestStop = (lat: number, lng: number): { stop: TransitStop; distM: number } => {
    let closest = stopList[0];
    let minDist = Infinity;
    for (const s of stopList) {
      // Euclidean approximation for Karachi bounds is very accurate for ranking
      const dLat = (s.lat - lat) * 111000;
      const dLng = (s.lng - lng) * 102000;
      const dist = Math.hypot(dLat, dLng);
      if (dist < minDist) {
        minDist = dist;
        closest = s;
      }
    }
    return { stop: closest, distM: Math.round(minDist) };
  };

  // Debounced search on MapTiler Geocoding API for places/hospitals/roads
  useEffect(() => {
    if (!originSearch.trim() || originSearch.trim().length < 3) {
      setOriginPlaces([]);
      setIsSearchingOrigin(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingOrigin(true);
      try {
        const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(
          originSearch.trim()
        )}.json?key=${MAPTILER_KEY}&bbox=66.8,24.7,67.5,25.2&limit=5`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.features && Array.isArray(data.features)) {
          const places: GeocodedPlace[] = data.features.map((f: any) => {
            const [lng, lat] = f.center;
            const { stop, distM } = findClosestStop(lat, lng);
            return {
              id: f.id || `${lat},${lng}`,
              name: f.text || f.place_name?.split(',')[0] || originSearch,
              fullName: f.place_name || '',
              lat,
              lng,
              closestStop: stop,
              distanceToStopM: distM,
            };
          });
          setOriginPlaces(places);
        }
      } catch (err) {
        console.error('Error fetching places:', err);
      } finally {
        setIsSearchingOrigin(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [originSearch]);

  useEffect(() => {
    if (!destSearch.trim() || destSearch.trim().length < 3) {
      setDestPlaces([]);
      setIsSearchingDest(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingDest(true);
      try {
        const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(
          destSearch.trim()
        )}.json?key=${MAPTILER_KEY}&bbox=66.8,24.7,67.5,25.2&limit=5`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.features && Array.isArray(data.features)) {
          const places: GeocodedPlace[] = data.features.map((f: any) => {
            const [lng, lat] = f.center;
            const { stop, distM } = findClosestStop(lat, lng);
            return {
              id: f.id || `${lat},${lng}`,
              name: f.text || f.place_name?.split(',')[0] || destSearch,
              fullName: f.place_name || '',
              lat,
              lng,
              closestStop: stop,
              distanceToStopM: distM,
            };
          });
          setDestPlaces(places);
        }
      } catch (err) {
        console.error('Error fetching places:', err);
      } finally {
        setIsSearchingDest(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [destSearch]);

  const filteredOriginStops = useMemo(() => {
    if (!originSearch.trim()) return stopList.slice(0, 10);
    const q = originSearch.toLowerCase();
    return stopList
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.area.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [originSearch, stopList]);

  const filteredDestStops = useMemo(() => {
    if (!destSearch.trim()) return stopList.slice(0, 10);
    const q = destSearch.toLowerCase();
    return stopList
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.area.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [destSearch, stopList]);

  const originStop = originStopId ? STOPS[originStopId] : null;
  const destStop = destStopId ? STOPS[destStopId] : null;

  const handleSwap = () => {
    const temp = originStopId;
    setOriginStopId(destStopId);
    setDestStopId(temp);
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          const { stop } = findClosestStop(userLat, userLng);
          setOriginStopId(stop.id);
        },
        (err) => console.warn('Geolocation error:', err.message),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  return (
    <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm space-y-2">
      {/* Origin Field */}
      <div className="relative">
        <div
          onClick={() => setIsOriginOpen(true)}
          className="w-full bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-lg px-3 py-2 text-left flex items-center justify-between cursor-pointer transition"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 flex-shrink-0" />
            <div className="truncate">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Origin Stop or Place
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                {originStop ? (
                  <>
                    <span>{originStop.name}</span>
                    <span className="text-[11px] font-normal text-slate-500 ml-1.5">({originStop.area})</span>
                  </>
                ) : (
                  <span className="text-slate-400 font-normal">
                    Search stop, hospital, or place...
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleLocateMe();
              }}
              className="p-1 rounded hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="Nearest Stop to GPS"
            >
              <MapPin className="w-3.5 h-3.5" />
            </button>
            <Search className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Autocomplete Origin */}
        {isOriginOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto p-2">
            <input
              type="text"
              value={originSearch}
              onChange={(e) => setOriginSearch(e.target.value)}
              placeholder="Search stop, hospital, road (e.g. Aga Khan, Tower)..."
              className="w-full bg-slate-50 text-slate-900 rounded-lg px-3 py-1.5 text-xs border border-slate-300 focus:outline-none focus:border-slate-900 mb-1.5"
              autoFocus
            />

            {/* Places from MapTiler Search */}
            {originPlaces.length > 0 && (
              <div className="mb-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 px-2 py-1 flex items-center justify-between">
                  <span>Karachi Places & Hospitals</span>
                  {isSearchingOrigin && <Loader2 className="w-3 h-3 animate-spin" />}
                </div>
                <div className="space-y-0.5">
                  {originPlaces.map((place) => (
                    <div
                      key={place.id}
                      onClick={() => {
                        setOriginStopId(place.closestStop.id);
                        setIsOriginOpen(false);
                        setOriginSearch('');
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer hover:bg-emerald-50 transition border border-emerald-100/50 mb-0.5"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <div className="truncate">
                          <div className="font-semibold text-slate-900 truncate">{place.name}</div>
                          <div className="text-[10px] text-emerald-600 truncate">
                            Via nearest stop: {place.closestStop.name} ({place.distanceToStopM}m away)
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transit Stops */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                Official Transit Stops
              </div>
              <div className="space-y-0.5">
                {filteredOriginStops.map((stop) => (
                  <div
                    key={stop.id}
                    onClick={() => {
                      setOriginStopId(stop.id);
                      setIsOriginOpen(false);
                      setOriginSearch('');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer hover:bg-slate-100 transition ${
                      stop.id === originStopId ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{stop.name}</div>
                      <div className="text-[10px] text-slate-500">{stop.area} {stop.isBRTStation ? '• BRT' : ''}</div>
                    </div>
                    {stop.id === originStopId && <Check className="w-3.5 h-3.5 text-slate-900" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Swap Button Floating */}
      <div className="relative flex justify-end -my-1.5 pr-3 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSwap();
          }}
          className="w-6 h-6 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm flex items-center justify-center transition cursor-pointer"
          title="Swap Origin & Destination"
        >
          <ArrowUpDown className="w-3 h-3" />
        </button>
      </div>

      {/* Destination Field */}
      <div className="relative">
        <div
          onClick={() => setIsDestOpen(true)}
          className="w-full bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-lg px-3 py-2 text-left flex items-center justify-between cursor-pointer transition"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-600 flex-shrink-0" />
            <div className="truncate">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Destination Stop or Place
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                {destStop ? (
                  <>
                    <span>{destStop.name}</span>
                    <span className="text-[11px] font-normal text-slate-500 ml-1.5">({destStop.area})</span>
                  </>
                ) : (
                  <span className="text-slate-400 font-normal">
                    Search destination stop, hospital, or place...
                  </span>
                )}
              </div>
            </div>
          </div>
          <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        </div>

        {/* Autocomplete Destination */}
        {isDestOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto p-2">
            <input
              type="text"
              value={destSearch}
              onChange={(e) => setDestSearch(e.target.value)}
              placeholder="Search stop, hospital, road (e.g. Indus Hospital, Dolmen)..."
              className="w-full bg-slate-50 text-slate-900 rounded-lg px-3 py-1.5 text-xs border border-slate-300 focus:outline-none focus:border-slate-900 mb-1.5"
              autoFocus
            />

            {/* Places from MapTiler Search */}
            {destPlaces.length > 0 && (
              <div className="mb-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700 px-2 py-1 flex items-center justify-between">
                  <span>Karachi Places & Hospitals</span>
                  {isSearchingDest && <Loader2 className="w-3 h-3 animate-spin" />}
                </div>
                <div className="space-y-0.5">
                  {destPlaces.map((place) => (
                    <div
                      key={place.id}
                      onClick={() => {
                        setDestStopId(place.closestStop.id);
                        setIsDestOpen(false);
                        setDestSearch('');
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer hover:bg-rose-50 transition border border-rose-100/50 mb-0.5"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Building2 className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                        <div className="truncate">
                          <div className="font-semibold text-slate-900 truncate">{place.name}</div>
                          <div className="text-[10px] text-rose-600 truncate">
                            Via nearest stop: {place.closestStop.name} ({place.distanceToStopM}m away)
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transit Stops */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                Official Transit Stops
              </div>
              <div className="space-y-0.5">
                {filteredDestStops.map((stop) => (
                  <div
                    key={stop.id}
                    onClick={() => {
                      setDestStopId(stop.id);
                      setIsDestOpen(false);
                      setDestSearch('');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer hover:bg-slate-100 transition ${
                      stop.id === destStopId ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{stop.name}</div>
                      <div className="text-[10px] text-slate-500">{stop.area} {stop.isBRTStation ? '• BRT' : ''}</div>
                    </div>
                    {stop.id === destStopId && <Check className="w-3.5 h-3.5 text-slate-900" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
