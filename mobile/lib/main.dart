import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// Live Givy website — this Play app is a native shell around production.
/// Override for local testing, e.g. `--dart-define=GIVY_URL=http://10.0.2.2:3000`
const String kGivyUrl = String.fromEnvironment(
  'GIVY_URL',
  defaultValue: 'https://givy.onrender.com',
);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
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
  var _loading = true;
  var _progress = 0;
  String? _error;

  static bool _isOAuthHost(String host) {
    final h = host.toLowerCase();
    return h == 'accounts.google.com' ||
        (h.endsWith('.google.com') && h.contains('account')) ||
        h.contains('facebook.com') ||
        h.contains('fb.com') ||
        h.contains('appleid.apple.com');
  }

  static bool _isGivyHost(String host) {
    final h = host.toLowerCase();
    return h == 'givy.onrender.com' ||
        h == 'www.givy.onrender.com' ||
        h == 'localhost' ||
        h == '10.0.2.2' ||
        h == '127.0.0.1';
  }

  Future<void> _openExternal(Uri uri) async {
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not open ${uri.host}')),
      );
    }
  }

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFFEF6EE))
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
            if (uri.scheme != 'http' && uri.scheme != 'https') {
              _openExternal(uri);
              return NavigationDecision.prevent;
            }
            // Google blocks OAuth inside embedded WebViews — use the system browser.
            if (_isOAuthHost(uri.host) && !_isGivyHost(uri.host)) {
              _openExternal(uri);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.initialUrl));
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
