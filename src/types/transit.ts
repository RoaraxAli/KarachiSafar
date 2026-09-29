export type TransitMode =
  | 'BRT'
  | 'RED_BUS'
  | 'EV_BUS'
  | 'LOCAL_BUS'
  | 'WALK'
  | 'BYKEA';

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
  vehicleType: string;
  color: string;
  fare: number | { min: number; max: number };
  intervalMinutes: number | { min: number; max: number };
  operatingHours: string;
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
  tag: 'FASTEST' | 'DIRECT' | 'RECOMMENDED';
  tagUrdu: string;
  totalDurationMinutes: number;
  totalFarePKR: number;
  totalDistanceKm: number;
  transferCount: number;
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
