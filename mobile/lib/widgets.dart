import 'package:flutter/material.dart';

import 'theme.dart';

class GivyScaffold extends StatelessWidget {
  const GivyScaffold({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFF7FCF8),
            GivyColors.mist,
            Color(0xFFDFECE4),
          ],
        ),
      ),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 980),
          child: child,
        ),
      ),
    );
  }
}

class GivyPanel extends StatelessWidget {
  const GivyPanel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
  });

  final Widget child;
  final EdgeInsets padding;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final content = Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.72),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: GivyColors.line),
        boxShadow: [
          BoxShadow(
            color: GivyColors.ink.withValues(alpha: 0.08),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: child,
    );
    if (onTap == null) return content;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: content,
    );
  }
}

class LogoMark extends StatelessWidget {
  const LogoMark({super.key, this.size = 36});

  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(painter: _LogoPainter()),
    );
  }
}

class _LogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / 64;
    final coral = Paint()..color = GivyColors.coral;
    final coralDeep = Paint()..color = GivyColors.coralDeep;
    final cream = Paint()..color = const Color(0xFFFFF7F4);
    final leaf = Paint()..color = GivyColors.leaf;
    final leafDeep = Paint()..color = const Color(0xFF1F5C3E);
    final gold = Paint()..color = GivyColors.amber;

    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(8 * s, 28 * s, 48 * s, 28 * s),
        Radius.circular(10 * s),
      ),
      coral,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(6 * s, 24 * s, 52 * s, 11 * s),
        Radius.circular(5.5 * s),
      ),
      coralDeep,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(29 * s, 24 * s, 6 * s, 32 * s),
        Radius.circular(2 * s),
      ),
      cream,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(8 * s, 38 * s, 48 * s, 6 * s),
        Radius.circular(2 * s),
      ),
      cream,
    );

    canvas.save();
    canvas.translate(21 * s, 15.5 * s);
    canvas.rotate(-0.38);
    canvas.drawOval(Rect.fromCenter(center: Offset.zero, width: 24 * s, height: 15 * s), leaf);
    canvas.restore();

    canvas.save();
    canvas.translate(43 * s, 15.5 * s);
    canvas.rotate(0.38);
    canvas.drawOval(Rect.fromCenter(center: Offset.zero, width: 24 * s, height: 15 * s), leaf);
    canvas.restore();

    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(26.5 * s, 13 * s, 11 * s, 13 * s),
        Radius.circular(4 * s),
      ),
      leafDeep,
    );
    canvas.drawCircle(Offset(32 * s, 19.5 * s), 2.8 * s, gold);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class GivyLogo extends StatelessWidget {
  const GivyLogo({super.key, this.size = 36, this.fontSize = 24});

  final double size;
  final double fontSize;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        LogoMark(size: size),
        const SizedBox(width: 10),
        Text.rich(
          TextSpan(
            children: [
              TextSpan(text: 'Givy', style: givyDisplay(size: fontSize)),
              TextSpan(
                text: '.',
                style: givyDisplay(size: fontSize, color: GivyColors.coral),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class CountdownChip extends StatelessWidget {
  const CountdownChip({super.key, required this.eventDate});

  final String eventDate;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: GivyColors.line),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: const BoxDecoration(
              color: GivyColors.coral,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            countdownLabelFromDate(eventDate),
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 13,
              color: GivyColors.inkSoft,
            ),
          ),
        ],
      ),
    );
  }
}

String countdownLabelFromDate(String eventDate) {
  final days = DateTime.parse('${eventDate}T12:00:00')
      .difference(DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day))
      .inDays;
  if (days > 1) return '$days days to go';
  if (days == 1) return 'Tomorrow';
  if (days == 0) return 'Today';
  return '${days.abs()} days ago';
}

class GiftEmoji extends StatelessWidget {
  const GiftEmoji({super.key, this.hint});

  final String? hint;

  @override
  Widget build(BuildContext context) {
    const map = {
      'hat': '🧢',
      'socks': '🧦',
      'snacks': '🍿',
      'watch': '⌚',
      'card': '🎁',
    };
    return Container(
      width: 48,
      height: 48,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: GivyColors.mistDeep,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(map[hint] ?? '✨', style: const TextStyle(fontSize: 22)),
    );
  }
}
