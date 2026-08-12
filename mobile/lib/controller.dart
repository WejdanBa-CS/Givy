import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import 'models.dart';
import 'store.dart';

class GivyController extends ChangeNotifier {
  GivyController();

  late GivyStore _store;
  bool ready = false;
  UserAccount? user;
  List<GivyList> lists = [];
  List<Giveaway> giveaways = [];
  List<ActivityEvent> activity = [];

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _store = GivyStore(prefs);
    _reload();
    ready = true;
    notifyListeners();
  }

  void _reload() {
    user = _store.getCurrentUser();
    lists = user == null ? [] : _store.listsForUser(user!.id);
    giveaways = _store.getGiveaways();
    activity = _store.getActivity();
  }

  Future<void> signIn(AuthProvider provider) async {
    await _store.signIn(provider);
    _reload();
    notifyListeners();
  }

  Future<void> signOut() async {
    await _store.signOut();
    _reload();
    notifyListeners();
  }

  Future<GivyList?> createList({
    required String title,
    required Occasion occasion,
    String? description,
    required String eventDate,
    String? recipientAddress,
    bool withDemoItems = true,
  }) async {
    if (user == null) return null;
    final list = await _store.createList(
      owner: user!,
      title: title,
      occasion: occasion,
      description: description,
      eventDate: eventDate,
      recipientAddress: recipientAddress,
      withDemoItems: withDemoItems,
    );
    _reload();
    notifyListeners();
    return list;
  }

  Future<void> deleteList(String id) async {
    await _store.deleteList(id);
    _reload();
    notifyListeners();
  }

  Future<void> publishList(String id) async {
    await _store.publishList(id);
    _reload();
    notifyListeners();
  }

  Future<void> updateAddress(String id, String address) async {
    await _store.updateList(id, (l) => l.copyWith(recipientAddress: address));
    _reload();
    notifyListeners();
  }

  Future<void> addItem({
    required String listId,
    required String title,
    double? price,
    String? url,
    String? notes,
  }) async {
    await _store.addItem(
      listId,
      GiftItem(
        id: 'gift_${const Uuid().v4().substring(0, 8)}',
        title: title,
        price: price,
        url: url,
        notes: notes,
      ),
    );
    _reload();
    notifyListeners();
  }

  Future<void> removeItem(String listId, String itemId) async {
    await _store.removeItem(listId, itemId);
    _reload();
    notifyListeners();
  }

  Future<void> claimItem(
    String listId,
    String itemId,
    ShipPreference ship,
  ) async {
    await _store.claimItem(listId, itemId, ship);
    _reload();
    notifyListeners();
  }

  GivyList? listById(String id) => _store.listById(id);
  GivyList? listByShare(String code) => _store.listByShareCode(code);

  Future<void> createGiveaway({
    required String title,
    required String description,
    required String itemName,
    required String area,
    required String endsAt,
  }) async {
    if (user == null) return;
    await _store.createGiveaway(
      owner: user!,
      title: title,
      description: description,
      itemName: itemName,
      area: area,
      endsAt: endsAt,
    );
    _reload();
    notifyListeners();
  }

  Future<void> joinGiveaway(String id) async {
    if (user == null) return;
    await _store.joinGiveaway(id, user!.id);
    _reload();
    notifyListeners();
  }

  Future<void> drawGiveaway(String id) async {
    if (user == null) return;
    await _store.drawGiveaway(id, user!.id);
    _reload();
    notifyListeners();
  }
}
