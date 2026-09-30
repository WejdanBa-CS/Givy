import 'dart:convert';
import 'dart:io';

import 'package:package_info_plus/package_info_plus.dart';

const String kPlayStoreUrl =
    'https://play.google.com/store/apps/details?id=com.givy.givy';

class ForceUpdatePolicy {
  const ForceUpdatePolicy({
    required this.required,
    required this.storeUrl,
    required this.message,
  });

  final bool required;
  final String storeUrl;
  final String message;

  static const none = ForceUpdatePolicy(
    required: false,
    storeUrl: kPlayStoreUrl,
    message: '',
  );
}

/// Fetches `/play-min-version.json` from the live site.
/// On network failure, allow the app to open (do not brick offline users).
Future<ForceUpdatePolicy> checkForceUpdate(String siteOrigin) async {
  try {
    final info = await PackageInfo.fromPlatform();
    final build = int.tryParse(info.buildNumber) ?? 0;
    final uri = Uri.parse(siteOrigin).replace(path: '/play-min-version.json');
    final client = HttpClient()..connectionTimeout = const Duration(seconds: 6);
    try {
      final req = await client.getUrl(uri);
      req.headers.set(HttpHeaders.acceptHeader, 'application/json');
      final res = await req.close().timeout(const Duration(seconds: 8));
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return ForceUpdatePolicy.none;
      }
      final body = await res.transform(utf8.decoder).join();
      final json = jsonDecode(body) as Map<String, dynamic>;
      final minCode = (json['minVersionCode'] as num?)?.toInt() ?? 0;
      final storeUrl =
          (json['storeUrl'] as String?)?.trim().isNotEmpty == true
              ? json['storeUrl'] as String
              : kPlayStoreUrl;
      final message =
          (json['message'] as String?)?.trim().isNotEmpty == true
              ? json['message'] as String
              : 'Please update Givy to continue.';
      if (minCode > 0 && build < minCode) {
        return ForceUpdatePolicy(
          required: true,
          storeUrl: storeUrl,
          message: message,
        );
      }
    } finally {
      client.close(force: true);
    }
  } catch (_) {
    /* allow open if the check fails */
  }
  return ForceUpdatePolicy.none;
}
