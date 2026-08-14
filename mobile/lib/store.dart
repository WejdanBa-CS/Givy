import 'dart:convert';
import 'dart:math';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import 'models.dart';

const _uuid = Uuid();

class GivyStore {
  GivyStore(this._prefs);

  final SharedPreferences _prefs;

  static const _userKey = 'givy.user';
  static const _usersKey = 'givy.users';
  static const _listsKey = 'givy.lists';
  static const _giveawaysKey = 'givy.giveaways';
  static const _activityKey = 'givy.activity';
  static const _seededKey = 'givy.seeded.v3';

  UserAccount? getCurrentUser() {
    final raw = _prefs.getString(_userKey);
    if (raw == null) return null;
    return UserAccount.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  Future<UserAccount> signIn(AuthProvider provider) async {
    final savedRaw = _prefs.getString(_usersKey);
    final saved = savedRaw == null
        ? <String, dynamic>{}
        : jsonDecode(savedRaw) as Map<String, dynamic>;

    if (saved[provider.name] != null) {
      final user = UserAccount.fromJson(
        saved[provider.name] as Map<String, dynamic>,
      );
      await _prefs.setString(_userKey, jsonEncode(user.toJson()));
      await ensureSeedData(user);
      return user;
    }

    const names = {
      AuthProvider.google: 'Alex Rivera',
      AuthProvider.apple: 'Jordan Lee',
      AuthProvider.facebook: 'Sam Okoye',
    };
    const emails = {
      AuthProvider.google: 'alex@gmail.com',
      AuthProvider.apple: 'jordan@icloud.com',
      AuthProvider.facebook: 'sam@facebook.com',
    };

    final user = UserAccount(
      id: 'user_${_uuid.v4().substring(0, 8)}',
      name: names[provider]!,
      email: emails[provider]!,
      provider: provider,
      avatarHue: Random().nextInt(360),
    );
    saved[provider.name] = user.toJson();
    await _prefs.setString(_usersKey, jsonEncode(saved));
    await _prefs.setString(_userKey, jsonEncode(user.toJson()));
    await ensureSeedData(user);
    return user;
  }

  Future<void> signOut() async {
    await _prefs.remove(_userKey);
  }

  List<GivyList> getLists() {
    final raw = _prefs.getString(_listsKey);
    if (raw == null) return [];
    final list = jsonDecode(raw) as List<dynamic>;
    return list
        .map((e) => GivyList.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  List<GivyList> listsForUser(String userId) {
    final lists = getLists().where((l) => l.ownerId == userId).toList()
      ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    return lists;
  }

  GivyList? listById(String id) {
    try {
      return getLists().firstWhere((l) => l.id == id);
    } catch (_) {
      return null;
    }
  }

  GivyList? listByShareCode(String code) {
    try {
      return getLists().firstWhere((l) => l.shareCode == code);
    } catch (_) {
      return null;
    }
  }

  Future<void> _saveLists(List<GivyList> lists) async {
    await _prefs.setString(
      _listsKey,
      jsonEncode(lists.map((e) => e.toJson()).toList()),
    );
  }

  List<Giveaway> getGiveaways() {
    final raw = _prefs.getString(_giveawaysKey);
    if (raw == null) return [];
    final list = jsonDecode(raw) as List<dynamic>;
    final items = list
        .map((e) => Giveaway.fromJson(e as Map<String, dynamic>))
        .toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return items;
  }

  Future<void> _saveGiveaways(List<Giveaway> items) async {
    await _prefs.setString(
      _giveawaysKey,
      jsonEncode(items.map((e) => e.toJson()).toList()),
    );
  }

  List<ActivityEvent> getActivity() {
    final raw = _prefs.getString(_activityKey);
    if (raw == null) return [];
    final list = jsonDecode(raw) as List<dynamic>;
    return list
        .map((e) => ActivityEvent.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> _pushActivity(ActivityEvent event) async {
    final events = getActivity();
    events.insert(0, event);
    await _prefs.setString(
      _activityKey,
      jsonEncode(events.take(40).map((e) => e.toJson()).toList()),
    );
  }

  Future<void> ensureSeedData(UserAccount user) async {
    final seeded = _prefs.getBool(_seededKey) ?? false;
    if (seeded && listsForUser(user.id).isNotEmpty) return;

    final now = DateTime.now();
    var holiday = DateTime(now.year, 12, 25);
    if (holiday.isBefore(now)) {
      holiday = DateTime(now.year + 1, 12, 25);
    }
    final giveawayEnd = now.add(const Duration(days: 5));

    // Match Figma Make demo gifts (images + emoji + yellow price badges)
    final demoItems = <({
      String title,
      String notes,
      double price,
      String emoji,
      String imageUrl,
      bool claimed,
    })>[
      (
        title: 'New Era 59FIFTY Cap',
        notes: 'Black fitted, size 7¼',
        price: 42,
        emoji: '🧢',
        imageUrl:
            'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&h=500&fit=crop&auto=format',
        claimed: true,
      ),
      (
        title: 'Samsung Galaxy Watch 7',
        notes: '44mm Graphite',
        price: 199,
        emoji: '⌚',
        imageUrl:
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop&auto=format',
        claimed: false,
      ),
      (
        title: 'Cozy Sock Bundle',
        notes: '12-pack assorted',
        price: 28,
        emoji: '🧦',
        imageUrl:
            'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=500&h=500&fit=crop&auto=format',
        claimed: false,
      ),
      (
        title: 'Amazon Gift Card',
        notes: '\$50 digital',
        price: 50,
        emoji: '💳',
        imageUrl:
            'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&h=500&fit=crop&auto=format',
        claimed: true,
      ),
      (
        title: 'Monthly Snack Box',
        notes: '3-month subscription',
        price: 35,
        emoji: '🍿',
        imageUrl:
            'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=500&h=500&fit=crop&auto=format',
        claimed: false,
      ),
      (
        title: 'Air Max Sneakers',
        notes: 'Size 11, Red/White',
        price: 150,
        emoji: '👟',
        imageUrl:
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop&auto=format',
        claimed: false,
      ),
    ];

    final birthdayList = GivyList(
      id: 'givy_${_uuid.v4().substring(0, 8)}',
      ownerId: user.id,
      ownerName: user.name,
      title: "${user.name.split(' ').first}'s Birthday Wishlist",
      occasion: Occasion.birthday,
      description: "A few things I'd love. No pressure, just ideas.",
      eventDate: '2026-09-15',
      recipientAddress: '184 Maple Street, Apt 4B',
      shareCode: 'demo${_uuid.v4().substring(0, 6)}',
      published: true,
      items: [
        for (final d in demoItems)
          GiftItem(
            id: 'gift_${_uuid.v4().substring(0, 8)}',
            title: d.title,
            notes: d.notes,
            price: d.price,
            emoji: d.emoji,
            imageUrl: d.imageUrl,
            imageHint: d.emoji,
            url: d.imageUrl,
            purchased: d.claimed,
            purchasedAt: d.claimed ? now.toIso8601String() : null,
          ),
      ],
      createdAt: now.toIso8601String(),
      updatedAt: now.toIso8601String(),
    );

    final holidayList = GivyList(
      id: 'givy_${_uuid.v4().substring(0, 8)}',
      ownerId: user.id,
      ownerName: user.name,
      title: 'Holiday wishlist',
      occasion: Occasion.holiday,
      description: 'For anyone shopping early.',
      eventDate: _ymd(holiday),
      shareCode: _uuid.v4().substring(0, 10),
      published: false,
      items: [
        GiftItem(
          id: 'gift_${_uuid.v4().substring(0, 8)}',
          title: 'Cozy throw blanket',
          notes: 'Neutral colors',
          price: 45,
          url: 'https://www.example.com/blanket',
        ),
        GiftItem(
          id: 'gift_${_uuid.v4().substring(0, 8)}',
          title: 'Board game night kit',
          price: 38,
          url: 'https://www.example.com/game',
        ),
      ],
      createdAt: now.toIso8601String(),
      updatedAt: now.toIso8601String(),
    );

    final existing = getLists().where((l) => l.ownerId != user.id).toList();
    await _saveLists([...existing, birthdayList, holidayList]);

    final community = Giveaway(
      id: 'give_${_uuid.v4().substring(0, 8)}',
      ownerId: 'community',
      ownerName: 'Maya Chen',
      title: 'Free coffee table',
      description:
          'Moving next week. Solid wood coffee table, minor scuffs. Pickup only.',
      itemName: 'Mid-century coffee table',
      area: 'Within 10 miles',
      endsAt: _ymd(giveawayEnd),
      status: GiveawayStatus.open,
      entrantIds: const [],
      createdAt: now.toIso8601String(),
    );

    final mine = Giveaway(
      id: 'give_${_uuid.v4().substring(0, 8)}',
      ownerId: user.id,
      ownerName: user.name,
      title: 'Desk lamp giveaway',
      description: 'Barely used lamp. First lucky neighbor wins.',
      itemName: 'Adjustable desk lamp',
      area: 'Same neighborhood',
      endsAt: _ymd(giveawayEnd),
      status: GiveawayStatus.open,
      entrantIds: const ['neighbor_1', 'neighbor_2'],
      createdAt: now.toIso8601String(),
    );

    final otherGives = getGiveaways()
        .where((g) => g.ownerId != user.id && g.ownerId != 'community')
        .toList();
    await _saveGiveaways([community, mine, ...otherGives]);

    await _prefs.setString(
      _activityKey,
      jsonEncode([
        ActivityEvent(
          id: 'act_${_uuid.v4().substring(0, 8)}',
          type: 'create',
          message: 'Created “${birthdayList.title}”',
          at: now.toIso8601String(),
          listId: birthdayList.id,
        ).toJson(),
        ActivityEvent(
          id: 'act_${_uuid.v4().substring(0, 8)}',
          type: 'publish',
          message: 'Shared birthday list with friends',
          at: now.toIso8601String(),
          listId: birthdayList.id,
        ).toJson(),
        ActivityEvent(
          id: 'act_${_uuid.v4().substring(0, 8)}',
          type: 'claim',
          message: 'Someone claimed “Wool beanie” (anonymous)',
          at: now.toIso8601String(),
          listId: birthdayList.id,
        ).toJson(),
      ]),
    );

    await _prefs.setBool(_seededKey, true);
  }

  Future<GivyList> createList({
    required UserAccount owner,
    required String title,
    required Occasion occasion,
    String? description,
    required String eventDate,
    String? recipientAddress,
    String? supportUrl,
    String? supportLabel,
    bool withDemoItems = true,
  }) async {
    final now = DateTime.now().toIso8601String();
    final demo = [
      ('Wool beanie', 28.0, 'hat'),
      ('Fun patterned socks', 18.0, 'socks'),
      ('Snack care box', 35.0, 'snacks'),
      ('Everyday watch', 120.0, 'watch'),
      ('Gift card', 50.0, 'card'),
    ];
    final list = GivyList(
      id: 'givy_${_uuid.v4().substring(0, 8)}',
      ownerId: owner.id,
      ownerName: owner.name,
      title: title,
      occasion: occasion,
      description: description,
      eventDate: eventDate,
      recipientAddress: recipientAddress,
      supportUrl: supportUrl,
      supportLabel: supportLabel,
      shareCode: _uuid.v4().substring(0, 10),
      items: withDemoItems
          ? [
              for (final d in demo)
                GiftItem(
                  id: 'gift_${_uuid.v4().substring(0, 8)}',
                  title: d.$1,
                  price: d.$2,
                  imageHint: d.$3,
                  url: 'https://www.example.com/${d.$3}',
                ),
            ]
          : [],
      createdAt: now,
      updatedAt: now,
    );
    await _saveLists([...getLists(), list]);
    await _pushActivity(
      ActivityEvent(
        id: 'act_${_uuid.v4().substring(0, 8)}',
        type: 'create',
        message: 'Created “${list.title}”',
        at: now,
        listId: list.id,
      ),
    );
    return list;
  }

  Future<GivyList?> updateList(String id, GivyList Function(GivyList) fn) async {
    final lists = getLists();
    final idx = lists.indexWhere((l) => l.id == id);
    if (idx < 0) return null;
    lists[idx] = fn(lists[idx]).copyWith(updatedAt: DateTime.now().toIso8601String());
    await _saveLists(lists);
    return lists[idx];
  }

  Future<void> deleteList(String id) async {
    await _saveLists(getLists().where((l) => l.id != id).toList());
  }

  Future<GivyList?> addItem(String listId, GiftItem item) async {
    return updateList(listId, (list) => list.copyWith(items: [...list.items, item]));
  }

  Future<GivyList?> removeItem(String listId, String itemId) async {
    return updateList(
      listId,
      (list) => list.copyWith(
        items: list.items.where((i) => i.id != itemId).toList(),
      ),
    );
  }

  Future<GivyList?> claimItem(
    String listId,
    String itemId,
    ShipPreference ship,
  ) async {
    final list = listById(listId);
    if (list == null) return null;
    GiftItem? target;
    final items = list.items.map((item) {
      if (item.id != itemId || item.purchased) return item;
      target = item;
      return item.copyWith(
        purchased: true,
        purchasedAt: DateTime.now().toIso8601String(),
        claimedByMe: true,
        shipPreference: ship,
      );
    }).toList();
    final updated = await updateList(listId, (l) => l.copyWith(items: items));
    if (updated != null && target != null) {
      await _pushActivity(
        ActivityEvent(
          id: 'act_${_uuid.v4().substring(0, 8)}',
          type: 'claim',
          message: 'Someone claimed “${target!.title}” (anonymous)',
          at: DateTime.now().toIso8601String(),
          listId: listId,
        ),
      );
    }
    return updated;
  }

  Future<GivyList?> publishList(String listId) async {
    final updated = await updateList(listId, (l) => l.copyWith(published: true));
    if (updated != null) {
      await _pushActivity(
        ActivityEvent(
          id: 'act_${_uuid.v4().substring(0, 8)}',
          type: 'publish',
          message: 'Shared “${updated.title}”',
          at: DateTime.now().toIso8601String(),
          listId: listId,
        ),
      );
    }
    return updated;
  }

  Future<Giveaway> createGiveaway({
    required UserAccount owner,
    required String title,
    required String description,
    required String itemName,
    required String area,
    required String endsAt,
  }) async {
    final g = Giveaway(
      id: 'give_${_uuid.v4().substring(0, 8)}',
      ownerId: owner.id,
      ownerName: owner.name,
      title: title,
      description: description,
      itemName: itemName,
      area: area,
      endsAt: endsAt,
      status: GiveawayStatus.open,
      entrantIds: const [],
      createdAt: DateTime.now().toIso8601String(),
    );
    await _saveGiveaways([g, ...getGiveaways()]);
    return g;
  }

  Future<Giveaway?> joinGiveaway(String id, String userId) async {
    final items = getGiveaways();
    final idx = items.indexWhere((g) => g.id == id);
    if (idx < 0) return null;
    final g = items[idx];
    if (g.status != GiveawayStatus.open ||
        g.entrantIds.contains(userId) ||
        g.ownerId == userId) {
      return g;
    }
    items[idx] = g.copyWith(entrantIds: [...g.entrantIds, userId]);
    await _saveGiveaways(items);
    await _pushActivity(
      ActivityEvent(
        id: 'act_${_uuid.v4().substring(0, 8)}',
        type: 'giveaway_join',
        message: 'Joined giveaway “${g.title}”',
        at: DateTime.now().toIso8601String(),
        giveawayId: id,
      ),
    );
    return items[idx];
  }

  Future<Giveaway?> drawGiveaway(String id, String ownerId) async {
    final items = getGiveaways();
    final idx = items.indexWhere((g) => g.id == id);
    if (idx < 0) return null;
    final g = items[idx];
    if (g.ownerId != ownerId ||
        g.status != GiveawayStatus.open ||
        g.entrantIds.isEmpty) {
      return g;
    }
    final winnerId = g.entrantIds[Random().nextInt(g.entrantIds.length)];
    final winnerName = winnerId.startsWith('neighbor')
        ? 'Neighbor ${winnerId.substring(winnerId.length - 1)}'
        : (getCurrentUser()?.id == winnerId
            ? getCurrentUser()!.name
            : 'Lucky winner');
    items[idx] = g.copyWith(
      status: GiveawayStatus.drawn,
      winnerId: winnerId,
      winnerName: winnerName,
    );
    await _saveGiveaways(items);
    await _pushActivity(
      ActivityEvent(
        id: 'act_${_uuid.v4().substring(0, 8)}',
        type: 'giveaway_win',
        message: 'Drew a winner for “${g.title}”: $winnerName',
        at: DateTime.now().toIso8601String(),
        giveawayId: id,
      ),
    );
    return items[idx];
  }

  static String _ymd(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}

int daysUntil(String dateIso) {
  final target = DateTime.parse(dateIso.length > 10 ? dateIso : '${dateIso}T12:00:00');
  final now = DateTime.now();
  final start = DateTime(now.year, now.month, now.day);
  final end = DateTime(target.year, target.month, target.day);
  return end.difference(start).inDays;
}

String formatMoney(double? n) {
  if (n == null) return '';
  return '\$${n.toStringAsFixed(0)}';
}

String formatShortDate(String dateIso) {
  final d = DateTime.parse(dateIso.length > 10 ? dateIso : '${dateIso}T12:00:00');
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return '${months[d.month - 1]} ${d.day}';
}

String countdownLabel(String eventDate) {
  final days = daysUntil(eventDate);
  if (days > 1) return '$days days to go';
  if (days == 1) return 'Tomorrow';
  if (days == 0) return 'Today';
  return '${days.abs()} days ago';
}
