import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../controller.dart';
import '../models.dart';
import '../store.dart';
import '../theme.dart';
import '../widgets.dart';

class GiveawaysScreen extends StatefulWidget {
  const GiveawaysScreen({super.key});

  @override
  State<GiveawaysScreen> createState() => _GiveawaysScreenState();
}

class _GiveawaysScreenState extends State<GiveawaysScreen> {
  bool showForm = false;
  final titleCtrl = TextEditingController();
  final itemCtrl = TextEditingController();
  final descCtrl = TextEditingController();
  final areaCtrl = TextEditingController(text: 'Within 10 miles');
  late DateTime endsAt;

  @override
  void initState() {
    super.initState();
    endsAt = DateTime.now().add(const Duration(days: 7));
  }

  @override
  void dispose() {
    titleCtrl.dispose();
    itemCtrl.dispose();
    descCtrl.dispose();
    areaCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.watch<GivyController>();
    final user = c.user!;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        Row(
          children: [
            Expanded(child: Text('Giveaways', style: givyDisplay(size: 34))),
            FilledButton(
              onPressed: () => setState(() => showForm = !showForm),
              child: Text(showForm ? 'Cancel' : 'Post'),
            ),
          ],
        ),
        const SizedBox(height: 6),
        const Text(
          'Free stuff nearby — join the pool, and a lucky person gets to pick it up.',
          style: TextStyle(color: GivyColors.inkSoft),
        ),
        if (showForm) ...[
          const SizedBox(height: 14),
          GivyPanel(
            child: Column(
              children: [
                TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Title')),
                const SizedBox(height: 8),
                TextField(controller: itemCtrl, decoration: const InputDecoration(labelText: "What's free?")),
                const SizedBox(height: 8),
                TextField(controller: descCtrl, maxLines: 2, decoration: const InputDecoration(labelText: 'Details')),
                const SizedBox(height: 8),
                TextField(controller: areaCtrl, decoration: const InputDecoration(labelText: 'Area')),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () async {
                      final ymd =
                          '${endsAt.year.toString().padLeft(4, '0')}-${endsAt.month.toString().padLeft(2, '0')}-${endsAt.day.toString().padLeft(2, '0')}';
                      await c.createGiveaway(
                        title: titleCtrl.text.trim().isEmpty ? 'Local giveaway' : titleCtrl.text.trim(),
                        itemName: itemCtrl.text.trim().isEmpty ? 'Free item' : itemCtrl.text.trim(),
                        description: descCtrl.text.trim().isEmpty ? 'Pickup only.' : descCtrl.text.trim(),
                        area: areaCtrl.text.trim().isEmpty ? 'Nearby' : areaCtrl.text.trim(),
                        endsAt: ymd,
                      );
                      setState(() {
                        showForm = false;
                        titleCtrl.clear();
                        itemCtrl.clear();
                        descCtrl.clear();
                      });
                    },
                    child: const Text('Publish giveaway'),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 14),
        for (final g in c.giveaways)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: GivyPanel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${g.status.name.toUpperCase()} · ${g.area}',
                    style: const TextStyle(color: GivyColors.leaf, fontWeight: FontWeight.w800, fontSize: 12),
                  ),
                  Text(g.title, style: givyDisplay(size: 22)),
                  Text(g.itemName, style: const TextStyle(fontWeight: FontWeight.w700, color: GivyColors.inkSoft)),
                  const SizedBox(height: 6),
                  Text(g.description, style: const TextStyle(color: GivyColors.inkSoft)),
                  const SizedBox(height: 6),
                  Text(
                    'By ${g.ownerName} · ends ${formatShortDate(g.endsAt)} · ${g.entrantIds.length} joined'
                    '${g.winnerName != null ? ' · Winner: ${g.winnerName}' : ''}',
                    style: const TextStyle(fontSize: 12, color: GivyColors.inkSoft),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    children: [
                      if (g.ownerId != user.id && g.status == GiveawayStatus.open)
                        FilledButton(
                          onPressed: g.entrantIds.contains(user.id) ? null : () => c.joinGiveaway(g.id),
                          child: Text(g.entrantIds.contains(user.id) ? "You're in" : 'Join giveaway'),
                        ),
                      if (g.ownerId == user.id && g.status == GiveawayStatus.open)
                        OutlinedButton(
                          onPressed: g.entrantIds.isEmpty ? null : () => c.drawGiveaway(g.id),
                          child: const Text('Draw a winner'),
                        ),
                      if (g.ownerId == user.id)
                        const Text('Yours', style: TextStyle(color: GivyColors.leaf, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = context.watch<GivyController>();
    final user = c.user!;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        GivyPanel(
          child: Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: HSLColor.fromAHSL(1, user.avatarHue.toDouble(), 0.55, 0.42).toColor(),
                child: Text(
                  user.name.split(' ').map((e) => e[0]).take(2).join(),
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(user.name, style: givyDisplay(size: 26)),
                    Text(
                      '${user.email} · ${user.provider.name}',
                      style: const TextStyle(color: GivyColors.inkSoft, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        GivyPanel(
          child: Column(
            children: [
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Your lists', style: TextStyle(fontWeight: FontWeight.w700)),
                trailing: Text('${c.lists.length}'),
                onTap: () => context.go('/app/lists'),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Your giveaways', style: TextStyle(fontWeight: FontWeight.w700)),
                trailing: Text('${c.giveaways.where((g) => g.ownerId == user.id).length}'),
                onTap: () => context.go('/app/giveaways'),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Activity', style: TextStyle(fontWeight: FontWeight.w700)),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.push('/app/activity'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: () async {
              await c.signOut();
              if (context.mounted) context.go('/');
            },
            child: const Text('Sign out'),
          ),
        ),
      ],
    );
  }
}

class ActivityScreen extends StatelessWidget {
  const ActivityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final activity = context.watch<GivyController>().activity;
    return GivyScaffold(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: const Text('Activity')),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            for (final a in activity)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: GivyPanel(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(a.message, style: const TextStyle(fontWeight: FontWeight.w700)),
                      Text(formatShortDate(a.at), style: const TextStyle(color: GivyColors.inkSoft, fontSize: 12)),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class SharedScreen extends StatefulWidget {
  const SharedScreen({super.key, required this.code});

  final String code;

  @override
  State<SharedScreen> createState() => _SharedScreenState();
}

class _SharedScreenState extends State<SharedScreen> {
  String? doneMsg;

  @override
  Widget build(BuildContext context) {
    final c = context.watch<GivyController>();
    final list = c.listByShare(widget.code);

    if (list == null) {
      return GivyScaffold(
        child: Scaffold(
          backgroundColor: Colors.transparent,
          appBar: AppBar(title: const GivyLogo(size: 28, fontSize: 20)),
          body: const Center(child: Text('Hmm, no Givy here')),
        ),
      );
    }

    return GivyScaffold(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: Column(
          children: [
            FriendBanner(
              text: 'Friend view — claims stay private from ${list.ownerName.split(' ').first}',
            ),
            Expanded(
              child: Scaffold(
                backgroundColor: Colors.transparent,
                appBar: AppBar(
                  title: const GivyLogo(size: 28, fontSize: 20),
                  leading: IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => context.canPop() ? context.pop() : context.go('/'),
                  ),
                ),
                body: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    GivyPanel(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${occasionLabels[list.occasion]} · ${list.ownerName}',
                            style: const TextStyle(
                              color: GivyColors.leaf,
                              fontWeight: FontWeight.w800,
                              fontSize: 12,
                            ),
                          ),
                          Text(list.title, style: givyDisplay(size: 32)),
                          if (list.description != null)
                            Text(
                              list.description!,
                              style: const TextStyle(color: GivyColors.inkSoft),
                            ),
                          const SizedBox(height: 12),
                          CountdownDisplay(eventDate: list.eventDate),
                        ],
                      ),
                    ),
                    if (doneMsg != null) ...[
                      const SizedBox(height: 10),
                      GivyPanel(
                        color: GivyColors.goldSoft,
                        child: Text(
                          doneMsg!,
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                    const SizedBox(height: 12),
                    if (list.items.isNotEmpty)
                      GivyPanel(
                        child: ClaimProgressBar(
                          claimed: list.claimedCount,
                          total: list.items.length,
                        ),
                      ),
                    const SizedBox(height: 12),
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: list.items.length,
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                        childAspectRatio: 0.68,
                      ),
                      itemBuilder: (context, i) {
                        final item = list.items[i];
                        return GiftProductCard(
                          item: item,
                          isOwner: false,
                          onClaim: item.purchased
                              ? null
                              : () => _claim(context, list.id, item),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _claim(BuildContext context, String listId, GiftItem item) async {
    var ship = ShipPreference.toGiver;
    final confirmed = await showModalBottomSheet<ShipPreference>(
      context: context,
      showDragHandle: true,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModal) {
            return Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Claim ${item.title}', style: givyDisplay(size: 24)),
                  const SizedBox(height: 6),
                  const Text(
                    'Others will see it as taken — they won’t see it was you.',
                    style: TextStyle(color: GivyColors.inkSoft),
                  ),
                  RadioListTile<ShipPreference>(
                    value: ShipPreference.toGiver,
                    groupValue: ship,
                    title: const Text('Ship to me'),
                    subtitle: const Text('Wrap it and give it in person.'),
                    onChanged: (v) => setModal(() => ship = v!),
                  ),
                  RadioListTile<ShipPreference>(
                    value: ShipPreference.toRecipient,
                    groupValue: ship,
                    title: const Text('Ship to recipient'),
                    subtitle: const Text('Send it directly to their address.'),
                    onChanged: (v) => setModal(() => ship = v!),
                  ),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () => Navigator.pop(ctx, ship),
                      child: const Text('Confirm claim'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
    if (confirmed == null || !mounted) return;
    final controller = context.read<GivyController>();
    await controller.claimItem(listId, item.id, confirmed);
    if (!mounted) return;
    setState(() {
      doneMsg = confirmed == ShipPreference.toGiver
          ? 'Nice — “${item.title}” is yours to wrap.'
          : 'Nice — “${item.title}” is marked claimed for direct shipping.';
    });
  }
}
