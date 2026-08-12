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

    return GivyScaffold(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
            children: [
              Row(
                children: [
                  const GivyLogo(size: 32, fontSize: 22),
                  const Spacer(),
                  FilledButton(
                    onPressed: () => context.go('/login'),
                    child: const Text('Sign in'),
                  ),
                ],
              ),
              const SizedBox(height: 28),
              GivyPanel(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const GivyLogo(size: 56, fontSize: 48),
                    const SizedBox(height: 16),
                    Text(
                      'One shared list for the gifts people actually want.',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'Birthdays, weddings, holidays — create a Givy, share the link, and let friends claim gifts without the awkward double-ups.',
                      style: TextStyle(color: GivyColors.inkSoft, height: 1.4),
                    ),
                    const SizedBox(height: 20),
                    FilledButton(
                      onPressed: () => context.go('/login'),
                      child: const Text('Start a Givy'),
                    ),
                    const SizedBox(height: 20),
                    GivyPanel(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                'BIRTHDAY',
                                style: TextStyle(
                                  color: GivyColors.leaf,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 11,
                                  letterSpacing: 1.2,
                                ),
                              ),
                              const Spacer(),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: GivyColors.coral.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: const Text(
                                  '12 days',
                                  style: TextStyle(
                                    color: GivyColors.coralDeep,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text("Alex's big day", style: givyDisplay(size: 24)),
                          const SizedBox(height: 12),
                          _demoRow('Wool beanie', 'Claimed', claimed: true),
                          _demoRow('Snack care box', '\$35'),
                          _demoRow('Everyday watch', '\$120'),
                        ],
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

  Widget _demoRow(String title, String trailing, {bool claimed = false}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: GivyColors.paper.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: GivyColors.line),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                decoration: claimed ? TextDecoration.lineThrough : null,
                color: claimed ? GivyColors.inkSoft : GivyColors.ink,
              ),
            ),
          ),
          Text(
            trailing,
            style: TextStyle(
              color: GivyColors.inkSoft,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
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
                const Align(alignment: Alignment.centerLeft, child: GivyLogo()),
                const Spacer(),
                GivyPanel(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const GivyLogo(size: 44, fontSize: 32),
                      const SizedBox(height: 14),
                      Text(
                        'Link an account to start your list',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Demo sign-in — no real OAuth yet. Pick a provider and you’re in.',
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
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(18),
                            ),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(p.$2, style: const TextStyle(fontWeight: FontWeight.w700)),
                                    Text(
                                      p.$3,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: GivyColors.inkSoft,
                                      ),
                                    ),
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
