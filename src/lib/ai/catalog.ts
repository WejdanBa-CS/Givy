import type { Occasion } from "@/lib/types";

export type CuratedGift = {
  title: string;
  notes?: string;
  priceHint?: number;
  why?: string;
};

export const CURATED_GIFT_SUGGESTIONS: Record<Occasion, CuratedGift[]> = {
  birthday: [
    {
      title: "Personalized star map print",
      notes: "Night sky from a meaningful date",
      priceHint: 45,
      why: "Keepsake with a story",
    },
    {
      title: "Small-batch coffee tasting set",
      notes: "Three origin bags + tasting card",
      priceHint: 38,
      why: "Everyday ritual upgrade",
    },
    {
      title: "Compact travel journal + fountain pen",
      notes: "Softcover, A6 size",
      priceHint: 42,
      why: "Quiet creative gift",
    },
    {
      title: "Indoor herb grow kit",
      notes: "Basil, mint, and chives",
      priceHint: 32,
      why: "Useful and a little playful",
    },
    {
      title: "Wireless earbuds case in leather",
      notes: "Monogram optional",
      priceHint: 28,
      why: "Practical everyday accessory",
    },
    {
      title: "Board-game night duo pack",
      notes: "Two quick 20-minute games",
      priceHint: 55,
      why: "Shared experience over stuff",
    },
  ],
  wedding: [
    {
      title: "Linen table runner set",
      notes: "Natural flax, washable",
      priceHint: 60,
      why: "Home they will actually use",
    },
    {
      title: "Couples cooking class voucher",
      notes: "Local studio or online kit",
      priceHint: 120,
      why: "Memory over more registry clutter",
    },
    {
      title: "Artisan cheese + honey board kit",
      notes: "Ready for a quiet evening in",
      priceHint: 48,
      why: "Celebrate without another appliance",
    },
    {
      title: "Framed first-home map print",
      notes: "Neighborhood they just moved to",
      priceHint: 55,
      why: "Personal and displayable",
    },
    {
      title: "Quality kitchen towel + soap set",
      notes: "Elevated everyday linens",
      priceHint: 35,
      why: "Registry gap filler that feels thoughtful",
    },
    {
      title: "Weekend picnic backpack",
      notes: "Blankets and utensils included",
      priceHint: 75,
      why: "Date-night ready",
    },
  ],
  holiday: [
    {
      title: "Spiced cocoa + mug duo",
      notes: "Ceramic mugs with mix sachets",
      priceHint: 36,
      why: "Cozy without being generic",
    },
    {
      title: "Wool throw in a deep color",
      notes: "Not white — forest or rust",
      priceHint: 68,
      why: "Useful through winter",
    },
    {
      title: "Ornament they can hang every year",
      notes: "Hand-blown or ceramic, dated",
      priceHint: 24,
      why: "Tradition starter",
    },
    {
      title: "Puzzle of a favorite city skyline",
      notes: "500–1000 pieces",
      priceHint: 30,
      why: "Quiet holiday afternoon activity",
    },
    {
      title: "Candle trio with seasonal scents",
      notes: "Soy wax, travel tins",
      priceHint: 40,
      why: "Atmosphere gift",
    },
    {
      title: "Hot toddy / mulled wine spice kit",
      notes: "Reusable spice sachets",
      priceHint: 22,
      why: "Entertaining-ready",
    },
  ],
  baby: [
    {
      title: "Organic swaddle set (3)",
      notes: "Breathable muslin, neutral tones",
      priceHint: 45,
      why: "Parents always need more",
    },
    {
      title: "White-noise travel machine",
      notes: "Compact, USB-C",
      priceHint: 40,
      why: "Sleep helper on the go",
    },
    {
      title: "Board book bundle (favorites)",
      notes: "3 sturdy classics",
      priceHint: 28,
      why: "Screen-free bonding",
    },
    {
      title: "Meal-train grocery gift card",
      notes: "Local market or delivery service",
      priceHint: 75,
      why: "Practical kindness",
    },
    {
      title: "Soft knit lovey + teether set",
      notes: "Machine washable",
      priceHint: 32,
      why: "Daily comfort item",
    },
    {
      title: "Parent care kit",
      notes: "Lip balm, hand cream, eye mask",
      priceHint: 35,
      why: "Gift for the grown-ups too",
    },
  ],
  graduation: [
    {
      title: "Leather folio for interviews",
      notes: "Slim padfolio with card slots",
      priceHint: 55,
      why: "Career-ready without flash",
    },
    {
      title: "Noise-cancelling over-ears (budget)",
      notes: "Solid mid-range model",
      priceHint: 89,
      why: "Study / commute upgrade",
    },
    {
      title: "Desk plant + ceramic planter",
      notes: "Low-light friendly",
      priceHint: 30,
      why: "First apartment energy",
    },
    {
      title: "Quality pen + notebook set",
      notes: "Refillable ink",
      priceHint: 42,
      why: "Classic milestone gift",
    },
    {
      title: "City discovery day pass",
      notes: "Museum or transit day ticket",
      priceHint: 50,
      why: "Celebrate with an outing",
    },
    {
      title: "Portable power bank (high capacity)",
      notes: "USB-C PD",
      priceHint: 45,
      why: "Useful from day one",
    },
  ],
  creator: [
    {
      title: "Softbox lighting kit (desk size)",
      notes: "Daylight bulbs included",
      priceHint: 65,
      why: "Instant production upgrade",
    },
    {
      title: "Shotgun mic for phone / camera",
      notes: "With deadcat windscreen",
      priceHint: 79,
      why: "Audio matters more than gear flex",
    },
    {
      title: "Color-calibrated monitor hood",
      notes: "Fits 24–27″ screens",
      priceHint: 38,
      why: "Editing comfort",
    },
    {
      title: "Cable management + desk mat set",
      notes: "Felt mat + adhesive clips",
      priceHint: 34,
      why: "Cleaner setup on camera",
    },
    {
      title: "Thumbnail / brand style swatch book",
      notes: "Printed color references",
      priceHint: 28,
      why: "Creative workflow gift",
    },
    {
      title: "Portable SSD (1TB)",
      notes: "USB-C, bus powered",
      priceHint: 95,
      why: "Storage always fills up",
    },
  ],
  other: [
    {
      title: "Unexpected bookstore gift card",
      notes: "Independent shop if possible",
      priceHint: 40,
      why: "Lets them choose the joy",
    },
    {
      title: "Weekend hiking daypack",
      notes: "Lightweight, water bottle pocket",
      priceHint: 58,
      why: "Adventure-ready",
    },
    {
      title: "Ceramic pour-over set",
      notes: "Dripper + two cups",
      priceHint: 48,
      why: "Morning ritual upgrade",
    },
    {
      title: "Vinyl of a shared favorite album",
      notes: "Or a rediscovered classic",
      priceHint: 35,
      why: "Nostalgia with presence",
    },
    {
      title: "Quality socks + candle pairing",
      notes: "Not boring — bold pattern + scent",
      priceHint: 32,
      why: "Small but considered",
    },
    {
      title: "Experience: pottery or painting night",
      notes: "Local studio voucher",
      priceHint: 70,
      why: "Memory over more shelf clutter",
    },
  ],
};

