import 'package:flutter/material.dart';

import 'store.dart';
import 'theme.dart';

class GivyScaffold extends StatelessWidget {
  const GivyScaffold({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: GivyColors.background,
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
    this.color = GivyColors.paper,
    this.borderColor = GivyColors.border,
  });

  final Widget child;
  final EdgeInsets padding;
  final VoidCallback? onTap;
  final Color color;
  final Color borderColor;

  @override
  Widget build(BuildContext context) {
    final content = Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: borderColor, width: 2),
      ),
      child: child,
    );
    if (onTap == null) return content;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: content,
      ),
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
    final leafDeep = Paint()..color = const Color(0xFF2A4D38);
    final gold = Paint()..color = GivyColors.gold;

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
              TextSpan(text: 'givy', style: givyDisplay(size: fontSize)),
            ],
          ),
        ),
      ],
    );
  }
}

class CountdownChip extends StatelessWidget {
  const CountdownChip({super.key, required this.eventDate, this.compact = true});

  final String eventDate;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final days = daysUntil(eventDate);
    if (compact) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: GivyColors.paper,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: GivyColors.border, width: 2),
        ),
        child: Text(
          '$days',
          style: givyDisplay(size: 22, color: GivyColors.coral, weight: FontWeight.w700),
        ),
      );
    }

    return GivyPanel(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      child: Column(
        children: [
          Text(
            '$days',
            style: givyDisplay(size: 48, color: GivyColors.coral, weight: FontWeight.w700),
          ),
          Text(
            days == 1 ? 'day to go' : 'days to go',
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              color: GivyColors.inkSoft,
            ),
          ),
        ],
      ),
    );
  }
}

class PriceBadge extends StatelessWidget {
  const PriceBadge({super.key, required this.price});

  final String price;

  @override
  Widget build(BuildContext context) {
    if (price.isEmpty) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: GivyColors.gold,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: GivyColors.ink.withValues(alpha: 0.12), width: 1.5),
      ),
      child: Text(
        price,
        style: const TextStyle(
          fontWeight: FontWeight.w800,
          fontSize: 12,
          color: GivyColors.ink,
        ),
      ),
    );
  }
}

class FriendBanner extends StatelessWidget {
  const FriendBanner({super.key, required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: GivyColors.gold,
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontWeight: FontWeight.w800,
          color: GivyColors.ink,
        ),
      ),
    );
  }
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
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: GivyColors.border, width: 2),
      ),
      child: Text(map[hint] ?? '✨', style: const TextStyle(fontSize: 22)),
    );
  }
}
