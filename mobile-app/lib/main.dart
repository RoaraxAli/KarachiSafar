import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:in_app_update/in_app_update.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'dart:io';
import 'dart:convert';
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
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue.shade700),
        useMaterial3: true,
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
      _currentVersion = packageInfo.version;
      final response = await http.get(Uri.parse('https://karachi-safar.vercel.app/version.json'));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['version'] != _currentVersion) {
          setState(() {
            _updateAvailable = true;
            // Try to pick architecture-appropriate APK
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
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _isLoadingLocation = false;
          _locationEnabled = false;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please enable location services')),
          );
        }
        return;
      }
      
      try {
        Position position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
          timeLimit: const Duration(seconds: 10),
        );
        setState(() {
          _currentLocation = LatLng(position.latitude, position.longitude);
          _locationEnabled = true;
          _isLoadingLocation = false;
        });
        _mapController.move(_currentLocation, 15.0);
      } catch (e) {
        setState(() {
          _isLoadingLocation = false;
          _locationEnabled = false;
        });
      }
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
      appBar: AppBar(
        title: const Text('Karachi Safar'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.web),
            onPressed: _openWebApp,
            tooltip: 'Open Web App',
          ),
        ],
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _currentLocation,
              initialZoom: 12.0,
              minZoom: 10.0,
              maxZoom: 18.0,
            ),
            children: [
              TileLayer(
                urlTemplate:
                    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
                userAgentPackageName: 'com.karachisafar.app',
                maxZoom: 19,
                tileProvider: NetworkTileProvider(),
              ),
              MarkerLayer(
                markers: [
                  if (_locationEnabled)
                    Marker(
                      point: _currentLocation,
                      width: 40,
                      height: 40,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.blue,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 3),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.3),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.my_location,
                          color: Colors.white,
                          size: 20,
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
              child: _isLoadingLocation
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.my_location, color: Colors.blue),
            ),
          ),
          Positioned(
            bottom: 30,
            left: 16,
            right: 16,
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Karachi Safar',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Navigate Karachi by public transit',
                      style: TextStyle(color: Colors.grey),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'v$_currentVersion',
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                    const SizedBox(height: 8),
                    if (_updateAvailable)
                      ElevatedButton.icon(
                        onPressed: _downloadUpdate,
                        icon: const Icon(Icons.system_update),
                        label: const Text('Update Available - Download from Site'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green.shade700,
                          foregroundColor: Colors.white,
                        ),
                      )
                    else
                      ElevatedButton.icon(
                        onPressed: _openWebApp,
                        icon: const Icon(Icons.directions_bus),
                        label: const Text('Plan Route'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue.shade700,
                          foregroundColor: Colors.white,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
