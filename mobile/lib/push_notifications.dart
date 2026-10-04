import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';

/// Optional FCM token source for the Play WebView shell.
///
/// Real Firebase Messaging is intentionally **not** hard-wired yet (needs
/// `google-services.json` + `firebase_messaging`). Until that is added:
/// - Pass a test token: `--dart-define=GIVY_MOCK_FCM_TOKEN=...`
/// - Or enable later by implementing [fetchDeviceToken] with FCM.
///
/// The token is injected into the WebView as `window.__GIVY_FCM_TOKEN__` so the
/// signed-in site can POST `/api/push/register`.
const String kMockFcmToken = String.fromEnvironment('GIVY_MOCK_FCM_TOKEN');

class PushTokenPayload {
  const PushTokenPayload({required this.token, required this.platform});

  final String token;
  final String platform; // android | ios
}

/// Returns a device push token when available. Null = skip registration.
Future<PushTokenPayload?> fetchDeviceToken() async {
  final mock = kMockFcmToken.trim();
  if (mock.isNotEmpty) {
    final platform = !kIsWeb && Platform.isIOS ? 'ios' : 'android';
    return PushTokenPayload(token: mock, platform: platform);
  }

  // Hook for firebase_messaging later:
  // final messaging = FirebaseMessaging.instance;
  // await messaging.requestPermission();
  // final token = await messaging.getToken();
  // if (token == null || token.isEmpty) return null;
  // return PushTokenPayload(token: token, platform: Platform.isIOS ? 'ios' : 'android');

  return null;
}

/// JS snippet that exposes the token to the Givy web app.
String injectFcmTokenScript(PushTokenPayload payload) {
  final token = payload.token
      .replaceAll(r'\', r'\\')
      .replaceAll("'", r"\'")
      .replaceAll('\n', '');
  final platform = payload.platform
      .replaceAll(r'\', r'\\')
      .replaceAll("'", r"\'");
  return """
(function() {
  try {
    window.__GIVY_FCM_TOKEN__ = '$token';
    window.__GIVY_FCM_PLATFORM__ = '$platform';
    window.dispatchEvent(new CustomEvent('givy-fcm-token', {
      detail: { token: '$token', platform: '$platform' }
    }));
  } catch (e) {}
})();
""";
}
