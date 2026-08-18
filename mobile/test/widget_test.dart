import 'package:flutter_test/flutter_test.dart';

import 'package:givy/main.dart';

void main() {
  test('production URL is https www.givy.gifts', () {
    expect(kGivyUrl, 'https://www.givy.gifts');
    expect(Uri.parse(kGivyUrl).isScheme('https'), isTrue);
  });
}
