import 'dart:convert';
import 'dart:math' show asin, cos, sin, sqrt;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:in_app_update/in_app_update.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:http/http.dart' as http;
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_filex/open_filex.dart';
import 'transit_data.dart';

const String webBaseUrl = 'https://karachi-safar.vercel.app';

/// Road-following geometry per route (same data the website draws).
/// { rid: { "p": [[lat,lng],...], "o": [offsetMeters,...] } }
Map<String, dynamic>? _routeGeometry;

Color colorFromHex(String hex, [Color fallback = Colors.blue]) {
  try {
    var s = hex.replaceAll('#', '').trim();
    if (s.length == 6) s = 'FF$s';
    if (s.length != 8) return fallback;
    return Color(int.parse(s, radix: 16));
  } catch (_) {
    return fallback;
  }
}

double _deg2rad(double d) => d * pi / 180.0;

double _haversineM(LatLng a, LatLng b) {
  const r = 6371000.0;
  final dLat = _deg2rad(b.latitude - a.latitude);
  final dLng = _deg2rad(b.longitude - a.longitude);
  final la1 = _deg2rad(a.latitude), la2 = _deg2rad(b.latitude);
  final h = sin(dLat / 2) * sin(dLat / 2) +
      cos(la1) * cos(la2) * sin(dLng / 2) * sin(dLng / 2);
  return 2 * r * asin(sqrt(h));
}

void main() {
  runApp(const KarachiSafarApp());
}

class KarachiSafarApp extends StatelessWidget {
  const KarachiSafarApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Karachi Safar',
      debugShowCheckedModeBanner: false,
      locale: const Locale('en', 'US'),
      supportedLocales: const [Locale('en', 'US')],
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue.shade700),
        useMaterial3: true,
        fontFamily: 'Roboto',
      ),
      home: const MapHomePage(),
    );
  }
}

class MapHomePage extends StatefulWidget {
  const MapHomePage({super.key});

  @override
  State<MapHomePage> createState() => _MapHomePageState();
}

class _MapHomePageState extends State<MapHomePage> {
  final MapController _mapController = MapController();
  LatLng _currentLocation = const LatLng(24.8607, 67.0011); // Karachi
  bool _locationEnabled = false;
  bool _isLoadingLocation = false;
  String _updateStatus = '';
  String _currentVersion = '';
  String _newVersion = '';
  bool _updateAvailable = false;
  bool _checkingUpdate = false;
  String _updateUrl = '';
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  // Route display state
  TransitRoute? _selectedRoute;
  List<LatLng> _routePoints = [];
  List<Marker> _routeMarkers = [];

  @override
  void initState() {
    super.initState();
    _checkLocationPermission();
    _checkForAppUpdate();
    _loadGeometry();
  }

  Future<void> _loadGeometry() async {
    try {
      final raw = await rootBundle.loadString('assets/route_polylines.json');
      final decoded = json.decode(raw) as Map<String, dynamic>;
      if (!mounted) return;
      setState(() => _routeGeometry = decoded);
    } catch (_) {
      // asset missing -> fall back to straight lines between stops
    }
  }

  // ---------- Road-following drawing ----------

  List<double> _cumulativeMeters(List<LatLng> pts) {
    final cum = <double>[0.0];
    for (int i = 1; i < pts.length; i++) {
      cum.add(cum.last + _haversineM(pts[i - 1], pts[i]));
    }
    return cum;
  }

  LatLng _pointAtOffset(List<LatLng> pts, List<double> cum, double target) {
    if (target <= 0) return pts.first;
    for (int i = 1; i < cum.length; i++) {
      if (cum[i] >= target) {
        final seg = cum[i] - cum[i - 1];
        final t = seg <= 0 ? 0.0 : (target - cum[i - 1]) / seg;
        final a = pts[i - 1], b = pts[i];
        return LatLng(
          a.latitude + (b.latitude - a.latitude) * t,
          a.longitude + (b.longitude - a.longitude) * t,
        );
      }
    }
    return pts.last;
  }

