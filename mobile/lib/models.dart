enum Occasion { birthday, wedding, holiday, baby, graduation, other }

enum AuthProvider { google, apple, facebook }

enum ShipPreference { toGiver, toRecipient }

enum GiveawayStatus { open, drawn, closed }

class UserAccount {
  UserAccount({
    required this.id,
    required this.name,
    required this.email,
    required this.provider,
    required this.avatarHue,
  });

  final String id;
  final String name;
  final String email;
  final AuthProvider provider;
  final int avatarHue;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'provider': provider.name,
        'avatarHue': avatarHue,
      };

  factory UserAccount.fromJson(Map<String, dynamic> json) => UserAccount(
        id: json['id'] as String,
        name: json['name'] as String,
        email: json['email'] as String,
        provider: AuthProvider.values.byName(json['provider'] as String),
        avatarHue: json['avatarHue'] as int,
      );
}

class GiftItem {
  GiftItem({
    required this.id,
    required this.title,
    this.notes,
    this.url,
    this.price,
    this.imageHint,
    this.purchased = false,
    this.purchasedAt,
    this.claimedByMe = false,
    this.shipPreference,
  });

  final String id;
  final String title;
  final String? notes;
  final String? url;
  final double? price;
  final String? imageHint;
  final bool purchased;
  final String? purchasedAt;
  final bool claimedByMe;
  final ShipPreference? shipPreference;

