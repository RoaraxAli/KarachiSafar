export type TransitMode =
  | 'BRT'
  | 'RED_BUS'
  | 'EV_BUS'
  | 'LOCAL_BUS'
  | 'WALK'
  | 'BYKEA';

export type ComfortLevel = 'AC' | 'NON_AC' | 'OPEN_AIR';

export interface TransitStop {
  id: string;
  name: string;
  urduName: string;
  lat: number;
  lng: number;
  area: string;
  isHub?: boolean;
  isBRTStation?: boolean;
}

export interface TransitRoute {
  id: string;
  code: string;
  name: string;
  urduName: string;
  category: TransitMode;
  vehicleType: string; // e.g. 'Articulated BRT Bus', '12m Air-Conditioned Bus', 'Minibus', 'Heavy Coach'
  color: string;
  fleetCategory: 'BRT' | 'RED_BUS' | 'EV_BUS' | 'LOCAL_BUS';
  fare: number | { min: number; max: number };
  intervalMinutes: number | { min: number; max: number };
  operatingHours: string;
  comfort: ComfortLevel;
  distanceKm?: number;
  stops: string[]; // stop IDs in sequence
  description?: string;
  urduDescription?: string;
}

export interface TripLeg {
  mode: TransitMode;
  routeId?: string;
  routeCode?: string;
  routeName?: string;
  routeUrduName?: string;
  color: string;
  comfort: ComfortLevel;
  vehicleType?: string;
  fromStop: TransitStop;
  toStop: TransitStop;
  intermediateStops: TransitStop[];
  distanceMeters: number;
  durationMinutes: number;
  farePKR: number;
  instruction: string;
  urduInstruction: string;
  polyline: [number, number][];
}

export interface TripPlan {
  id: string;
  title: string;
  urduTitle: string;
  tag: 'FASTEST' | 'CHEAPEST' | 'MOST_COMFORTABLE' | 'DIRECT' | 'BALANCED';
  tagUrdu: string;
  totalDurationMinutes: number;
  totalFarePKR: number;
  totalDistanceKm: number;
  transferCount: number;
  hasAC: boolean;
  modes: TransitMode[];
  legs: TripLeg[];
  summaryBadges: {
    mode: TransitMode;
    label: string;
    duration: number;
    color: string;
    icon: string;
  }[];
}

export type FilterCategory = 'ALL' | 'FASTEST' | 'COMFORTABLE' | 'LOCAL_BUS';
