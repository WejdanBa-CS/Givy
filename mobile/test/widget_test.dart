import 'package:flutter_test/flutter_test.dart';

import 'package:givy/main.dart';

void main() {
  test('production URL is https givy.onrender.com', () {
    expect(kGivyUrl, 'https://givy.onrender.com');
    expect(Uri.parse(kGivyUrl).isScheme('https'), isTrue);
  });
}
