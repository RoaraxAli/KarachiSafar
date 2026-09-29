# Karachi Safar (کراچی سفر) - Public Transit Navigator

**Karachi Safar** is a modern, responsive, high-performance public transit navigator designed specifically for Karachi, Pakistan. Built with a clean executive white interface, it provides rapid multimodal transit routing across Karachi's formal and informal transit arteries with zero server dependencies.

---

## 🚍 Transit Network Dataset

Karachi Safar integrates 33 verified transit routes across Karachi's major arterial networks:

1. **Green Line BRT (Dedicated Grade-Separated Rapid Transit)**
   - 22 dedicated modern elevated and at-grade stations connecting Surjani Town (Abdullah Chowrangi) to Central Business District (Numaish / Capri Cinema / M.A. Jinnah Road).
   - High speed (42 km/h avg), zero traffic delays, climate-controlled articulated buses.

2. **Peoples Bus Service (Red Bus Fleet)**
   - Air-conditioned high-capacity transit buses connecting all major urban sectors.
   - Comprehensive coverage across R-1, R-2, R-3, R-4, R-8, R-9, R-10, R-11, R-12, and R-13.

3. **Peoples Electric Bus Fleet (EV / UV Series)**
   - Zero-emission electric fleet (EV-1 to EV-5) connecting Malir Cantt, Bahria Town, DHA City, Ayesha Manzil, and Dolmen Mall Clifton.

4. **Iconic Karachi Minibuses & Heavy Coaches**
   - High-frequency backbone routes: W-11, Marwat Coach, G-3, 4-K, 5-C, 11-C, 1-C, D-7, D-11, G-11, Bilal Coach, Star Line Coach, Muslim Coach, Data Coach, F-10, Burki Coach, and Hazara Coach.

5. **Walking Transfers & Multimodal Connections**
   - Footpaths, pedestrian bridges, and underpasses connecting transit nodes (<800m).
   - First-mile and last-mile connectivity.

---

## 🧭 Multimodal Routing Engine

The routing engine executes multi-criteria path finding:
- **Direct Express Routes**: Point-to-point transit without vehicle transfers.
- **Multimodal Transfers**: Seamlessly combines local feeder coaches with rapid transit trunks (Green Line BRT & Red Bus).
- **Fastest Route Optimization**: Automatically calculates and ranks the fastest public transit connection between origin and destination.
- **Trip Drilldown**: Complete intermediate stop sequences, duration breakdowns, and transfer walking steps.

---

## 🎨 Professional Production UI

- **Executive White Design**: Clean, high-contrast, distraction-free neutral theme with zero gradients and optimized readability.
- **Full Interactive Map**: Leaflet-powered GIS mapping with clear route tracing, station badges, and English street layers (no API key required).
- **Simulated Live Navigation**: Turn-by-turn stop guidance with voice audio announcements in English and real-time station progress trackers.
- **Route Directory**: Complete explorer for all 33 routes with searchable stops, operating hours, and timetables.
- **100% Client-Side & Offline Ready**: Fast, instant computations in the browser without server latency.

---

## 🚀 Getting Started

### Local Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 📦 Deployment

Project Repository: [https://github.com/RoaraxAli/KarachiSafar.git](https://github.com/RoaraxAli/KarachiSafar.git)
