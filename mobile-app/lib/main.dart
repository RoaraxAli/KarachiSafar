import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
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
  bool _updateAvailable = false;
  String _updateUrl = '';
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _checkLocationPermission();
    _checkForUpdate();
    _checkForAppUpdate();
  }

  Future<void> _checkForAppUpdate() async {
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      setState(() {
        _currentVersion = packageInfo.version;
      });
      final response = await http.get(Uri.parse('https://karachi-safar.vercel.app/version.json?t=${DateTime.now().millisecondsSinceEpoch}'));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['version'] != null && data['version'] != _currentVersion) {
          setState(() {
            _updateAvailable = true;
            _updateUrl = data['apkUrl'] ?? 'https://karachi-safar.vercel.app/apk/karachi-safar-arm64-v8a.apk';
          });
        }
      }
    } catch (e) {
      // ignore
    }
  }

  Future<void> _downloadUpdate() async {
    if (_updateUrl.isEmpty) return;
    setState(() => _updateStatus = 'Downloading update...');
    try {
      final dir = await getExternalStorageDirectory() ?? await getApplicationDocumentsDirectory();
      final filePath = '${dir.path}/karachi_safar_update.apk';
      final dio = Dio();
      await dio.download(_updateUrl, filePath);
      setState(() => _updateStatus = 'Opening installer...');
      await OpenFilex.open(filePath);
    } catch (e) {
      setState(() => _updateStatus = 'Download failed, opening browser...');
      final Uri url = Uri.parse(_updateUrl);
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _checkForUpdate() async {
    try {
      InAppUpdate.checkForUpdate().then((info) {
        if (info.updateAvailability == UpdateAvailability.updateAvailable) {
          if (info.immediateUpdateAllowed) {
            InAppUpdate.performImmediateUpdate().catchError((e) {
              setState(() => _updateStatus = 'Update failed');
            });
          } else if (info.flexibleUpdateAllowed) {
            InAppUpdate.startFlexibleUpdate().then((_) {
              InAppUpdate.completeFlexibleUpdate();
            }).catchError((e) {
              setState(() => _updateStatus = 'Update failed');
            });
          }
        }
      }).catchError((e) {
        // Silent fail - no Play Store in sideload
      });
    } catch (e) {
      // Ignore update errors
    }
  }

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
            content: Text('Location permission permanently denied. Please enable in settings.'),
            action: SnackBarAction(label: 'Settings', onPressed: openAppSettings),
          ),
        );
      }
      return;
    }
    
    if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
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
      Position position = await Geolocator.getCurrentPosition(
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

  Future<void> _openWebApp() async {
    final Uri url = Uri.parse('https://karachi-safar.vercel.app');
    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
      throw Exception('Could not launch $url');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        title: const Text('Karachi Safar'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
        ),
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
              decoration: BoxDecoration(
                color: Colors.blue.shade700,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  const Icon(Icons.directions_bus, color: Colors.white, size: 48),
                  const SizedBox(height: 8),
                  const Text(
                    'Karachi Safar',
                    style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    'v$_currentVersion',
                    style: const TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.map),
              title: const Text('Map'),
              onTap: () {
                Navigator.pop(context);
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
            ListTile(
              leading: const Icon(Icons.route),
              title: const Text('Plan Route'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Route planning coming soon')),
                );
              },
            ),
            const Divider(),
            if (_updateAvailable)
              ListTile(
                leading: const Icon(Icons.system_update, color: Colors.green),
                title: const Text('Update Available', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                subtitle: Text(_updateStatus.isEmpty ? 'Tap to download & install' : _updateStatus),
                onTap: () {
                  Navigator.pop(context);
                  _downloadUpdate();
                },
              )
            else
              ListTile(
                leading: const Icon(Icons.system_update_alt),
                title: const Text('Check for Updates'),
                subtitle: Text(_updateStatus.isEmpty ? 'Up to date' : _updateStatus),
                onTap: () {
                  Navigator.pop(context);
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
                urlTemplate: 'https://a.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.karachisafar.app',
                maxZoom: 19,
                tileProvider: NetworkTileProvider(),
              ),
              MarkerLayer(
                markers: [
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
                        child: const Icon(
                          Icons.my_location,
                          color: Colors.white,
                          size: 16,
                        ),
                      ),
                    ),
                ],
              ),
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
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.route),
                  label: const Text('Plan Route'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue.shade700,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 48),
                  ),
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
                            _updateStatus.isEmpty ? 'Update Available - Tap to install' : _updateStatus,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
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
