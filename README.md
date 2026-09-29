# Karachi Safar (کراچی سفر) - Multimodal Transit Navigator

**Karachi Safar** is a mobile-first, offline-capable transit navigator web application designed specifically for Karachi, Pakistan. 

Unlike Google Maps—which defaults to private cars, ride-hailing, or generic walking routes—**Karachi Safar** solves real-world urban commuting by integrating the complete informal and formal public transit ecosystem:
1. **Fixed Chingchi (6-Seater Qingqi Rickshaw) Corridors**: The short-haul feeder backbone connecting inner residential blocks to major transit spines.
2. **Green Line BRT Corridor**: Dedicated northern grade-separated corridor (Surjani Town to Numaish / M.A. Jinnah Road, 22 stations).
3. **Peoples Bus Service (Red Bus Fleet)**: R-1 through R-13 with full stop sequences.
4. **Peoples Electric Bus Fleet (EV / UV Series)**: Zero-emission air-conditioned routes (EV-1 to EV-5).
5. **Iconic Karachi Minibuses & Heavy Coaches**: High-frequency backbone routes (W-11, Marwat Coach, G-3, 4K, 5-C, 11-C, Bilal Coach, Star Line Coach, Muslim Coach, Data Coach, D-7, D-11, G-11, 1-C, F-10, Burki Coach, Hazara Coach).
6. **Walking Transfers**: Footpaths, pedestrian bridges, and underpasses connecting stops (<800m).
7. **Bykea / Ride-Hailing Fallback**: Dynamic first-mile and last-mile connectivity when transit stops exceed walking thresholds (>1 km).

---

## 🛺 Verified Dataset (`/data/transitData.ts`)

- **22 Chingchi Feeder Corridors**:
  - *North Karachi & Buffer Zone*: CC-N1 (Buffer Zone 15-A to Nagan), CC-N2 (Nagan to Sohrab Goth), CC-N3 (Power House to UP Mor & Godhra), CC-N4 (Surjani Feeder), CC-N5 (Buffer Zone to Hyderi).
  - *Central, Nazimabad & Liaquatabad*: CC-C1 (Five Star to Ayesha Manzil), CC-C2 (Hyderi to Water Pump), CC-C3 (Board Office to Banaras / SITE), CC-C4 (Liaquatabad to Guru Mandir), CC-C5 (Golimar to Habib Bank SITE).
  - *Gulshan, Johar & Scheme 33*: CC-E1 (University Road Student Trunk), CC-E2 (Johar Inner Loop), CC-E3 (Scheme 33 Connector), CC-E4 (Isphahani Feeder), CC-E5 (Civic Centre to Dalmia).
  - *South, Saddar & Old City*: CC-S1 (Numaish to Saddar Shuttle), CC-S2 (Tower to Lyari Feeder), CC-S3 (Tower to Keamari Port Shuttle), CC-S4 (Cantt Station to Saddar & JPMC).
  - *Korangi & Malir*: CC-K1 (Qayyumabad to Korangi Crossing), CC-K2 (Korangi Industrial Zone Feeder), CC-M1 (Malir Halt to Malir Cantt Feeder).
- **17 Iconic Minibuses & Heavy Coaches**: W-11, Marwat Coach, G-3, 4-K, 5-C, 11-C, 1-C, D-7, D-11, G-11, Bilal Coach, Star Line Coach, Muslim Coach, Data Coach, F-10, Burki Coach, Hazara Coach.
- **5 Peoples Electric Bus (EV Series)**: EV-1 (Malir Cantt to Dolmen Mall Clifton / Clock Tower), EV-2 (Bahria Town to Malir Halt), EV-3 (Malir Cantt to Numaish Chowrangi), EV-4 (Bahria Town to Ayesha Manzil), EV-5 (DHA City to Sohrab Goth).
- **10 Peoples Bus Service (Red Bus Fleet)**: R-1, R-2, R-3, R-4, R-8, R-9, R-10, R-11, R-12, R-13.
- **Green Line BRT**: 22 dedicated stations from Abdullah Chowrangi (Surjani) to Capri Cinema / M.A. Jinnah Road.

---

## 🧭 Multimodal Routing Engine (`/lib/graphRouter.ts`)

The algorithm implements multi-criteria graph search:
- **`CHINGCHI_EDGE`**: Ultra-low wait times (1–2 mins), high frequency, flat fare (Rs. 30–40).
- **`BRT_EDGE`**: Dedicated grade-separated corridor, 42 km/h average speed, zero traffic delay.
- **`RED_BUS_EDGE` & `EV_EDGE`**: Modern air-conditioned fleet, scheduled stops.
- **`LOCAL_BUS_EDGE`**: Aggressive frequency (2–4 min departures), cheapest fare (Rs. 30–40).
- **`TRANSFER_EDGE`**: Walking transfers (<800m).
- **`BYKEA_EDGE`**: Dynamic motorbike ride-hailing fallback for long distances (>1 km).

### Test Case Verification: Buffer Zone to Capri Cinema / M.A. Jinnah Road
The engine produces the 4 requested distinct options:
1. **Option 1 (Chingchi Feeder + Green Line BRT - Fastest & AC)**:
   Board Chingchi CC-N1 at Buffer Zone 15-A (4 mins, Rs. 30) ➔ Nagan Chowrangi ➔ Green Line BRT (18 mins, Rs. 50) ➔ Capri Cinema (~22 mins total, Rs. 80).
2. **Option 2 (Direct Red Bus)**:
   Walk 400m to Nagan ➔ Red Bus R-4 direct down Shahrah-e-Pakistan & Jehangir Road ➔ Capri Cinema (~38 mins, Rs. 50).
3. **Option 3 (Traditional Minibus W-11 - Cheapest Direct)**:
   Walk 400m to Nagan ➔ Board iconic W-11 minibus direct to Capri Cinema (~38 mins, Rs. 35).
4. **Option 4 (Qingqi Feeder + Local Minibus 5-C)**:
   Chingchi CC-N1 to Nagan Chowrangi ➔ Board 5-C minibus to Capri Cinema (~36 mins, Rs. 65).

---

## 🎨 Interactive Features
- **Interactive Leaflet Map**: Custom color-coded routes according to specs (Purple for Chingchi, Bright Green for BRT, Crimson Red for Red Bus, Cyan for EV Bus, Amber for Minibuses, Dotted Blue for Walking).
- **Leg Badges Chain**: Visual badges for each transfer and leg.
- **Simulated Navigation Mode**: Real-time simulated GPS guidance with "Next Stop" audio cues in Urdu/English and progress indicators.
- **Route Explorer**: Browse all 54 routes with complete stop sequences and timetables.
- **Chingchi Adda Directory**: Stand locations, outgoing routes, flat fares, and insider etiquette tips.
- **Fare Matrix Calculator**: Side-by-side cost breakdown comparing public transit against Bykea.
- **100% Offline Capable**: Zero server dependency for routing; runs entirely client-side.

---

## 🚀 Getting Started

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```
