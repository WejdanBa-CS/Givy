import 'dart:async';
import 'dart:convert';

import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// Live Givy website — this Play app is a native shell around production.
/// Override for local testing, e.g. `--dart-define=GIVY_URL=http://10.0.2.2:3000`
const String kGivyUrl = String.fromEnvironment(
  'GIVY_URL',
  defaultValue: 'https://givy.onrender.com',
);

/// Must match Supabase Redirect URL: com.givy.givy://auth/callback
const String kOAuthScheme = 'com.givy.givy';

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
  runApp(const GivyPlayApp());
}

class GivyPlayApp extends StatelessWidget {
  const GivyPlayApp({super.key});

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
      home: const GivyWebShell(),
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
  var _loading = true;
  var _progress = 0;
  var _oauthBusy = false;
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
    return h == 'givy.onrender.com' ||
        h == 'www.givy.onrender.com' ||
        h == 'givy.app' ||
        h == 'www.givy.app' ||
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
    _controller.loadRequest(uri);
  }

  /// Finish PKCE in the WebView (cookies live there, not in Chrome).
  void _finishOAuthWithCode(String code, String next) {
    final callback = Uri.https('givy.onrender.com', '/auth/callback', {
      'code': code,
      'next': next,
    });
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

  Future<void> _runOAuthSession(String authorizeUrl, String next) async {
    if (_oauthBusy) return;
    _oauthBusy = true;
    try {
      final result = await FlutterWebAuth2.authenticate(
        url: authorizeUrl,
        callbackUrlScheme: kOAuthScheme,
      );
      final returned = Uri.parse(result);
      final code = returned.queryParameters['code'];
      if (code == null || code.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Google sign-in did not return a code. Try email.'),
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
              'Sign-in failed. Add com.givy.givy://auth/callback in Supabase, '
              'or use email. (${e.message ?? e.code})',
            ),
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Sign-in failed. Try email/password instead.'),
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
      if (raw.startsWith('{')) {
        final map = jsonDecode(raw) as Map<String, dynamic>;
        authorizeUrl = map['url'] as String? ?? '';
        next = map['next'] as String? ?? '/app';
      } else {
        authorizeUrl = raw;
      }
      final uri = Uri.tryParse(authorizeUrl);
      if (uri == null ||
          (uri.scheme != 'https' && uri.scheme != 'http') ||
          authorizeUrl.isEmpty) {
        return;
      }
      unawaited(_runOAuthSession(authorizeUrl, next));
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
    try {
      final defaultUa = await _controller.getUserAgent() ?? '';
      await _controller.setUserAgent('$defaultUa GivyPlayApp/1.0.0');
    } catch (_) {
      await _controller.setUserAgent('GivyPlayApp/1.0.0');
    }

    final start = Uri.tryParse(widget.initialUrl);
    if (start != null && _isAllowedInApp(start)) {
      await _controller.loadRequest(start);
    } else {
      await _controller.loadRequest(Uri.parse('https://givy.onrender.com'));
    }
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
          onProgress: (p) => setState(() => _progress = p),
          onPageStarted: (_) => setState(() {
            _loading = true;
            _error = null;
          }),
          onPageFinished: (_) => setState(() => _loading = false),
          onWebResourceError: (e) => setState(() {
            _loading = false;
            _error = e.description;
          }),
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
                child: _error != null
                    ? _ErrorPane(
                        message: _error!,
                        onRetry: () {
                          setState(() => _error = null);
                          _controller.reload();
                        },
                      )
                    : WebViewWidget(controller: _controller),
              ),
            ],
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