  void _selectRoute(TransitRoute route, {TransitStop? focusStop}) {
    setState(() {
      _selectedRoute = route;
      _routePoints = [];
      _routeMarkers = [];

      final geo = _routeGeometry?[route.id] as Map<String, dynamic>?;
      if (geo != null && (geo['p'] as List?) != null && (geo['p'] as List).isNotEmpty) {
        // Real road-following line (identical to the website's geometry).
        final rawPts = (geo['p'] as List).whereType<List>().toList();
        _routePoints = rawPts
            .map((e) =>
                LatLng((e[0] as num).toDouble(), (e[1] as num).toDouble()))
            .toList();
        final offsets = (geo['o'] as List? ?? const [])
            .map((e) => (e as num).toDouble())
            .toList();
        final cum = _cumulativeMeters(_routePoints);
        final routeColor = colorFromHex(route.color);

        if (offsets.isNotEmpty && offsets.length == route.stops.length) {
          for (int i = 0; i < offsets.length; i++) {
            final o = offsets[i];
            if (o < 0 || o > cum.last + 1) continue;
            final pos = _pointAtOffset(_routePoints, cum, o);
            if (i == 0 || i == offsets.length - 1) {
              _routeMarkers.add(_terminalMarker(pos, i == 0));
            } else {
              _routeMarkers.add(_midStopMarker(pos, routeColor));
            }
          }
        } else {
          _routeMarkers.add(_terminalMarker(_routePoints.first, true));
          _routeMarkers.add(_terminalMarker(_routePoints.last, false));
        }
      } else {
        // Fallback (should not normally happen): straight lines between stops.
        for (final stopId in route.stops) {
          final stop = findStop(stopId);
          if (stop != null) _routePoints.add(LatLng(stop.lat, stop.lng));
        }
        if (_routePoints.length >= 2) {
          _routeMarkers.add(_terminalMarker(_routePoints.first, true));
          _routeMarkers.add(_terminalMarker(_routePoints.last, false));
        }
      }
    });

    if (_routePoints.length >= 2) {
      final bounds = LatLngBounds.fromPoints(_routePoints);
      _mapController.fitCamera(
        CameraFit.bounds(bounds: bounds, padding: const EdgeInsets.all(50)),
      );
      if (focusStop != null) {
        Future.delayed(const Duration(milliseconds: 80), () {
          _mapController.move(LatLng(focusStop.lat, focusStop.lng), 16.5);
        });
      }
    }
  }

