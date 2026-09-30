import 'dart:async';
import 'dart:convert';

import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import 'force_update.dart';

/// Live Givy website — this Play app is a native shell around production.
/// Override for local testing, e.g. `--dart-define=GIVY_URL=http://10.0.2.2:3000`
const String kGivyUrl = String.fromEnvironment(
  'GIVY_URL',
  defaultValue: 'https://www.givy.gifts',
);

/// Must match Supabase Redirect URL: com.givy.givy://auth/callback
const String kOAuthScheme = 'com.givy.givy';

/// How long to wait for the first successful main-document load before showing
/// a retry pane (Play reviewers treat an infinite spinner as "does not load").
const Duration kInitialLoadTimeout = Duration(seconds: 25);

/// Whether a WebView resource error should replace the in-app experience.
///
/// `onWebResourceError` also fires for failed images/scripts/iframes. Treating
/// those as fatal caused Play review to see "Could not load Givy" even when the
/// main document had loaded (Broken Functionality / does not open or load).
@visibleForTesting
bool shouldSurfaceWebResourceError(WebResourceError error) {
  return error.isForMainFrame == true;
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );
  final forceUpdate = await checkForceUpdate(kGivyUrl);
  runApp(GivyPlayApp(forceUpdate: forceUpdate));
}

class GivyPlayApp extends StatelessWidget {
  const GivyPlayApp({super.key, this.forceUpdate = ForceUpdatePolicy.none});

  final ForceUpdatePolicy forceUpdate;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Givy',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFE8391E),
          surface: const Color(0xFFFEF6EE),
        ),
        useMaterial3: true,
      ),
      home: forceUpdate.required
          ? _ForceUpdateScreen(policy: forceUpdate)
          : const GivyWebShell(),
    );
  }
}

class GivyWebShell extends StatefulWidget {
  const GivyWebShell({super.key, this.initialUrl = kGivyUrl});

  final String initialUrl;

  @override
  State<GivyWebShell> createState() => _GivyWebShellState();
}

class _GivyWebShellState extends State<GivyWebShell> {
  late final WebViewController _controller;
  final _appLinks = AppLinks();
  StreamSubscription<Uri>? _linkSub;
  Timer? _loadTimeout;
  var _loading = true;
  var _progress = 0;
  var _oauthBusy = false;
  var _mainDocumentLoaded = false;
  String? _error;

  static bool _isOAuthHost(String host) {
    final h = host.toLowerCase();
    return h == 'accounts.google.com' ||
        (h.endsWith('.google.com') && h.contains('account')) ||
        h.contains('facebook.com') ||
        h.contains('fb.com') ||
        h.contains('appleid.apple.com') ||
        h.endsWith('.supabase.co') ||
        h == 'supabase.co';
  }

  static bool _isLocalDevHost(String host) {
    final h = host.toLowerCase();
    return h == 'localhost' || h == '10.0.2.2' || h == '127.0.0.1';
  }

  static bool _isGivyHost(String host) {
    final h = host.toLowerCase();
    return h == 'www.givy.gifts' ||
        h == 'givy.gifts' ||
        h == 'givy.onrender.com' ||
        h == 'www.givy.onrender.com' ||
        _isLocalDevHost(h);
  }

  bool _isAllowedInApp(Uri uri) {
    if (_isLocalDevHost(uri.host)) {
      return uri.scheme == 'http' || uri.scheme == 'https';
    }
    return uri.scheme == 'https' && _isGivyHost(uri.host);
  }