  GiftItem copyWith({
    bool? purchased,
    String? purchasedAt,
    bool? claimedByMe,
    ShipPreference? shipPreference,
  }) {
    return GiftItem(
      id: id,
      title: title,
      notes: notes,
      url: url,
      price: price,
      imageHint: imageHint,
      purchased: purchased ?? this.purchased,
      purchasedAt: purchasedAt ?? this.purchasedAt,
      claimedByMe: claimedByMe ?? this.claimedByMe,
      shipPreference: shipPreference ?? this.shipPreference,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'notes': notes,
        'url': url,
        'price': price,
        'imageHint': imageHint,
        'purchased': purchased,
        'purchasedAt': purchasedAt,
        'claimedByMe': claimedByMe,
        'shipPreference': shipPreference?.name,
      };

  factory GiftItem.fromJson(Map<String, dynamic> json) => GiftItem(
        id: json['id'] as String,
        title: json['title'] as String,
        notes: json['notes'] as String?,
        url: json['url'] as String?,
        price: (json['price'] as num?)?.toDouble(),
        imageHint: json['imageHint'] as String?,
        purchased: json['purchased'] as bool? ?? false,
        purchasedAt: json['purchasedAt'] as String?,
        claimedByMe: json['claimedByMe'] as bool? ?? false,
        shipPreference: json['shipPreference'] == null
            ? null
            : ShipPreference.values.byName(json['shipPreference'] as String),
      );
}

class GivyList {
  GivyList({
    required this.id,
    required this.ownerId,
    required this.ownerName,
    required this.title,
    required this.occasion,
    this.description,
    required this.eventDate,
    this.recipientAddress,
    required this.shareCode,
    this.published = false,
    required this.items,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String ownerId;
  final String ownerName;
  final String title;
  final Occasion occasion;
  final String? description;
  final String eventDate;
  final String? recipientAddress;
  final String shareCode;
  final bool published;
  final List<GiftItem> items;
  final String createdAt;
  final String updatedAt;

  int get openCount => items.where((i) => !i.purchased).length;
  int get claimedCount => items.where((i) => i.purchased).length;

  GivyList copyWith({
    String? title,
    String? description,
    String? recipientAddress,
    bool? published,
    List<GiftItem>? items,
    String? updatedAt,
  }) {
    return GivyList(
      id: id,
      ownerId: ownerId,
      ownerName: ownerName,
      title: title ?? this.title,
      occasion: occasion,
      description: description ?? this.description,
      eventDate: eventDate,
      recipientAddress: recipientAddress ?? this.recipientAddress,
      shareCode: shareCode,
      published: published ?? this.published,
      items: items ?? this.items,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'ownerId': ownerId,
        'ownerName': ownerName,
        'title': title,
        'occasion': occasion.name,
        'description': description,
        'eventDate': eventDate,
        'recipientAddress': recipientAddress,
        'shareCode': shareCode,
        'published': published,
        'items': items.map((e) => e.toJson()).toList(),
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };

  factory GivyList.fromJson(Map<String, dynamic> json) => GivyList(
        id: json['id'] as String,
        ownerId: json['ownerId'] as String,
        ownerName: json['ownerName'] as String,
        title: json['title'] as String,
        occasion: Occasion.values.byName(json['occasion'] as String),
        description: json['description'] as String?,
        eventDate: json['eventDate'] as String,
        recipientAddress: json['recipientAddress'] as String?,
        shareCode: json['shareCode'] as String,
        published: json['published'] as bool? ?? false,
        items: (json['items'] as List<dynamic>)
            .map((e) => GiftItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        createdAt: json['createdAt'] as String,
        updatedAt: json['updatedAt'] as String,
      );
}

class Giveaway {
  Giveaway({
    required this.id,
    required this.ownerId,
    required this.ownerName,
    required this.title,
    required this.description,
    required this.itemName,
    required this.area,
    required this.endsAt,
    required this.status,
    required this.entrantIds,
    this.winnerId,
    this.winnerName,
    required this.createdAt,
  });

  final String id;
  final String ownerId;
  final String ownerName;
  final String title;
  final String description;
  final String itemName;
  final String area;
  final String endsAt;
  final GiveawayStatus status;
  final List<String> entrantIds;
  final String? winnerId;
  final String? winnerName;
  final String createdAt;

  Giveaway copyWith({
    GiveawayStatus? status,
    List<String>? entrantIds,
    String? winnerId,
    String? winnerName,
  }) {
    return Giveaway(
      id: id,
      ownerId: ownerId,
      ownerName: ownerName,
      title: title,
      description: description,
      itemName: itemName,
      area: area,
      endsAt: endsAt,
      status: status ?? this.status,
      entrantIds: entrantIds ?? this.entrantIds,
      winnerId: winnerId ?? this.winnerId,
      winnerName: winnerName ?? this.winnerName,
      createdAt: createdAt,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'ownerId': ownerId,
        'ownerName': ownerName,
        'title': title,
        'description': description,
        'itemName': itemName,
        'area': area,
        'endsAt': endsAt,
        'status': status.name,
        'entrantIds': entrantIds,
        'winnerId': winnerId,
        'winnerName': winnerName,
        'createdAt': createdAt,
      };

  factory Giveaway.fromJson(Map<String, dynamic> json) => Giveaway(
        id: json['id'] as String,
        ownerId: json['ownerId'] as String,
        ownerName: json['ownerName'] as String,
        title: json['title'] as String,
        description: json['description'] as String,
        itemName: json['itemName'] as String,
        area: json['area'] as String,
        endsAt: json['endsAt'] as String,
        status: GiveawayStatus.values.byName(json['status'] as String),
        entrantIds: (json['entrantIds'] as List<dynamic>).cast<String>(),
        winnerId: json['winnerId'] as String?,
        winnerName: json['winnerName'] as String?,
        createdAt: json['createdAt'] as String,
      );
}

class ActivityEvent {
  ActivityEvent({
    required this.id,
    required this.type,
    required this.message,
    required this.at,
    this.listId,
    this.giveawayId,
  });

  final String id;
  final String type;
  final String message;
  final String at;
  final String? listId;
  final String? giveawayId;

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'message': message,
        'at': at,
        'listId': listId,
        'giveawayId': giveawayId,
      };

  factory ActivityEvent.fromJson(Map<String, dynamic> json) => ActivityEvent(
        id: json['id'] as String,
        type: json['type'] as String,
        message: json['message'] as String,
        at: json['at'] as String,
        listId: json['listId'] as String?,
        giveawayId: json['giveawayId'] as String?,
      );
}

const occasionLabels = {
  Occasion.birthday: 'Birthday',
  Occasion.wedding: 'Wedding',
  Occasion.holiday: 'Holiday',
  Occasion.baby: 'Baby',
  Occasion.graduation: 'Graduation',
  Occasion.other: 'Just because',
};

const occasionEmoji = {
  Occasion.birthday: '🎂',
  Occasion.wedding: '💍',
  Occasion.holiday: '🎄',
  Occasion.baby: '🍼',
  Occasion.graduation: '🎓',
  Occasion.other: '✨',
};
