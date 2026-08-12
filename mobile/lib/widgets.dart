import 'package:flutter/material.dart';

import 'models.dart';
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
          style: givyDisplay(size: 22, color: GivyColors.coral),
        ),
      );
    }

    return CountdownDisplay(eventDate: eventDate);
  }
}

/// Figma-style live countdown: days : hrs : min : sec
class CountdownDisplay extends StatelessWidget {
  const CountdownDisplay({super.key, required this.eventDate});

  final String eventDate;

  @override
  Widget build(BuildContext context) {
    return StreamBuilder(
      stream: Stream.periodic(const Duration(seconds: 1)),
      builder: (context, _) {
        final target = DateTime.tryParse(eventDate) ?? DateTime.now();
        var diff = target.difference(DateTime.now());
        if (diff.isNegative) diff = Duration.zero;
        final units = [
          (diff.inDays, 'days'),
          (diff.inHours % 24, 'hrs'),
          (diff.inMinutes % 60, 'min'),
          (diff.inSeconds % 60, 'sec'),
        ];
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            for (var i = 0; i < units.length; i++) ...[
              Column(
                children: [
                  Text(
                    units[i].$1.toString().padLeft(2, '0'),
                    style: givyDisplay(size: 28, color: GivyColors.coral),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    units[i].$2.toUpperCase(),
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                      color: GivyColors.inkSoft,
                    ),
                  ),
                ],
              ),
              if (i < units.length - 1)
                Padding(
                  padding: const EdgeInsets.only(bottom: 14, left: 8, right: 8),
                  child: Text(
                    ':',
                    style: givyDisplay(size: 22, color: GivyColors.border),
                  ),
                ),
            ],
          ],
        );
      },
    );
  }
}

class ClaimProgressBar extends StatelessWidget {
  const ClaimProgressBar({
    super.key,
    required this.claimed,
    required this.total,
  });

  final int claimed;
  final int total;

  @override
  Widget build(BuildContext context) {
    final pct = total == 0 ? 0.0 : claimed / total;
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                '$claimed of $total taken',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: GivyColors.inkSoft,
                ),
              ),
            ),
            Text(
              '${(pct * 100).round()}%',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: GivyColors.leaf,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: pct,
            minHeight: 8,
            backgroundColor: GivyColors.muted,
            color: GivyColors.coral,
          ),
        ),
      ],
    );
  }
}

/// Figma GiftCard — image, emoji corner, yellow price badge, claim CTA
class GiftProductCard extends StatelessWidget {
  const GiftProductCard({
    super.key,
    required this.item,
    required this.isOwner,
    this.onClaim,
  });

  final GiftItem item;
  final bool isOwner;
  final VoidCallback? onClaim;

  @override
  Widget build(BuildContext context) {
    final purchased = item.purchased;
    final title = item.title;
    final notes = item.notes;
    final price = item.price;
    final emoji = item.displayEmoji;
    final imageUrl = item.imageUrl;

    return Opacity(
      opacity: purchased ? 0.65 : 1,
      child: Container(
        decoration: BoxDecoration(
          color: GivyColors.paper,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: GivyColors.border, width: 2),
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AspectRatio(
                  aspectRatio: 1.15,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      ColoredBox(
                        color: GivyColors.muted,
                        child: imageUrl == null
                            ? Center(
                                child: Text(emoji, style: const TextStyle(fontSize: 40)),
                              )
                            : Image.network(
                                imageUrl,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Center(
                                  child: Text(emoji, style: const TextStyle(fontSize: 40)),
                                ),
                              ),
                      ),
                      Positioned(
                        top: 10,
                        left: 10,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.92),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(emoji, style: const TextStyle(fontSize: 16)),
                        ),
                      ),
                      if (price != null)
                        Positioned(
                          right: 10,
                          bottom: 10,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: GivyColors.gold,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '\$${price.toStringAsFixed(price.truncateToDouble() == price ? 0 : 2)}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 12,
                                color: GivyColors.ink,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 12, 12, 14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: givyDisplay(size: 14).copyWith(
                          decoration: purchased ? TextDecoration.lineThrough : null,
                          color: purchased ? GivyColors.inkSoft : GivyColors.ink,
                        ),
                      ),
                      if (notes != null && notes.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          notes,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 11, color: GivyColors.inkSoft),
                        ),
                      ],
                      const SizedBox(height: 10),
                      if (!isOwner && !purchased && onClaim != null)
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            onPressed: onClaim,
                            style: FilledButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              textStyle: const TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 12,
                              ),
                            ),
                            child: const Text('Claim this gift'),
                          ),
                        )
                      else
                        Row(
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: BoxDecoration(
                                color: purchased ? GivyColors.leafSoft : GivyColors.border,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              purchased ? 'Taken' : 'Open',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: purchased ? GivyColors.leaf : GivyColors.inkSoft,
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                ),
              ],
            ),
            if (purchased)
              Positioned.fill(
                child: ColoredBox(
                  color: GivyColors.background.withValues(alpha: 0.55),
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: GivyColors.paper,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: GivyColors.border),
                      ),
                      child: const Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.check, color: GivyColors.leafSoft, size: 18),
                          SizedBox(height: 4),
                          Text(
                            'Claimed',
                            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
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
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        price,
        style: const TextStyle(
          fontWeight: FontWeight.w900,
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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: GivyColors.gold,
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontWeight: FontWeight.w800,
          fontSize: 12,
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