  Future<void> _openExternal(Uri uri) async {
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not open ${uri.host}')),
      );
    }
  }

  void _loadGivy(Uri uri) {
    if (!_isAllowedInApp(uri)) return;
    _beginLoadWatch();
    _controller.loadRequest(uri);
  }

  void _beginLoadWatch() {
    _loadTimeout?.cancel();
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
      _progress = 0;
      _mainDocumentLoaded = false;
    });
    _loadTimeout = Timer(kInitialLoadTimeout, () {
      if (!mounted || _mainDocumentLoaded || _error != null) return;
      setState(() {
        _loading = false;
        _error =
            'Givy is taking too long to respond. Check your connection and try again.';
      });
    });
  }

  void _markMainDocumentLoaded() {
    _loadTimeout?.cancel();
    if (!mounted) return;
    setState(() {
      _loading = false;
      _error = null;
      _mainDocumentLoaded = true;
    });
  }

  void _surfaceMainFrameFailure(String message) {
    _loadTimeout?.cancel();
    if (!mounted) return;
    // Keep a working page visible if the main document already rendered;
    // only block the shell when the first paint never succeeded.
    if (_mainDocumentLoaded) return;
    setState(() {
      _loading = false;
      _error = message;
    });
  }

  /// Finish PKCE in the WebView (cookies live there, not in Chrome).
  void _finishOAuthWithCode(String code, String next) {
    final base = Uri.parse(kGivyUrl);
    final callback = Uri(
      scheme: base.scheme,
      host: base.host,
      path: '/auth/callback',
      queryParameters: {
        'code': code,
        'next': next,
      },
    );
    _beginLoadWatch();
    _controller.loadRequest(callback);
  }

  void _handleIncomingLink(Uri uri) {
    if (uri.scheme == kOAuthScheme) {
      final code = uri.queryParameters['code'];
      final next = uri.queryParameters['next'] ?? '/app';
      if (code != null && code.isNotEmpty) {
        _finishOAuthWithCode(code, next);
      }
      return;
    }
    _loadGivy(uri);
  }

  Future<void> _runOAuthSession(
    String authorizeUrl,
    String next, {
    String provider = 'google',
  }) async {
    if (_oauthBusy) return;
    _oauthBusy = true;
    final label = provider == 'facebook'
        ? 'Facebook'
        : provider == 'apple'
            ? 'Apple'
            : 'Google';
    try {
      // Ephemeral + Chrome-first keeps Facebook inside Custom Tabs instead of
      // handing off to the Facebook app (which never returns to Givy).
      final result = await FlutterWebAuth2.authenticate(
        url: authorizeUrl,
        callbackUrlScheme: kOAuthScheme,
        options: const FlutterWebAuth2Options(
          preferEphemeral: true,
          customTabsPackageOrder: [
            'com.android.chrome',
            'com.chrome.beta',
            'com.chrome.dev',
            'com.chrome.canary',
          ],
        ),
      );
      final returned = Uri.parse(result);
      final code = returned.queryParameters['code'];
      if (code == null || code.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                '$label sign-in did not return a code. Try email.',
              ),
            ),
          );
        }
        return;
      }
      _finishOAuthWithCode(code, next);
    } on PlatformException catch (e) {
      if (e.code == 'CANCELED') return;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '$label sign-in failed. Try email/password instead. '
              '(${e.message ?? e.code})',
            ),
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$label sign-in failed. Try email/password instead.'),
          ),
        );
      }
    } finally {
      _oauthBusy = false;
    }
  }

  void _onOAuthBridgeMessage(JavaScriptMessage message) {
    try {
      final raw = message.message.trim();
      String authorizeUrl;
      var next = '/app';
      var provider = 'google';
      if (raw.startsWith('{')) {
        final map = jsonDecode(raw) as Map<String, dynamic>;
        authorizeUrl = map['url'] as String? ?? '';
        next = map['next'] as String? ?? '/app';
        provider = map['provider'] as String? ?? 'google';
      } else {
        authorizeUrl = raw;
      }
      final uri = Uri.tryParse(authorizeUrl);
      if (uri == null ||
          (uri.scheme != 'https' && uri.scheme != 'http') ||
          authorizeUrl.isEmpty) {
        return;
      }
      unawaited(_runOAuthSession(authorizeUrl, next, provider: provider));
    } catch (_) {
      /* ignore malformed bridge payloads */
    }
  }

  Future<void> _initDeepLinks() async {
    try {
      final initial = await _appLinks.getInitialLink();
      if (initial != null) {
        _handleIncomingLink(initial);
      }
    } catch (_) {
      /* ignore cold-start link errors */
    }
    _linkSub = _appLinks.uriLinkStream.listen(
      _handleIncomingLink,
      onError: (_) {},
    );
  }

  Future<void> _applyPlayUserAgentAndLoad() async {
    final package = await PackageInfo.fromPlatform();
    final playToken = 'GivyPlayApp/${package.version}';
    try {
      final defaultUa = await _controller.getUserAgent() ?? '';
      await _controller.setUserAgent('$defaultUa $playToken');
    } catch (_) {
      await _controller.setUserAgent(playToken);
    }

    final start = Uri.tryParse(widget.initialUrl);
    _beginLoadWatch();
    if (start != null && _isAllowedInApp(start)) {
      await _controller.loadRequest(start);
    } else {
      await _controller.loadRequest(Uri.parse(kGivyUrl));
    }
  }

  void _retryLoad() {
    setState(() => _error = null);
    unawaited(_applyPlayUserAgentAndLoad());
  }

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFFEF6EE))
      ..addJavaScriptChannel(
        'GivyOAuth',
        onMessageReceived: _onOAuthBridgeMessage,
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (p) {
            if (!mounted) return;
            setState(() => _progress = p);
          },
          onPageStarted: (_) {
            if (!mounted) return;
            setState(() {
              _loading = true;
              // Do not clear a prior fatal error until the main document finishes;
              // avoids flashing the broken WebView during a doomed reload.
              if (_mainDocumentLoaded) {
                _error = null;
              }
            });
          },
          onPageFinished: (_) => _markMainDocumentLoaded(),
          onHttpError: (error) {
            // Fires for every resource (images, scripts, etc.). Only treat
            // same-origin document-like 5xx responses as a shell failure.
            final code = error.response?.statusCode;
            if (code == null || code < 500) return;
            final uri = error.request?.uri;
            if (uri == null || !_isAllowedInApp(uri)) return;
            final leaf =
                uri.pathSegments.isEmpty ? '' : uri.pathSegments.last;
            if (leaf.contains('.')) return;
            _surfaceMainFrameFailure(
              'Givy returned HTTP $code. Please try again in a moment.',
            );
          },
          onWebResourceError: (e) {
            if (!shouldSurfaceWebResourceError(e)) return;
            _surfaceMainFrameFailure(
              e.description.isNotEmpty
                  ? e.description
                  : 'Could not reach www.givy.gifts.',
            );
          },
          onNavigationRequest: (request) {
            final uri = Uri.tryParse(request.url);
            if (uri == null) return NavigationDecision.prevent;

            // OAuth must be started via GivyOAuth bridge (flutter_web_auth_2).
            // Block accidental top-level navigations so we never dump users into Chrome.
            if (_isOAuthHost(uri.host) && !_isGivyHost(uri.host)) {
              return NavigationDecision.prevent;
            }

            if (_isAllowedInApp(uri)) {
              return NavigationDecision.navigate;
            }

            if (uri.scheme == 'http' || uri.scheme == 'https') {
              _openExternal(uri);
            }
            return NavigationDecision.prevent;
          },
        ),
      );

    unawaited(_applyPlayUserAgentAndLoad());
    unawaited(_initDeepLinks());
  }

  @override
  void dispose() {
    _loadTimeout?.cancel();
    _linkSub?.cancel();
    super.dispose();
  }

  Future<bool> _onWillPop() async {
    if (await _controller.canGoBack()) {
      await _controller.goBack();
      return false;
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final shouldPop = await _onWillPop();
        if (shouldPop && context.mounted) {
          SystemNavigator.pop();
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFFEF6EE),
        body: SafeArea(
          top: false,
          left: false,
          right: false,
          child: Column(
            children: [
              if (_loading || _progress < 100)
                LinearProgressIndicator(
                  value: _progress >= 100 ? null : _progress / 100,
                  minHeight: 2,
                  color: const Color(0xFFE8391E),
                  backgroundColor: const Color(0xFFE8391E).withValues(alpha: 0.12),
                ),
              Expanded(
                // Keep the WebView mounted under the error overlay so a
                // recovered / already-loaded document is not torn down.
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    WebViewWidget(controller: _controller),
                    if (_error != null)
                      ColoredBox(
                        color: const Color(0xFFFEF6EE),
                        child: _ErrorPane(
                          message: _error!,
                          onRetry: _retryLoad,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ForceUpdateScreen extends StatelessWidget {
  const _ForceUpdateScreen({required this.policy});

  final ForceUpdatePolicy policy;

  Future<void> _openStore() async {
    final uri = Uri.parse(policy.storeUrl);
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFEF6EE),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.system_update_alt_rounded,
                  size: 56,
                  color: Color(0xFFE8391E),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Update required',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 12),
                Text(
                  policy.message,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    height: 1.45,
                    color: Colors.black.withValues(alpha: 0.6),
                  ),
                ),
                const SizedBox(height: 28),
                FilledButton(
                  onPressed: _openStore,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFFE8391E),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 14,
                    ),
                  ),
                  child: const Text('Update on Google Play'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ErrorPane extends StatelessWidget {
  const _ErrorPane({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off_rounded, size: 48, color: Color(0xFFE8391E)),
            const SizedBox(height: 16),
            const Text(
              'Could not load Givy',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.black.withValues(alpha: 0.55)),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: onRetry,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFE8391E),
              ),
              child: const Text('Try again'),
            ),
          ],
        ),
      ),
    );
  }
}