/** Shopper categories for the AI recommendation engine. */
export const GIFT_CATEGORIES = [
  "tech",
  "home",
  "fashion",
  "food",
  "experience",
  "wellness",
  "books",
  "kids",
  "outdoor",
  "other",
] as const;

export type GiftCategory = (typeof GIFT_CATEGORIES)[number];

export const GIFT_CATEGORY_LABELS: Record<GiftCategory, string> = {
  tech: "Tech & gadgets",
  home: "Home & living",
  fashion: "Fashion & accessories",
  food: "Food & drink",
  experience: "Experiences",
  wellness: "Wellness & self-care",
  books: "Books & stationery",
  kids: "Kids & baby",
  outdoor: "Outdoor & sport",
  other: "Other",
};
export type CatalogItem = {
  id: string;
  title: string;
  category: GiftCategory;
  price: number;
  search_keyword: string;
  blurb: string;
  /** Placeholder for future affiliate / merchant URL */
  product_url?: string;
};

/** Seed catalog — swap for DB / affiliate API later. */
export const GIFT_CATALOG: CatalogItem[] = [
  {
    id: "tech-earbuds",
    title: "Noise-cancelling wireless earbuds",
    category: "tech",
    price: 89,
    search_keyword: "wireless noise cancelling earbuds",
    blurb: "Daily-driver audio without the cable tangle.",
  },
  {
    id: "tech-charger",
    title: "Compact GaN USB-C charger (65W)",
    category: "tech",
    price: 42,
    search_keyword: "65W GaN USB-C charger",
    blurb: "One brick for laptop + phone on the go.",
  },
  {
    id: "tech-stand",
    title: "Adjustable aluminum laptop stand",
    category: "tech",
    price: 55,
    search_keyword: "aluminum laptop stand adjustable",
    blurb: "Clean desk posture upgrade.",
  },
  {
    id: "home-candle",
    title: "Soy candle 3-pack (seasonal scents)",
    category: "home",
    price: 36,
    search_keyword: "soy candle gift set 3 pack",
    blurb: "Warm ambience without synthetic overload.",
  },
  {
    id: "home-throw",
    title: "Chunky knit throw blanket",
    category: "home",
    price: 68,
    search_keyword: "chunky knit throw blanket",
    blurb: "Couch-ready comfort for slow evenings.",
  },
  {
    id: "home-mug",
    title: "Handmade ceramic mug set (2)",
    category: "home",
    price: 48,
    search_keyword: "handmade ceramic mug set of 2",
    blurb: "Artisan feel for morning coffee.",
  },
  {
    id: "fashion-scarf",
    title: "Merino wool scarf",
    category: "fashion",
    price: 58,
    search_keyword: "merino wool scarf unisex",
    blurb: "Lightweight warmth that looks intentional.",
  },
  {
    id: "fashion-bag",
    title: "Structured crossbody bag",
    category: "fashion",
    price: 95,
    search_keyword: "leather crossbody bag everyday",
    blurb: "Hands-free carry for city days.",
  },
  {
    id: "food-coffee",
    title: "Specialty coffee subscription (3 months)",
    category: "food",
    price: 72,
    search_keyword: "specialty coffee subscription 3 month",
    blurb: "Fresh beans without the guessing.",
  },
  {
    id: "food-olive",
    title: "Extra-virgin olive oil tasting trio",
    category: "food",
    price: 45,
    search_keyword: "olive oil tasting gift set",
    blurb: "Kitchen upgrade they will actually use.",
  },
  {
    id: "exp-class",
    title: "Local cooking class voucher",
    category: "experience",
    price: 85,
    search_keyword: "cooking class gift voucher near me",
    blurb: "A memory instead of more clutter.",
  },
  {
    id: "exp-spa",
    title: "Spa massage gift certificate",
    category: "experience",
    price: 120,
    search_keyword: "spa massage gift certificate",
    blurb: "Reset day, fully booked for them.",
  },
  {
    id: "well-diffuser",
    title: "Ultrasonic essential oil diffuser",
    category: "wellness",
    price: 40,
    search_keyword: "ultrasonic essential oil diffuser",
    blurb: "Calm evenings with a soft glow.",
  },
  {
    id: "well-mat",
    title: "Cork yoga mat + strap",
    category: "wellness",
    price: 78,
    search_keyword: "cork yoga mat with strap",
    blurb: "Grip that improves with practice.",
  },
  {
    id: "books-novel",
    title: "Hardcover novel + reading light",
    category: "books",
    price: 38,
    search_keyword: "hardcover bestseller and book light",
    blurb: "Tonight’s chapter, no squinting.",
  },
  {
    id: "books-journal",
    title: "Linen-bound journal + fountain pen",
    category: "books",
    price: 52,
    search_keyword: "linen journal fountain pen set",
    blurb: "For lists, sketches, and quiet thoughts.",
  },
  {
    id: "kids-blocks",
    title: "Wooden building block set",
    category: "kids",
    price: 44,
    search_keyword: "wooden building blocks toddler set",
    blurb: "Open-ended play that lasts years.",
  },
  {
    id: "kids-soft",
    title: "Organic cotton soft toy",
    category: "kids",
    price: 32,
    search_keyword: "organic cotton soft toy baby",
    blurb: "Soft, washable, gift-wrap ready.",
  },
  {
    id: "out-bottle",
    title: "Insulated trail bottle 32oz",
    category: "outdoor",
    price: 40,
    search_keyword: "insulated stainless water bottle 32oz",
    blurb: "Hikes and desk days covered.",
  },
  {
    id: "out-hammock",
    title: "Portable camping hammock",
    category: "outdoor",
    price: 65,
    search_keyword: "portable camping hammock with straps",
    blurb: "Shade + swing wherever trees allow.",
  },
  {
    id: "other-frame",
    title: "Custom photo print + frame",
    category: "other",
    price: 49,
    search_keyword: "custom photo print framed gift",
    blurb: "Personal without being cheesy.",
  },
  {
    id: "other-puzzle",
    title: "1000-piece art puzzle",
    category: "other",
    price: 28,
    search_keyword: "1000 piece art jigsaw puzzle",
    blurb: "Rainy-day table project.",
  },
];
