import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../controller.dart';
import '../models.dart';
import '../store.dart';
import '../theme.dart';
import '../widgets.dart';

class ListsScreen extends StatefulWidget {
  const ListsScreen({super.key});

  @override
  State<ListsScreen> createState() => _ListsScreenState();
}

class _ListsScreenState extends State<ListsScreen> {
  Occasion? filter;

  @override
  Widget build(BuildContext context) {
    final lists = context.watch<GivyController>().lists;
    final filtered = filter == null ? lists : lists.where((l) => l.occasion == filter).toList();

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        Row(
          children: [
            Expanded(child: Text('Lists', style: givyDisplay(size: 34))),
            FilledButton(
              onPressed: () => context.go('/app/create'),
              child: const Text('New Givy'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        const Text('Birthdays, holidays, weddings — all your Givies.', style: TextStyle(color: GivyColors.inkSoft)),
        const SizedBox(height: 14),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _chip('All', filter == null, () => setState(() => filter = null)),
              for (final o in Occasion.values)
                _chip(
                  '${occasionEmoji[o]} ${occasionLabels[o]}',
                  filter == o,
                  () => setState(() => filter = o),
                ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        for (final list in filtered)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: GivyPanel(
              onTap: () => context.push('/app/list/${list.id}'),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${occasionEmoji[list.occasion]} ${occasionLabels[list.occasion]} · ${list.published ? 'Shared' : 'Draft'}',
                          style: const TextStyle(color: GivyColors.leaf, fontWeight: FontWeight.w800, fontSize: 12),
                        ),
                        Text(list.title, style: givyDisplay(size: 22)),
                        Text(
                          '${list.items.length} items · ${list.claimedCount} claimed',
                          style: const TextStyle(color: GivyColors.inkSoft, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                  CountdownChip(eventDate: list.eventDate),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _chip(String label, bool selected, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
        selectedColor: GivyColors.ink,
        labelStyle: TextStyle(
          color: selected ? Colors.white : GivyColors.inkSoft,
          fontWeight: FontWeight.w700,
        ),
        backgroundColor: Colors.white.withValues(alpha: 0.7),
      ),
    );
  }
}

class CreateScreen extends StatefulWidget {
  const CreateScreen({super.key});

  @override
  State<CreateScreen> createState() => _CreateScreenState();
}

class _CreateScreenState extends State<CreateScreen> {
  final titleCtrl = TextEditingController(text: 'My birthday wishlist');
  final noteCtrl = TextEditingController(text: "A few things I'd love — no pressure, just ideas.");
  final addressCtrl = TextEditingController();
  Occasion occasion = Occasion.birthday;
  late DateTime eventDate;
  bool withDemo = true;

  @override
  void initState() {
    super.initState();
    eventDate = DateTime.now().add(const Duration(days: 21));
  }

  @override
  void dispose() {
    titleCtrl.dispose();
    noteCtrl.dispose();
    addressCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        Text('New Givy', style: givyDisplay(size: 34)),
        const SizedBox(height: 6),
        const Text('Pick an occasion, set the date, and start collecting ideas.', style: TextStyle(color: GivyColors.inkSoft)),
        const SizedBox(height: 16),
        GivyPanel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'List title')),
              const SizedBox(height: 12),
              const Text('Occasion', style: TextStyle(fontWeight: FontWeight.w700, color: GivyColors.inkSoft)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final o in Occasion.values)
                    ChoiceChip(
                      label: Text('${occasionEmoji[o]} ${occasionLabels[o]}'),
                      selected: occasion == o,
                      onSelected: (_) => setState(() => occasion = o),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Event date', style: TextStyle(fontWeight: FontWeight.w700)),
                subtitle: Text(formatShortDate('${eventDate.year}-${eventDate.month.toString().padLeft(2, '0')}-${eventDate.day.toString().padLeft(2, '0')}')),
                trailing: const Icon(Icons.calendar_today),
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365 * 3)),
                    initialDate: eventDate,
                  );
                  if (picked != null) setState(() => eventDate = picked);
                },
              ),
              TextField(controller: noteCtrl, maxLines: 3, decoration: const InputDecoration(labelText: 'Note for friends')),
              const SizedBox(height: 12),
              TextField(controller: addressCtrl, decoration: const InputDecoration(labelText: 'Ship-to-me address (optional)')),
              const SizedBox(height: 12),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Start with sample birthday ideas', style: TextStyle(fontWeight: FontWeight.w700)),
                subtitle: const Text('Hat, socks, snacks, watch, gift card'),
                value: withDemo,
                activeThumbColor: GivyColors.coral,
                onChanged: (v) => setState(() => withDemo = v),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () async {
                    final ymd =
                        '${eventDate.year.toString().padLeft(4, '0')}-${eventDate.month.toString().padLeft(2, '0')}-${eventDate.day.toString().padLeft(2, '0')}';
                    final list = await context.read<GivyController>().createList(
                          title: titleCtrl.text.trim().isEmpty ? 'Untitled Givy' : titleCtrl.text.trim(),
                          occasion: occasion,
                          description: noteCtrl.text.trim().isEmpty ? null : noteCtrl.text.trim(),
                          eventDate: ymd,
                          recipientAddress: addressCtrl.text.trim().isEmpty ? null : addressCtrl.text.trim(),
                          withDemoItems: withDemo,
                        );
                    if (list != null && context.mounted) {
                      context.push('/app/list/${list.id}');
                    }
                  },
                  child: const Text('Create Givy'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class ListDetailScreen extends StatefulWidget {
  const ListDetailScreen({super.key, required this.listId});

  final String listId;

  @override
  State<ListDetailScreen> createState() => _ListDetailScreenState();
}

class _ListDetailScreenState extends State<ListDetailScreen> {
  final titleCtrl = TextEditingController();
  final priceCtrl = TextEditingController();
  final urlCtrl = TextEditingController();
  final notesCtrl = TextEditingController();
  final addressCtrl = TextEditingController();

  @override
  void dispose() {
    titleCtrl.dispose();
    priceCtrl.dispose();
    urlCtrl.dispose();
    notesCtrl.dispose();
    addressCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.watch<GivyController>();
    final list = c.listById(widget.listId);
    if (list == null) {
      return GivyScaffold(
        child: Scaffold(
          backgroundColor: Colors.transparent,
          appBar: AppBar(title: const Text('Not found')),
          body: const Center(child: Text('List not found')),
        ),
      );
    }
    if (addressCtrl.text.isEmpty && (list.recipientAddress?.isNotEmpty ?? false)) {
      addressCtrl.text = list.recipientAddress!;
    }

    return GivyScaffold(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: const Text('List'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.go('/app/lists'),
          ),
        ),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 28),
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${occasionEmoji[list.occasion]} ${occasionLabels[list.occasion]}',
                        style: const TextStyle(color: GivyColors.leaf, fontWeight: FontWeight.w800, fontSize: 12),
                      ),
                      Text(list.title, style: givyDisplay(size: 32)),
                      if (list.description != null)
                        Text(list.description!, style: const TextStyle(color: GivyColors.inkSoft)),
                    ],
                  ),
                ),
                CountdownChip(eventDate: list.eventDate),
              ],
            ),
            const SizedBox(height: 14),
            for (final item in list.items)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Opacity(
                  opacity: item.purchased ? 0.55 : 1,
                  child: GivyPanel(
                    child: Row(
                      children: [
                        GiftEmoji(hint: item.imageHint),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.title,
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  decoration: item.purchased ? TextDecoration.lineThrough : null,
                                ),
                              ),
                              Text(
                                item.purchased ? 'Claimed' : formatMoney(item.price),
                                style: const TextStyle(color: GivyColors.inkSoft, fontSize: 13),
                              ),
                              if (item.notes != null)
                                Text(item.notes!, style: const TextStyle(color: GivyColors.inkSoft, fontSize: 13)),
                            ],
                          ),
                        ),
                        if (!item.purchased)
                          IconButton(
                            onPressed: () => c.removeItem(list.id, item.id),
                            icon: const Icon(Icons.close),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            GivyPanel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Add a gift idea', style: givyDisplay(size: 22)),
                  const SizedBox(height: 10),
                  TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Title')),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: priceCtrl,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'Price'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: urlCtrl,
                          decoration: const InputDecoration(labelText: 'URL'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  TextField(controller: notesCtrl, decoration: const InputDecoration(labelText: 'Notes')),
                  const SizedBox(height: 10),
                  OutlinedButton(
                    onPressed: () async {
                      if (titleCtrl.text.trim().isEmpty) return;
                      await c.addItem(
                        listId: list.id,
                        title: titleCtrl.text.trim(),
                        price: double.tryParse(priceCtrl.text),
                        url: urlCtrl.text.trim().isEmpty ? null : urlCtrl.text.trim(),
                        notes: notesCtrl.text.trim().isEmpty ? null : notesCtrl.text.trim(),
                      );
                      titleCtrl.clear();
                      priceCtrl.clear();
                      urlCtrl.clear();
                      notesCtrl.clear();
                    },
                    child: const Text('Add to list'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            GivyPanel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Share', style: givyDisplay(size: 22)),
                  const SizedBox(height: 6),
                  Text('Code: ${list.shareCode}', style: const TextStyle(color: GivyColors.inkSoft)),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    children: [
                      if (!list.published)
                        FilledButton(
                          onPressed: () => c.publishList(list.id),
                          child: const Text('Finalize & share'),
                        )
                      else
                        FilledButton(
                          onPressed: () async {
                            await Clipboard.setData(ClipboardData(text: list.shareCode));
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Share code copied')),
                              );
                            }
                          },
                          child: const Text('Copy code'),
                        ),
                      OutlinedButton(
                        onPressed: () => context.push('/g/${list.shareCode}'),
                        child: const Text('Preview'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            GivyPanel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Shipping address', style: givyDisplay(size: 22)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: addressCtrl,
                    maxLines: 2,
                    decoration: const InputDecoration(hintText: '123 Gift Lane…'),
                    onChanged: (v) => c.updateAddress(list.id, v),
                  ),
                ],
              ),
            ),
            TextButton(
              onPressed: () async {
                final ok = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Delete this Givy?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                      TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete')),
                    ],
                  ),
                );
                if (ok == true) {
                  await c.deleteList(list.id);
                  if (context.mounted) context.go('/app/lists');
                }
              },
              child: const Text('Delete list', style: TextStyle(color: GivyColors.coralDeep)),
            ),
          ],
        ),
      ),
    );
  }
}
