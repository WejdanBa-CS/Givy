import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../controller.dart';
import '../models.dart';
import '../store.dart';
import '../theme.dart';
import '../widgets.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.child, required this.index});

  final Widget child;
  final int index;

  @override
  Widget build(BuildContext context) {
    final user = context.watch<GivyController>().user;
    if (user == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) context.go('/login');
      });
      return const GivyScaffold(
        child: Scaffold(
          backgroundColor: Colors.transparent,
          body: Center(child: Text('Opening Givy…')),
        ),
      );
    }

    return GivyScaffold(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => context.go('/app'),
                      child: const GivyLogo(size: 28, fontSize: 20),
                    ),
                    const Spacer(),
                    TextButton(
                      onPressed: () => context.push('/app/activity'),
                      child: const Text('Activity'),
                    ),
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: HSLColor.fromAHSL(
                        1,
                        user.avatarHue.toDouble(),
                        0.55,
                        0.42,
                      ).toColor(),
                      child: Text(
                        user.name
                            .split(' ')
                            .map((e) => e.isEmpty ? '' : e[0])
                            .take(2)
                            .join(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(child: child),
            ],
          ),
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: index,
          backgroundColor: GivyColors.paper,
          indicatorColor: GivyColors.goldSoft,
          surfaceTintColor: Colors.transparent,
          shadowColor: Colors.transparent,
          elevation: 0,
          onDestinationSelected: (i) {
            switch (i) {
              case 0:
                context.go('/app');
              case 1:
                context.go('/app/lists');
              case 2:
                context.go('/app/create');
              case 3:
                context.go('/app/giveaways');
              case 4:
                context.go('/app/profile');
            }
          },
          destinations: const [
            NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
            NavigationDestination(icon: Icon(Icons.list_alt_outlined), selectedIcon: Icon(Icons.list_alt), label: 'Lists'),
            NavigationDestination(icon: Icon(Icons.add_circle_outline), selectedIcon: Icon(Icons.add_circle), label: 'Create'),
            NavigationDestination(icon: Icon(Icons.card_giftcard_outlined), selectedIcon: Icon(Icons.card_giftcard), label: 'Gives'),
            NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'You'),
          ],
        ),
      ),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = context.watch<GivyController>();
    final lists = c.lists;
    final claimed = lists.fold<int>(0, (n, l) => n + l.claimedCount);
    final openGives = c.giveaways.where((g) => g.status == GiveawayStatus.open).take(2);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        Text(
          '${c.user!.name.split(' ').first}',
          style: givyDisplay(size: 34),
        ),
        const SizedBox(height: 4),
        const Text('Welcome back', style: TextStyle(color: GivyColors.inkSoft, fontWeight: FontWeight.w600)),
        const SizedBox(height: 14),
        Row(
          children: [
            _stat('${lists.length}', 'Your lists'),
            const SizedBox(width: 8),
            _stat('$claimed', 'Gifts claimed'),
            const SizedBox(width: 8),
            _stat('${lists.fold<int>(0, (n, l) => n + (l.published ? 12 : 0))}', 'People viewing'),
          ],
        ),
        const SizedBox(height: 18),
        Text(
          'YOUR LISTS',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w900,
            letterSpacing: 2,
            color: GivyColors.inkSoft,
          ),
        ),
        const SizedBox(height: 10),
        ...lists.map(
          (list) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: GivyPanel(
              onTap: () => context.push('/app/list/${list.id}'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: GivyColors.secondary,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          '${occasionEmoji[list.occasion]} ${occasionLabels[list.occasion]}',
                          style: const TextStyle(
                            color: GivyColors.coral,
                            fontWeight: FontWeight.w800,
                            fontSize: 11,
                          ),
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '${daysUntil(list.eventDate)}d away',
                        style: const TextStyle(
                          color: GivyColors.coral,
                          fontWeight: FontWeight.w900,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(list.title, style: givyDisplay(size: 22)),
                  const SizedBox(height: 4),
                  Text(
                    '${formatShortDate(list.eventDate)} · ${list.published ? 'Shared' : 'Draft'}',
                    style: const TextStyle(color: GivyColors.inkSoft, fontSize: 13),
                  ),
                  if (list.items.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    ClaimProgressBar(
                      claimed: list.claimedCount,
                      total: list.items.length,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        OutlinedButton(
          onPressed: () => context.go('/app/create'),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(64),
            side: const BorderSide(color: GivyColors.border, width: 2, style: BorderStyle.solid),
          ),
          child: const Text('+ Start another list'),
        ),
        const SizedBox(height: 18),
        _sectionTitle(context, 'Nearby giveaways', () => context.go('/app/giveaways')),
        ...openGives.map(
          (g) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: GivyPanel(
              onTap: () => context.go('/app/giveaways'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(g.title, style: const TextStyle(fontWeight: FontWeight.w800)),
                  Text(
                    '${g.itemName} · ${g.area}',
                    style: const TextStyle(color: GivyColors.inkSoft, fontSize: 13),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _stat(String value, String label) {
    return Expanded(
      child: GivyPanel(
        padding: const EdgeInsets.all(14),
        child: Column(
          children: [
            Text(value, style: givyDisplay(size: 24)),
            Text(label, style: const TextStyle(fontSize: 11, color: GivyColors.inkSoft, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(BuildContext context, String title, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Text(title, style: givyDisplay(size: 22)),
          const Spacer(),
          TextButton(onPressed: onTap, child: const Text('See all')),
        ],
      ),
    );
  }
}