  Marker _terminalMarker(LatLng p, bool start) {
    return Marker(
      point: p,
      width: 30,
      height: 30,
      child: Container(
        decoration: BoxDecoration(
          color: start ? Colors.green.shade700 : Colors.red.shade600,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 2),
          boxShadow: const [
            BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 1)),
          ],
        ),
        child: Icon(start ? Icons.trip_origin : Icons.flag,
            color: Colors.white, size: 14),
      ),
    );
  }

  Marker _midStopMarker(LatLng p, Color routeColor) {
    return Marker(
      point: p,
      width: 12,
      height: 12,
      child: Container(
        decoration: BoxDecoration(
          color: routeColor,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 1.75),
        ),
      ),
    );
  }

  void _clearRoute() {
    setState(() {
      _selectedRoute = null;
      _routePoints = [];
      _routeMarkers = [];
    });
  }

  // ---------- Sheets ----------

  void _showRoutePlanner() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => RouteListSheet(onSelect: (route, {focusStop}) {
        Navigator.pop(context);
        _selectRoute(route, focusStop: focusStop);
      }),
    );
  }

  void _planFromMyLocation() {
    if (!_locationEnabled) {
      _getCurrentLocation().then((_) {
        if (_locationEnabled && mounted) _openNearbySheet();
      });
      return;
    }
    _openNearbySheet();
  }

  void _openNearbySheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => RouteFinderSheet(
        lat: _currentLocation.latitude,
        lng: _currentLocation.longitude,
        onSelect: (route, stop) {
          Navigator.pop(context);
          _selectRoute(route, focusStop: stop);
        },
      ),
    );
  }

  // ---------- Location ----------

  Future<void> _checkLocationPermission() async {
    setState(() => _isLoadingLocation = true);

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.deniedForever) {
      setState(() {
        _isLoadingLocation = false;
        _locationEnabled = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content:
                Text('Location permission permanently denied. Please enable in settings.'),
            action: SnackBarAction(label: 'Settings', onPressed: openAppSettings),
          ),
        );
      }
      return;
    }

    if (permission == LocationPermission.whileInUse ||
        permission == LocationPermission.always) {
      _getCurrentLocation();
    } else {
      setState(() {
        _isLoadingLocation = false;
        _locationEnabled = false;
      });
    }
  }

  Future<void> _getCurrentLocation() async {
    setState(() => _isLoadingLocation = true);
    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      setState(() {
        _currentLocation = LatLng(position.latitude, position.longitude);
        _locationEnabled = true;
        _isLoadingLocation = false;
      });
      _mapController.move(_currentLocation, 16.0);
    } catch (e) {
      setState(() => _isLoadingLocation = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not get location')),
        );
      }
    }
  }

  // ---------- In-app update ----------

  Future<void> _checkForAppUpdate() async {
    if (_checkingUpdate) return;
    setState(() => _checkingUpdate = true);
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      if (!mounted) return;
      setState(() => _currentVersion = packageInfo.version);

      final response = await http.get(Uri.parse(
          '$webBaseUrl/version.json?t=${DateTime.now().millisecondsSinceEpoch}'));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (!mounted) return;
        if (data['version'] != null && data['version'] != _currentVersion) {
          setState(() {
            _updateAvailable = true;
            _newVersion = data['version'].toString();
            _updateUrl =
                data['apkUrl'] ?? '$webBaseUrl/apk/karachi-safar-arm64-v8a.apk';
            _updateStatus = '';
          });
        }
      }
    } catch (_) {
      // offline / network error; user can retry from drawer
    } finally {
      if (mounted) setState(() => _checkingUpdate = false);
    }
  }

  Future<void> _downloadUpdate() async {
    if (_updateUrl.isEmpty) return;
    setState(() => _updateStatus = 'Downloading update...');
    try {
      final dir = await getExternalStorageDirectory() ??
          await getApplicationDocumentsDirectory();
      final filePath = '${dir.path}/karachi_safar_update.apk';
      final dio = Dio();
      await dio.download(_updateUrl, filePath);
      setState(() => _updateStatus = 'Opening installer...');
      await OpenFilex.open(filePath);
    } catch (e) {
      setState(() => _updateStatus = 'Download failed, opening browser...');
      await launchUrl(Uri.parse(_updateUrl), mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _checkPlayStoreUpdate() async {
    try {
      InAppUpdate.checkForUpdate().then((info) {
        if (info.updateAvailability == UpdateAvailability.updateAvailable) {
          if (info.immediateUpdateAllowed) {
            InAppUpdate.performImmediateUpdate().catchError((e) {
              if (mounted) setState(() => _updateStatus = 'Update failed');
            });
          } else if (info.flexibleUpdateAllowed) {
            InAppUpdate.startFlexibleUpdate().then((_) {
              InAppUpdate.completeFlexibleUpdate();
            }).catchError((e) {
              if (mounted) setState(() => _updateStatus = 'Update failed');
            });
          }
        }
      }).catchError((e) {
        // No Play Store (sideload) - silent
      });
    } catch (_) {
      // ignore
    }
  }

  // ---------- UI ----------

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        title: const Text('Karachi Safar'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.my_location),
            onPressed: _isLoadingLocation ? null : _getCurrentLocation,
            tooltip: 'My Location',
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: BoxDecoration(color: Colors.blue.shade700),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  const Icon(Icons.directions_bus, color: Colors.white, size: 48),
                  const SizedBox(height: 8),
                  const Text(
                    'Karachi Safar',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold),
                  ),
                  Text('v$_currentVersion',
                      style: const TextStyle(color: Colors.white70, fontSize: 14)),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.near_me),
              title: const Text('Plan Route'),
              subtitle: const Text('Find buses near your location'),
              onTap: () {
                Navigator.pop(context);
                _planFromMyLocation();
              },
            ),
            ListTile(
              leading: const Icon(Icons.route),
              title: const Text('All Routes'),
              onTap: () {
                Navigator.pop(context);
                _showRoutePlanner();
              },
            ),
            ListTile(
              leading: const Icon(Icons.my_location),
              title: const Text('My Location'),
              onTap: () {
                Navigator.pop(context);
                _getCurrentLocation();
              },
            ),
            const Divider(),
            if (_updateAvailable)
              ListTile(
                leading: const Icon(Icons.system_update, color: Colors.green),
                title: const Text('Update Available',
                    style: TextStyle(
                        color: Colors.green, fontWeight: FontWeight.bold)),
                subtitle: Text(_updateStatus.isEmpty
                    ? 'Tap to download & install'
                    : _updateStatus),
                onTap: () {
                  Navigator.pop(context);
                  _downloadUpdate();
                },
              )
            else
              ListTile(
                leading: const Icon(Icons.system_update_alt),
                title: const Text('Check for Updates'),
                subtitle: Text(_checkingUpdate
                    ? 'Checking...'
                    : _updateStatus.isEmpty
                        ? 'Up to date'
                        : _updateStatus),
                onTap: () {
                  Navigator.pop(context);
                  _checkPlayStoreUpdate();
                  _checkForAppUpdate();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Checking for updates...')),
                  );
                },
              ),
            const Divider(),
            const ListTile(
              leading: Icon(Icons.info_outline),
              title: Text('About'),
              subtitle: Text('Karachi Public Transit Navigator'),
            ),
          ],
        ),
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _currentLocation,
              initialZoom: 12.0,
            ),
            children: [
              TileLayer(
                urlTemplate:
                    'https://a.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.karachisafar.app',
                maxZoom: 19,
                tileProvider: NetworkTileProvider(),
              ),
              PolylineLayer(
                polylines: [
                  if (_routePoints.length >= 2 && _selectedRoute != null) ...[
                    Polyline(
                      points: _routePoints,
                      strokeWidth: 7.5,
                      color:
                          colorFromHex(_selectedRoute!.color).withOpacity(0.35),
                    ),
                    Polyline(
                      points: _routePoints,
                      strokeWidth: 4.0,
                      color: colorFromHex(_selectedRoute!.color),
                    ),
                  ],
                ],
              ),
              MarkerLayer(markers: [
                if (_locationEnabled)
                  Marker(
                    point: _currentLocation,
                    width: 32,
                    height: 32,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.blue,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.3),
                            blurRadius: 4,
                            offset: const Offset(0, 1),
                          ),
                        ],
                      ),
                      child: const Icon(Icons.my_location,
                          color: Colors.white, size: 16),
                    ),
                  ),
                ..._routeMarkers,
              ]),
            ],
          ),
          Positioned(
            bottom: 100,
            right: 16,
            child: FloatingActionButton(
              onPressed: _isLoadingLocation ? null : _getCurrentLocation,
              backgroundColor: Colors.white,
              mini: true,
              child: _isLoadingLocation
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.my_location, color: Colors.blue, size: 20),
            ),
          ),
          Positioned(
            bottom: 30,
            left: 16,
            right: 16,
            child: Card(
              elevation: 6,
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (_selectedRoute != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: Row(
                          children: [
                            Container(
                              width: 20,
                              height: 20,
                              decoration: BoxDecoration(
                                color: colorFromHex(_selectedRoute!.color),
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _selectedRoute!.name,
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold, fontSize: 14),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${_routeMarkers.length} stops',
                              style:
                                  const TextStyle(fontSize: 11, color: Colors.black54),
                            ),
                            IconButton(
                              icon: const Icon(Icons.close, size: 20),
                              onPressed: _clearRoute,
                            ),
                          ],
                        ),
                      ),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _planFromMyLocation,
                            icon: const Icon(Icons.near_me, size: 18),
                            label: const Text('From My Location',
                                style: TextStyle(fontSize: 13)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blue.shade700,
                              foregroundColor: Colors.white,
                              minimumSize: const Size(0, 44),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _showRoutePlanner,
                            icon: const Icon(Icons.route, size: 18),
                            label: const Text('All Routes',
                                style: TextStyle(fontSize: 13)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.grey.shade200,
                              foregroundColor: Colors.black87,
                              minimumSize: const Size(0, 44),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (_updateAvailable)
            Positioned(
              top: 16,
              left: 16,
              right: 16,
              child: Card(
                color: Colors.green.shade700,
                child: InkWell(
                  onTap: _downloadUpdate,
                  child: Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: Row(
                      children: [
                        const Icon(Icons.system_update, color: Colors.white),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _updateStatus.isEmpty
                                ? '$_currentVersion → $_newVersion available — tap to install'
                                : _updateStatus,
                            style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 13),
                          ),
                        ),
                        const Icon(Icons.download, color: Colors.white),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Lists routes ordered by distance from the user's location.
class RouteFinderSheet extends StatefulWidget {
  final double lat;
  final double lng;
  final void Function(TransitRoute route, TransitStop nearestStop) onSelect;

  const RouteFinderSheet({
    super.key,
    required this.lat,
    required this.lng,
    required this.onSelect,
  });

  @override
  State<RouteFinderSheet> createState() => _RouteFinderSheetState();
}

class _RouteFinderSheetState extends State<RouteFinderSheet> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final suggestions =
        <({TransitRoute route, TransitStop stop, double dist})>[];
    for (final route in transitRoutes) {
      TransitStop? best;
      double bestD = double.infinity;
      for (final sid in route.stops) {
        final s = findStop(sid);
        if (s == null) continue;
        final d = _haversineM(
            LatLng(widget.lat, widget.lng), LatLng(s.lat, s.lng));
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }
      if (best != null) {
        suggestions.add((route: route, stop: best, dist: bestD));
      }
    }
    suggestions.sort((a, b) => a.dist.compareTo(b.dist));

    final q = _query.toLowerCase();
    final visible = q.isEmpty
        ? suggestions
        : suggestions
            .where((s) =>
                s.route.name.toLowerCase().contains(q) ||
                s.route.code.toLowerCase().contains(q) ||
                s.route
                    .stops
                    .any((id) => (findStop(id)?.name ?? '').toLowerCase().contains(q)))
            .toList();

    return Container(
      height: MediaQuery.of(context).size.height * 0.78,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Row(
            children: [
              const SizedBox(width: 16),
              const Icon(Icons.near_me, color: Colors.blue),
              const SizedBox(width: 8),
              const Text('Routes near you',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search route or stop...',
                prefixIcon: const Icon(Icons.search),
                isDense: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onChanged: (v) => setState(() => _query = v),
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: ListView.builder(
              itemCount: visible.length,
              itemBuilder: (context, i) {
                final s = visible[i];
                final color = colorFromHex(s.route.color);
                return ListTile(
                  leading: Container(
                    width: 30,
                    height: 30,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      s.route.code.split(' ').first,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold),
                    ),
                  ),
                  title: Text(s.route.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontSize: 14, fontWeight: FontWeight.w600)),
                  subtitle: Text(
                    'Nearest stop: ${s.stop.name} · ${(s.dist / 1000).toStringAsFixed(1)} km away',
                    style: const TextStyle(fontSize: 12),
                  ),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => widget.onSelect(s.route, s.stop),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}



/// Browse + search every route, expandable stop list, show on map.
class RouteListSheet extends StatefulWidget {
  final void Function(TransitRoute route, {TransitStop? focusStop}) onSelect;

  const RouteListSheet({super.key, required this.onSelect});

  @override
  State<RouteListSheet> createState() => _RouteListSheetState();
}

class _RouteListSheetState extends State<RouteListSheet> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final q = _query.toLowerCase();
    final visible = transitRoutes
        .where((r) =>
            q.isEmpty ||
            r.name.toLowerCase().contains(q) ||
            r.code.toLowerCase().contains(q) ||
            r.stops
                .any((id) => (findStop(id)?.name ?? '').toLowerCase().contains(q)))
        .toList();

    return Container(
      height: MediaQuery.of(context).size.height * 0.78,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Row(
            children: [
              const SizedBox(width: 16),
              const Icon(Icons.route, color: Colors.blue),
              const SizedBox(width: 8),
              const Text('All Transit Routes',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search route or stop...',
                prefixIcon: const Icon(Icons.search),
                isDense: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onChanged: (v) => setState(() => _query = v),
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: ListView.builder(
              itemCount: visible.length,
              itemBuilder: (context, index) {
                final route = visible[index];
                final routeColor = colorFromHex(route.color);
                return ExpansionTile(
                  leading: Container(
                    width: 30,
                    height: 30,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: routeColor,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      route.code.split(' ').first,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold),
                    ),
                  ),
                  title: Text(route.name,
                      style: const TextStyle(
                          fontSize: 14, fontWeight: FontWeight.w600)),
                  subtitle: Text('${route.stops.length} stops',
                      style: const TextStyle(fontSize: 12)),
                  childrenPadding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: ElevatedButton.icon(
                        onPressed: () {
                          final first = findStop(route.stops.first);
                          Navigator.pop(context);
                          widget.onSelect(route, focusStop: first);
                        },
                        icon: const Icon(Icons.visibility, size: 16),
                        label: const Text('Show route on map'),
                      ),
                    ),
                    ...route.stops.map((sid) {
                      final s = findStop(sid);
                      if (s == null) return const SizedBox.shrink();
                      return ListTile(
                        dense: true,
                        leading: Icon(Icons.circle, size: 10, color: routeColor),
                        title: Text(s.name, style: const TextStyle(fontSize: 13)),
                      );
                    }),
                    const SizedBox(height: 8),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

