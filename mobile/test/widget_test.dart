import 'package:flutter_test/flutter_test.dart';
import 'package:givy/main.dart';
import 'package:webview_flutter/webview_flutter.dart';

void main() {
  test('production URL is https www.givy.gifts', () {
    expect(kGivyUrl, 'https://www.givy.gifts');
    expect(Uri.parse(kGivyUrl).isScheme('https'), isTrue);
  });

  test('only main-frame WebView errors are surfaced to Play users', () {
    expect(
      shouldSurfaceWebResourceError(
        const WebResourceError(
          errorCode: -2,
          description: 'net::ERR_FAILED',
          isForMainFrame: true,
        ),
      ),
      isTrue,
    );
    expect(
      shouldSurfaceWebResourceError(
        const WebResourceError(
          errorCode: -2,
          description: 'net::ERR_NAME_NOT_RESOLVED',
          isForMainFrame: false,
        ),
      ),
      isFalse,
    );
    // Unknown frame — do not tear down a loaded experience for subresources.
    expect(
      shouldSurfaceWebResourceError(
        const WebResourceError(
          errorCode: -1,
          description: 'Unknown',
        ),
      ),
      isFalse,
    );
  });
}
