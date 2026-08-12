import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../controller.dart';
import '../models.dart';
import '../theme.dart';
import '../widgets.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<GivyController>().user;
    if (user != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) context.go('/app');
      });
    }

    final wide = MediaQuery.sizeOf(context).width >= 860;

    return GivyScaffold(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: SafeArea(
          child: ListView(
            padding: EdgeInsets.zero,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Row(
                  children: [
                    const LogoMark(size: 34),
                    const SizedBox(width: 10),
                    Text('Givy', style: givyDisplay(size: 26)),
                    const Spacer(),
                    FilledButton(
                      style: FilledButton.styleFrom(
                        shape: const StadiumBorder(),
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                      ),
                      onPressed: () => context.go('/login'),
                      child: const Text('Sign in'),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 28, 20, 0),
                child: wide
                    ? Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          const Expanded(flex: 11, child: _HeroCopy()),
                          const SizedBox(width: 24),
                          const Expanded(flex: 10, child: _HeroVisuals()),
                        ],
                      )
                    : const Column(
                        children: [
                          _HeroCopy(),
                          SizedBox(height: 28),
                          _HeroVisuals(),
                        ],
                      ),
              ),
              const SizedBox(height: 48),
              Container(
                width: double.infinity,
                color: GivyColors.paper,
                child: Column(
                  children: [
                    const Divider(color: GivyColors.border, thickness: 2, height: 2),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 36, 20, 20),
                      child: Column(
                        children: [
                          Text(
                            'HOW IT WORKS',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 2.4,
                              color: GivyColors.inkSoft,
                            ),
                          ),
                          const SizedBox(height: 28),
                          ...[
                            ('✏️', '01', 'Make your list', 'Add gifts with a price, notes, or a product link.'),
                            ('🔗', '02', 'Share one link', 'Send it to friends and family — any chat, any app.'),
                            ('🤫', '03', 'They claim in private', 'Each gift can only be claimed once. You never see who bought what.'),
                          ].map(
                            (s) => Padding(
                              padding: const EdgeInsets.only(bottom: 22),
                              child: Column(
                                children: [
                                  Text(s.$1, style: const TextStyle(fontSize: 28)),
                                  const SizedBox(height: 8),
                                  Text(s.$2, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: GivyColors.inkSoft)),
                                  Text(s.$3, style: givyDisplay(size: 24)),
                                  const SizedBox(height: 4),
                                  Text(
                                    s.$4,
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(color: GivyColors.inkSoft, height: 1.4),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(color: GivyColors.border, thickness: 2, height: 2),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 36, 20, 28),
                child: Column(
                  children: [
                    const Text(
                      'WORKS FOR ANY OCCASION',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 2.4,
                        color: GivyColors.inkSoft,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      alignment: WrapAlignment.center,
                      children: const [
                        _OccasionPill(emoji: '🎂', label: 'Birthdays'),
                        _OccasionPill(emoji: '💍', label: 'Weddings'),
                        _OccasionPill(emoji: '🎄', label: 'Holidays'),
                        _OccasionPill(emoji: '🎁', label: 'Giveaways'),
                        _OccasionPill(emoji: '🐣', label: 'Baby showers'),
                        _OccasionPill(emoji: '🎓', label: 'Graduations'),
                        _OccasionPill(emoji: '🏠', label: 'Housewarmings'),
                        _OccasionPill(emoji: '💝', label: 'Just because'),
                      ],
                    ),
                  ],
                ),
              ),
              Container(
                width: double.infinity,
                color: GivyColors.coral,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 44),
                child: Column(
                  children: [
                    Text(
                      'Ready when they are.',
                      textAlign: TextAlign.center,
                      style: givyDisplay(size: 34, color: Colors.white).copyWith(
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'Start a free wishlist in under a minute.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 20),
                    FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: GivyColors.gold,
                        foregroundColor: GivyColors.ink,
                        shape: const StadiumBorder(),
                        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
                      ),
                      onPressed: () => context.go('/login'),
                      child: const Text('Start your list →'),
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

class _HeroCopy extends StatelessWidget {
  const _HeroCopy();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: GivyColors.gold,
            borderRadius: BorderRadius.circular(999),
          ),
          child: const Text(
            '✨ WISHLISTS, DONE RIGHT',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8),
          ),
        ),
        const SizedBox(height: 18),
        Text.rich(
          TextSpan(
            style: givyDisplay(size: 48),
            children: [
              const TextSpan(text: "Gifts they'll actually "),
              TextSpan(
                text: 'love.',
                style: givyDisplay(size: 48, color: GivyColors.coral).copyWith(
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        const Text(
          'Build a list. Share one link. Friends claim gifts in private — so nobody buys the same thing twice.',
          style: TextStyle(color: GivyColors.inkSoft, height: 1.45, fontSize: 16),
        ),
        const SizedBox(height: 22),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            FilledButton(
              style: FilledButton.styleFrom(
                shape: const StadiumBorder(),
                padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 16),
              ),
              onPressed: () => context.go('/login'),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircleAvatar(
                    radius: 11,
                    backgroundColor: Colors.white,
                    child: Text(
                      'G',
                      style: TextStyle(
                        color: Color(0xFF4285F4),
                        fontWeight: FontWeight.w900,
                        fontSize: 11,
                      ),
                    ),
                  ),
                  SizedBox(width: 10),
                  Text('Get started free →'),
                ],
              ),
            ),
            OutlinedButton(
              style: OutlinedButton.styleFrom(
                shape: const StadiumBorder(),
                side: const BorderSide(color: GivyColors.border, width: 2),
                padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 16),
              ),
              onPressed: () {},
              child: const Text('See how it works'),
            ),
          ],
        ),
        const SizedBox(height: 28),
        const Divider(color: GivyColors.border, thickness: 2),
        const SizedBox(height: 16),
        Row(
          children: const [
            _Stat(n: '10k+', l: 'lists shared'),
            SizedBox(width: 18),
            _Stat(n: '98%', l: 'no duplicates'),
            SizedBox(width: 18),
            _Stat(n: 'Free', l: 'to start'),
          ],
        ),
      ],
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.n, required this.l});
  final String n;
  final String l;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(n, style: givyDisplay(size: 24)),
          Text(l, style: const TextStyle(fontSize: 12, color: GivyColors.inkSoft, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _HeroVisuals extends StatelessWidget {
  const _HeroVisuals();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 420,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            right: 8,
            top: 0,
            child: Transform.rotate(
              angle: 0.05,
              child: Container(
                width: 168,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: GivyColors.gold,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: GivyColors.border, width: 2),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "JORDAN'S BIRTHDAY",
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1),
                    ),
                    Text('34 days', style: givyDisplay(size: 36)),
                    const Text('Sept 15, 2026', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: GivyColors.inkSoft)),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            right: 0,
            top: 96,
            child: Transform.rotate(
              angle: 0.04,
              child: Container(
                width: 200,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: GivyColors.paper,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: GivyColors.border, width: 2),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 110,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: GivyColors.coral,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Text('👟', style: TextStyle(fontSize: 48)),
                    ),
                    const SizedBox(height: 10),
                    const Text('Air Max Sneakers', style: TextStyle(fontWeight: FontWeight.w800)),
                    const Row(
                      children: [
                        Text('\$150', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: GivyColors.inkSoft)),
                        Spacer(),
                        Text('● Available', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: GivyColors.leaf)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            left: 0,
            bottom: 12,
            child: Transform.rotate(
              angle: -0.04,
              child: Container(
                width: 210,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: GivyColors.paper,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: GivyColors.border, width: 2),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 100,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: GivyColors.mistDeep,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Text('⌚', style: TextStyle(fontSize: 48)),
                    ),
                    const SizedBox(height: 10),
                    const Text('Galaxy Watch 7', style: TextStyle(fontWeight: FontWeight.w800)),
                    const Text('\$199', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: GivyColors.inkSoft)),
                    const SizedBox(height: 10),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(color: GivyColors.coral, width: 2),
                      ),
                      child: const Text(
                        'Claim this gift 🎁',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: GivyColors.coral, fontWeight: FontWeight.w800),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OccasionPill extends StatelessWidget {
  const _OccasionPill({required this.emoji, required this.label});
  final String emoji;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: GivyColors.paper,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: GivyColors.border, width: 2),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
        ],
      ),
    );
  }
}

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = context.watch<GivyController>();
    if (c.user != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) context.go('/app');
      });
    }

    final providers = [
      (AuthProvider.google, 'Continue with Google', 'Fastest for most people'),
      (AuthProvider.apple, 'Continue with Apple', 'Private & simple'),
      (AuthProvider.facebook, 'Continue with Facebook', 'Find friends easier later'),
    ];

    return GivyScaffold(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Row(
                  children: [
                    const LogoMark(size: 32),
                    const SizedBox(width: 10),
                    Text('Givy', style: givyDisplay(size: 24)),
                  ],
                ),
                const Spacer(),
                GivyPanel(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Sign in', style: givyDisplay(size: 30)),
                      const SizedBox(height: 8),
                      const Text(
                        'Demo mode — choose a provider to continue.',
                        style: TextStyle(color: GivyColors.inkSoft),
                      ),
                      const SizedBox(height: 20),
                      for (final p in providers) ...[
                        OutlinedButton(
                          onPressed: () async {
                            await context.read<GivyController>().signIn(p.$1);
                            if (context.mounted) context.go('/app');
                          },
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size.fromHeight(64),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(p.$2, style: const TextStyle(fontWeight: FontWeight.w700)),
                                    Text(p.$3, style: const TextStyle(fontSize: 12, color: GivyColors.inkSoft)),
                                  ],
                                ),
                              ),
                              const Text('→'),
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),
                      ],
                    ],
                  ),
                ),
                const Spacer(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
