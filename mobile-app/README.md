# Karachi Safar - Android App

Flutter Android app for the Karachi Safar transit project.

## Features
- Interactive Karachi transit map (English, CartoDB tiles)
- Asks for location permission on launch and shows your current location
- "Plan Route" opens the full web app (https://karachi-safar.vercel.app)
- Auto-update support (Google Play in-app updates via `in_app_update`)

## Build
```
flutter pub get
flutter build apk --release --split-per-abi
```

Output APKs are in `build/app/outputs/flutter-apk/`.

## Permissions
- INTERNET
- ACCESS_FINE_LOCATION / ACCESS_COARSE_LOCATION
- REQUEST_INSTALL_PACKAGES
