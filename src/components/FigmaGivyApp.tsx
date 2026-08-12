"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import {
  Gift,
  PartyPopper,
  Heart,
  Snowflake,
  Share2,
  Plus,
  X,
  ChevronLeft,
  Eye,
  Truck,
  Home,
  Check,
  Users,
  Sparkles,
  ArrowRight,
  Lock,
} from "lucide-react";
import { LogoMark } from "@/components/Logo";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType = "birthday" | "wedding" | "holiday" | "giveaway";
type View = "landing" | "dashboard" | "list-detail" | "public-view";

interface GiftItem {
  id: string;
  name: string;
  description: string;
  price: number | null;
  image: string;
  claimed: boolean;
  emoji: string;
}

interface GiftList {
  id: string;
  title: string;
  type: EventType;
  date: Date;
  owner: string;
  items: GiftItem[];
  sharedCount: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const BIRTHDAY_DATE = new Date("2026-09-15T18:00:00");
const WEDDING_DATE = new Date("2026-12-20T16:00:00");

const initialLists: GiftList[] = [
  {
    id: "list-1",
    title: "Jordan's Birthday Wishlist",
    type: "birthday",
    date: BIRTHDAY_DATE,
    owner: "Jordan Rivera",
    sharedCount: 23,
    items: [
      { id: "i-1", name: "New Era 59FIFTY Cap", description: "Black fitted, size 7¼", price: 42, image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&h=500&fit=crop&auto=format", claimed: true, emoji: "🧢" },
      { id: "i-2", name: "Samsung Galaxy Watch 7", description: "44mm Graphite", price: 199, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop&auto=format", claimed: false, emoji: "⌚" },
      { id: "i-3", name: "Cozy Sock Bundle", description: "12-pack assorted", price: 28, image: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=500&h=500&fit=crop&auto=format", claimed: false, emoji: "🧦" },
      { id: "i-4", name: "Amazon Gift Card", description: "$50 digital", price: 50, image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&h=500&fit=crop&auto=format", claimed: true, emoji: "💳" },
      { id: "i-5", name: "Monthly Snack Box", description: "3-month subscription", price: 35, image: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=500&h=500&fit=crop&auto=format", claimed: false, emoji: "🍿" },
      { id: "i-6", name: "Sony WH-1000XM5", description: "Noise-canceling headphones", price: 89, image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop&auto=format", claimed: false, emoji: "🎧" },
      { id: "i-7", name: "Air Max Sneakers", description: "Size 11, Red/White", price: 150, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop&auto=format", claimed: false, emoji: "👟" },
    ],
  },
  {
    id: "list-2",
    title: "Alex & Sam's Wedding",
    type: "wedding",
    date: WEDDING_DATE,
    owner: "Alex & Sam Chen",
    sharedCount: 87,
    items: [
      { id: "w-1", name: "KitchenAid Stand Mixer", description: "5-Qt Empire Red", price: 449, image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=500&fit=crop&auto=format", claimed: true, emoji: "🍳" },
      { id: "w-2", name: "Linen Duvet Set", description: "King, Natural linen", price: 220, image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500&h=500&fit=crop&auto=format", claimed: false, emoji: "🛏️" },
      { id: "w-3", name: "Honeymoon Fund", description: "Help us get to Santorini!", price: null, image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=500&h=500&fit=crop&auto=format", claimed: false, emoji: "✈️" },
    ],
  },
];

// ─── Countdown ────────────────────────────────────────────────────────────────

function useCountdown(target: Date) {
  const calc = useCallback(() => {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0 };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      mins: Math.floor((diff % 3600000) / 60000),
      secs: Math.floor((diff % 60000) / 1000),
    };
  }, [target]);
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return time;
}

// ─── Event config ─────────────────────────────────────────────────────────────

const EVENT_CFG: Record<EventType, { label: string; icon: ReactNode; bg: string; text: string; dot: string }> = {
  birthday: { label: "Birthday", icon: <PartyPopper size={13} />, bg: "#FFF0E6", text: "#E8391E", dot: "#E8391E" },
  wedding:  { label: "Wedding",  icon: <Heart size={13} />,        bg: "#FFF6E0", text: "#C9840A", dot: "#FFCD3C" },
  holiday:  { label: "Holiday",  icon: <Snowflake size={13} />,    bg: "#EEF5FF", text: "#2265C3", dot: "#7AB3E0" },
  giveaway: { label: "Giveaway", icon: <Gift size={13} />,         bg: "#F0FAF0", text: "#2A7A2A", dot: "#9DC88D" },
};

function EventBadge({ type }: { type: EventType }) {
  const c = EVENT_CFG[type];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
      style={{ background: c.bg, color: c.text }}
    >
      {c.icon}{c.label}
    </span>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function NavBar({ onBack, isPublic, showUser }: { onBack?: () => void; isPublic?: boolean; showUser?: boolean }) {
  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-[#FEF6EE]/90 backdrop-blur-md border-b border-[#E8D9CC]">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5EDE4] transition-colors">
            <ChevronLeft size={18} className="text-[#8A6F5E]" />
          </button>
        )}
        <span className="inline-flex items-center gap-2.5">
          <LogoMark size={28} />
          <span className="text-xl font-black tracking-tight" style={{ fontFamily: "'Fraunces', serif", color: "#1C1108" }}>
            Givy
          </span>
        </span>
        {isPublic && (
          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold" style={{ background: "#FFCD3C", color: "#1C1108" }}>
            Friend View
          </span>
        )}
      </div>
      {showUser && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black bg-[#E8391E] text-white">
          JR
        </div>
      )}
    </nav>
  );
}

// ─── Purchase Modal ───────────────────────────────────────────────────────────

function PurchaseModal({ item, listOwner, onClose, onClaim }: {
  item: GiftItem; listOwner: string; onClose: () => void; onClaim: () => void;
}) {
  const [choice, setChoice] = useState<"me" | "them" | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const firstName = listOwner.split(" ")[0];

  function confirm() {
    setConfirmed(true);
    setTimeout(() => { onClaim(); onClose(); toast.success("You're all set — your name stays private 🔒"); }, 800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(28,17,8,0.5)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-md bg-white rounded-3xl p-6 relative shadow-2xl" style={{ border: "2px solid #E8D9CC" }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5EDE4] transition-colors">
          <X size={15} className="text-[#8A6F5E]" />
        </button>

        <div className="flex gap-4 mb-6">
          <img src={item.image} alt={item.name} className="w-16 h-16 rounded-2xl object-cover bg-[#F5EDE4]" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#8A6F5E] font-semibold mb-1">A gift for {firstName}</p>
            <h3 className="font-black text-lg leading-tight text-[#1C1108] truncate" style={{ fontFamily: "'Fraunces', serif" }}>{item.name}</h3>
            {item.price && <p className="text-sm font-bold mt-0.5 text-[#E8391E]">${item.price}</p>}
          </div>
        </div>

        <p className="text-sm font-semibold text-[#1C1108] mb-3">Where should it ship?</p>
        <div className="flex flex-col gap-2.5 mb-5">
          {[
            { key: "me" as const, Icon: Home, title: "Ship to me", sub: "I'll wrap it and give it in person" },
            { key: "them" as const, Icon: Truck, title: `Ship to ${firstName}`, sub: "Delivered straight to their door" },
          ].map(({ key, Icon, title, sub }) => (
            <button
              key={key}
              onClick={() => setChoice(key)}
              className="flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all"
              style={{ borderColor: choice === key ? "#E8391E" : "#E8D9CC", background: choice === key ? "#FFF0E6" : "#FAFAF7" }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: choice === key ? "#E8391E" : "#F5EDE4" }}>
                <Icon size={16} style={{ color: choice === key ? "#fff" : "#8A6F5E" }} />
              </div>
              <div>
                <p className="font-bold text-sm text-[#1C1108]">{title}</p>
                <p className="text-xs text-[#8A6F5E] mt-0.5">{sub}</p>
              </div>
            </button>
          ))}
        </div>

        <button
          disabled={!choice || confirmed}
          onClick={confirm}
          className="w-full py-3.5 rounded-2xl font-black text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: "#E8391E", color: "#fff" }}
        >
          {confirmed ? <><Check size={15} /> Claimed!</> : "Confirm claim"}
        </button>
        <p className="text-center text-xs text-[#8A6F5E] mt-3 flex items-center justify-center gap-1">
          <Lock size={11} /> Private — {firstName} won&apos;t see who claimed it
        </p>
      </div>
    </div>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (l: GiftList) => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("birthday");
  const [date, setDate] = useState("");

  const types: { key: EventType; emoji: string; label: string }[] = [
    { key: "birthday", emoji: "🎂", label: "Birthday" },
    { key: "wedding",  emoji: "💍", label: "Wedding" },
    { key: "holiday",  emoji: "🎄", label: "Holiday" },
    { key: "giveaway", emoji: "🎁", label: "Giveaway" },
  ];

  function create() {
    if (!title || !date) return;
    onCreate({ id: `list-${Date.now()}`, title, type, date: new Date(date), owner: "Jordan Rivera", sharedCount: 0, items: [] });
    toast.success(`“${title}” is ready — add a few gift ideas`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(28,17,8,0.5)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-md bg-white rounded-3xl p-6 relative shadow-2xl" style={{ border: "2px solid #E8D9CC" }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5EDE4] transition-colors">
          <X size={15} className="text-[#8A6F5E]" />
        </button>

        <h2 className="text-2xl font-black mb-1 text-[#1C1108]" style={{ fontFamily: "'Fraunces', serif" }}>New wishlist</h2>
        <p className="text-sm text-[#8A6F5E] mb-6">Name it, set the date, then invite friends.</p>

        <p className="text-xs font-black uppercase tracking-widest text-[#8A6F5E] mb-3">Occasion</p>
        <div className="grid grid-cols-4 gap-2 mb-5">
          {types.map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 text-xs font-bold transition-all"
              style={{ borderColor: type === t.key ? "#E8391E" : "#E8D9CC", background: type === t.key ? "#FFF0E6" : "#FAFAF7", color: type === t.key ? "#E8391E" : "#8A6F5E" }}
            >
              <span className="text-xl">{t.emoji}</span>{t.label}
            </button>
          ))}
        </div>

        <p className="text-xs font-black uppercase tracking-widest text-[#8A6F5E] mb-2">List name</p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Jordan's 30th birthday"
          className="w-full px-4 py-3 rounded-2xl text-sm border-2 outline-none transition-all mb-4 placeholder:text-[#C4AFA5]"
          style={{ borderColor: "#E8D9CC", background: "#FAFAF7", color: "#1C1108" }}
        />

        <p className="text-xs font-black uppercase tracking-widest text-[#8A6F5E] mb-2">Event date</p>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl text-sm border-2 outline-none transition-all mb-5"
          style={{ borderColor: "#E8D9CC", background: "#FAFAF7", color: "#1C1108", colorScheme: "light" }}
        />

        <button
          disabled={!title || !date}
          onClick={create}
          className="w-full py-3.5 rounded-2xl font-black text-sm disabled:opacity-40 transition-all hover:opacity-90"
          style={{ background: "#E8391E", color: "#fff" }}
        >
          Create wishlist
        </button>
      </div>
    </div>
  );
}

// ─── Add Item Form ────────────────────────────────────────────────────────────

function AddItemForm({ onAdd }: { onAdd: (i: GiftItem) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");

  function add() {
    if (!name) return;
    onAdd({ id: `item-${Date.now()}`, name, description: desc, price: price ? parseFloat(price) : null, image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=500&h=500&fit=crop&auto=format", claimed: false, emoji: "🎁" });
    setName(""); setPrice(""); setDesc(""); setOpen(false);
    toast.success(`Added “${name}”`);
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border-2 border-dashed text-sm font-bold transition-all hover:bg-[#F5EDE4] text-[#8A6F5E]"
      style={{ borderColor: "#E8D9CC" }}
    >
      <Plus size={16} /> Add a gift
    </button>
  );

  return (
    <div className="bg-white rounded-2xl border-2 p-5" style={{ borderColor: "#E8D9CC" }}>
      <div className="flex items-center justify-between mb-4">
        <p className="font-black text-sm text-[#1C1108]">New gift idea</p>
        <button onClick={() => setOpen(false)}><X size={14} className="text-[#8A6F5E]" /></button>
      </div>
      <div className="flex flex-col gap-3">
        {[
          { val: name, set: setName, ph: "Gift name" },
          { val: desc, set: setDesc, ph: "Size, color, link, or notes" },
        ].map((f, i) => (
          <input
            key={i}
            value={f.val}
            onChange={(e) => f.set(e.target.value)}
            placeholder={f.ph}
            className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none placeholder:text-[#C4AFA5]"
            style={{ borderColor: "#E8D9CC", background: "#FAFAF7", color: "#1C1108" }}
          />
        ))}
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price (optional)"
          type="number"
          className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none placeholder:text-[#C4AFA5]"
          style={{ borderColor: "#E8D9CC", background: "#FAFAF7", color: "#1C1108" }}
        />
        <button disabled={!name} onClick={add} className="py-2.5 rounded-xl font-black text-sm disabled:opacity-40" style={{ background: "#E8391E", color: "#fff" }}>
          Add to list
        </button>
      </div>
    </div>
  );
}

// ─── Gift Card ────────────────────────────────────────────────────────────────

function GiftCard({ item, isOwner, onClaim }: { item: GiftItem; isOwner: boolean; onClaim?: (i: GiftItem) => void }) {
  return (
    <div
      className={`relative bg-white rounded-2xl overflow-hidden border-2 transition-all ${item.claimed ? "opacity-60" : "hover:shadow-md hover:-translate-y-0.5"}`}
      style={{ borderColor: item.claimed ? "#E8D9CC" : "#E8D9CC" }}
    >
      {item.claimed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: "rgba(254,246,238,0.75)", backdropFilter: "blur(2px)" }}>
          <div className="flex flex-col items-center gap-1 bg-white rounded-2xl px-4 py-2.5 shadow-sm border" style={{ borderColor: "#E8D9CC" }}>
            <Check size={18} className="text-[#9DC88D]" />
            <span className="text-xs font-black text-[#1C1108]">Claimed</span>
          </div>
        </div>
      )}
      <div className="relative overflow-hidden">
        <img src={item.image} alt={item.name} className="w-full h-36 object-cover bg-[#F5EDE4]" />
        <span className="absolute top-2.5 left-2.5 text-lg bg-white/90 rounded-xl px-1.5 py-0.5 shadow-sm">{item.emoji}</span>
        {item.price && (
          <span className="absolute bottom-2.5 right-2.5 text-xs font-black px-2 py-1 rounded-xl bg-[#FFCD3C] text-[#1C1108]">
            ${item.price}
          </span>
        )}
      </div>
      <div className="p-3.5">
        <h3 className={`font-black text-sm leading-tight text-[#1C1108] mb-1 ${item.claimed ? "line-through text-[#8A6F5E]" : ""}`} style={{ fontFamily: "'Fraunces', serif" }}>
          {item.name}
        </h3>
        {item.description && <p className="text-xs text-[#8A6F5E] mb-3">{item.description}</p>}
        {!isOwner && !item.claimed && onClaim && (
          <button
            onClick={() => onClaim(item)}
            className="w-full py-2 rounded-xl text-xs font-black transition-all hover:opacity-90 active:scale-95"
            style={{ background: "#E8391E", color: "#fff" }}
          >
            Claim this gift
          </button>
        )}
        {isOwner && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: item.claimed ? "#9DC88D" : "#E8D9CC" }} />
            <span className="text-xs font-semibold" style={{ color: item.claimed ? "#2A7A2A" : "#8A6F5E" }}>
              {item.claimed ? "Taken" : "Open"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Countdown display ────────────────────────────────────────────────────────

function CountdownDisplay({ date }: { date: Date }) {
  const { days, hours, mins, secs } = useCountdown(date);
  const units = [{ v: days, l: "days" }, { v: hours, l: "hrs" }, { v: mins, l: "min" }, { v: secs, l: "sec" }];
  return (
    <div className="flex items-center gap-3">
      {units.map((u, i) => (
        <div key={u.l} className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-black tabular-nums leading-none text-[#E8391E]" style={{ fontFamily: "'Fraunces', serif" }}>
              {String(u.v).padStart(2, "0")}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8A6F5E] mt-1">{u.l}</span>
          </div>
          {i < 3 && <span className="text-2xl font-black text-[#E8D9CC] mb-3">:</span>}
        </div>
      ))}
    </div>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────

function Landing({
  onEnter,
  onGetStarted,
}: {
  onEnter: () => void;
  onGetStarted: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#FEF6EE]">
      <NavBar />

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-6 bg-[#FFCD3C] text-[#1C1108]">
              <Sparkles size={11} /> Wishlists, done right
            </span>
            <h1 className="font-black leading-[1.05] mb-5 text-[#1C1108]" style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(2.8rem, 6vw, 4.5rem)" }}>
              Gifts they&apos;ll actually{" "}
              <span className="italic" style={{ color: "#E8391E" }}>love.</span>
            </h1>
            <p className="text-lg text-[#8A6F5E] leading-relaxed mb-8 max-w-md">
              Build a list. Share one link. Friends claim gifts in private — so nobody buys the same thing twice.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onGetStarted}
                className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-sm transition-all hover:opacity-90 hover:scale-[1.02] active:scale-100"
                style={{ background: "#E8391E", color: "#fff" }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/><path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/><path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/></svg>
                Get started free
                <ArrowRight size={16} />
              </button>
              <button
                onClick={onEnter}
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-sm transition-all hover:bg-[#F5EDE4] border-2 border-[#E8D9CC] text-[#1C1108]"
              >
                See how it works
              </button>
            </div>
            <div className="flex items-center gap-6 mt-8">
              {[
                { n: "10k+", l: "lists shared" },
                { n: "98%", l: "no duplicates" },
                { n: "Free", l: "to start" },
              ].map((s) => (
                <div key={s.l}>
                  <p className="font-black text-lg text-[#1C1108]" style={{ fontFamily: "'Fraunces', serif" }}>{s.n}</p>
                  <p className="text-xs text-[#8A6F5E]">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mock card stack */}
          <div className="relative h-80 lg:h-auto hidden lg:block">
            <div className="absolute top-4 right-8 rotate-3 w-48 bg-white rounded-3xl border-2 border-[#E8D9CC] p-4 shadow-lg">
              <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=200&fit=crop&auto=format" className="w-full h-28 object-cover rounded-xl mb-3 bg-[#F5EDE4]" alt="Sneakers" />
              <p className="font-black text-xs text-[#1C1108]" style={{ fontFamily: "'Fraunces', serif" }}>Air Max Sneakers</p>
              <p className="text-xs text-[#8A6F5E]">$150</p>
              <div className="mt-2.5 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#9DC88D]" />
                <span className="text-xs font-bold text-[#2A7A2A]">Open</span>
              </div>
            </div>
            <div className="absolute top-20 left-4 -rotate-2 w-44 bg-white rounded-3xl border-2 border-[#E8D9CC] p-4 shadow-lg">
              <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop&auto=format" className="w-full h-24 object-cover rounded-xl mb-3 bg-[#F5EDE4]" alt="Watch" />
              <p className="font-black text-xs text-[#1C1108]" style={{ fontFamily: "'Fraunces', serif" }}>Galaxy Watch 7</p>
              <p className="text-xs text-[#8A6F5E]">$199</p>
              <div className="mt-2.5 w-full py-1.5 rounded-xl bg-[#FFF0E6] text-center">
                <span className="text-xs font-black text-[#E8391E]">Claim this gift</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-2 rotate-1 w-44 bg-[#FFCD3C] rounded-3xl border-2 border-[#E8D9CC] p-4 shadow-lg">
              <p className="text-xs font-black uppercase tracking-widest text-[#1C1108] mb-1">Jordan's Birthday</p>
              <p className="text-2xl font-black text-[#1C1108]" style={{ fontFamily: "'Fraunces', serif" }}>34<span className="text-base"> days</span></p>
              <p className="text-xs text-[#1C1108]/60 mt-1">Sept 15, 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white border-y-2 border-[#E8D9CC] py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-black uppercase tracking-widest text-[#8A6F5E] text-center mb-8">How it works</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { n: "01", emoji: "✏️", title: "Make your list", body: "Add gifts with a price, notes, or a product link." },
              { n: "02", emoji: "🔗", title: "Share one link", body: "Send it to friends and family — any chat, any app." },
              { n: "03", emoji: "🤫", title: "They claim in private", body: "Each gift can only be claimed once. You never see who bought what." },
            ].map((s) => (
              <div key={s.n} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-[#E8D9CC]">{s.n}</span>
                  <span className="text-2xl">{s.emoji}</span>
                </div>
                <h3 className="font-black text-lg text-[#1C1108]" style={{ fontFamily: "'Fraunces', serif" }}>{s.title}</h3>
                <p className="text-sm text-[#8A6F5E] leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Occasion types */}
      <div className="max-w-4xl mx-auto px-6 py-14">
        <p className="text-xs font-black uppercase tracking-widest text-[#8A6F5E] mb-6">Works for any occasion</p>
        <div className="flex flex-wrap gap-3">
          {[
            { emoji: "🎂", label: "Birthdays" }, { emoji: "💍", label: "Weddings" },
            { emoji: "🎄", label: "Holidays" }, { emoji: "🎁", label: "Giveaways" },
            { emoji: "👶", label: "Baby showers" }, { emoji: "🎓", label: "Graduations" },
            { emoji: "🏠", label: "Housewarmings" }, { emoji: "💝", label: "Just because" },
          ].map((o) => (
            <div key={o.label} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border-2 border-[#E8D9CC] text-sm font-bold text-[#1C1108]">
              <span>{o.emoji}</span> {o.label}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#E8391E] py-16 px-6 text-center">
        <h2 className="text-4xl font-black text-white mb-4 italic" style={{ fontFamily: "'Fraunces', serif" }}>Ready when they are.</h2>
        <p className="text-white/80 mb-8 text-lg">Start a free wishlist in under a minute.</p>
        <button onClick={onGetStarted} className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-sm bg-[#FFCD3C] text-[#1C1108] hover:opacity-90 transition-all hover:scale-[1.02]">
          Start your list <ArrowRight size={16} />
        </button>
      </div>

      <footer className="text-center py-6 text-xs text-[#8A6F5E]">
        © 2026 Givy — gifts without the guesswork
      </footer>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function DashboardListRow({ list, onSelect }: { list: GiftList; onSelect: (l: GiftList) => void }) {
  const { days } = useCountdown(list.date);
  const claimed = list.items.filter((i) => i.claimed).length;
  const total = list.items.length;
  const cfg = EVENT_CFG[list.type];
  return (
    <button
      onClick={() => onSelect(list)}
      className="text-left bg-white rounded-2xl border-2 border-[#E8D9CC] p-5 transition-all hover:border-[#E8391E]/50 hover:shadow-md group"
    >
      <div className="flex items-start justify-between mb-3">
        <EventBadge type={list.type} />
        <div className="flex items-center gap-1.5 text-xs font-black" style={{ color: cfg.text }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: cfg.dot }} />
          {days}d away
        </div>
      </div>
      <h3 className="text-xl font-black text-[#1C1108] mb-1" style={{ fontFamily: "'Fraunces', serif" }}>{list.title}</h3>
      <p className="text-sm text-[#8A6F5E] mb-4">
        {list.date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        {" · "}<Users size={11} className="inline" /> {list.sharedCount} viewing
      </p>
      {total > 0 && (
        <>
          <div className="flex justify-between text-xs font-semibold mb-1.5 text-[#8A6F5E]">
            <span>{claimed} of {total} claimed</span>
            <span style={{ color: "#2A7A2A" }}>{Math.round((claimed / total) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#F5EDE4] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#E8391E] transition-all"
              style={{ width: `${(claimed / total) * 100}%` }}
            />
          </div>
        </>
      )}
    </button>
  );
}

function Dashboard({ lists, onSelect, onNew }: { lists: GiftList[]; onSelect: (l: GiftList) => void; onNew: () => void }) {
  const totalClaimed = lists.flatMap((l) => l.items).filter((i) => i.claimed).length;
  const totalViewers = lists.reduce((a, l) => a + l.sharedCount, 0);

  return (
    <div className="min-h-screen bg-[#FEF6EE]">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-sm text-[#8A6F5E] font-semibold">Welcome back,</p>
            <h1 className="text-3xl font-black text-[#1C1108]" style={{ fontFamily: "'Fraunces', serif" }}>Jordan Rivera</h1>
          </div>
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-sm transition-all hover:opacity-90 hover:scale-[1.02] bg-[#E8391E] text-white"
          >
            <Plus size={15} /> New list
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 my-8">
          {[
            { label: "Your lists", value: lists.length },
            { label: "Gifts claimed", value: totalClaimed },
            { label: "People viewing", value: totalViewers },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border-2 border-[#E8D9CC]">
              <p className="text-2xl font-black text-[#1C1108] mb-1" style={{ fontFamily: "'Fraunces', serif" }}>{s.value}</p>
              <p className="text-xs text-[#8A6F5E] font-semibold">{s.label}</p>
            </div>
          ))}
        </div>

        <p className="text-xs font-black uppercase tracking-widest text-[#8A6F5E] mb-4">Your lists</p>
        <div className="flex flex-col gap-3">
          {lists.map((list) => (
            <DashboardListRow key={list.id} list={list} onSelect={onSelect} />
          ))}
          <button
            onClick={onNew}
            className="flex items-center justify-center gap-2 py-7 rounded-2xl border-2 border-dashed border-[#E8D9CC] text-sm font-bold text-[#8A6F5E] hover:bg-[#F5EDE4] transition-all"
          >
            <Plus size={16} /> Start another list
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── List Detail ──────────────────────────────────────────────────────────────

function ListDetail({ list, onUpdate, onPublicView }: { list: GiftList; onUpdate: (l: GiftList) => void; onPublicView: () => void }) {
  const claimed = list.items.filter((i) => i.claimed).length;
  const available = list.items.filter((i) => !i.claimed).length;

  function share() {
    toast.success("Link copied — ready to share");
  }

  return (
    <div className="min-h-screen bg-[#FEF6EE]">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <EventBadge type={list.type} />
            <h1 className="text-3xl font-black text-[#1C1108] mt-3 mb-1.5" style={{ fontFamily: "'Fraunces', serif" }}>{list.title}</h1>
            <p className="text-sm text-[#8A6F5E]">
              {list.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onPublicView}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border-2 border-[#E8D9CC] text-[#8A6F5E] hover:bg-[#F5EDE4] transition-all"
            >
              <Eye size={13} /> Friend View
            </button>
            <button
              onClick={share}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#E8391E] text-white hover:opacity-90 transition-all"
            >
              <Share2 size={13} /> Share
            </button>
          </div>
        </div>

        {/* Countdown */}
        <div className="bg-white rounded-2xl border-2 border-[#E8D9CC] p-5 mb-5">
          <p className="text-xs font-black uppercase tracking-widest text-[#8A6F5E] mb-4">Countdown</p>
          <CountdownDisplay date={list.date} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total", value: list.items.length, color: "#1C1108" },
            { label: "Available", value: available, color: "#E8391E" },
            { label: "Claimed", value: claimed, color: "#2A7A2A" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border-2 border-[#E8D9CC] p-3.5">
              <p className="text-xl font-black mb-0.5" style={{ fontFamily: "'Fraunces', serif", color: s.color }}>{s.value}</p>
              <p className="text-xs font-semibold text-[#8A6F5E]">{s.label}</p>
            </div>
          ))}
        </div>

        <p className="text-xs font-black uppercase tracking-widest text-[#8A6F5E] mb-4">Gift ideas</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
          {list.items.map((item) => (
            <GiftCard key={item.id} item={item} isOwner />
          ))}
        </div>

        <AddItemForm onAdd={(item) => onUpdate({ ...list, items: [...list.items, item] })} />
      </div>
    </div>
  );
}

// ─── Public View ──────────────────────────────────────────────────────────────

function PublicView({ list }: { list: GiftList }) {
  const [claimItem, setClaimItem] = useState<GiftItem | null>(null);
  const [items, setItems] = useState(list.items);
  const claimed = items.filter((i) => i.claimed).length;
  const pct = items.length ? Math.round((claimed / items.length) * 100) : 0;
  const firstName = list.owner.split(" ")[0];

  function handleClaim() {
    if (!claimItem) return;
    setItems((p) => p.map((i) => i.id === claimItem.id ? { ...i, claimed: true } : i));
    setClaimItem(null);
  }

  return (
    <div className="min-h-screen bg-[#FEF6EE]">
      <div className="bg-[#FFCD3C] text-[#1C1108] text-xs font-bold text-center py-2.5 px-4 flex items-center justify-center gap-1.5">
        <Lock size={11} /> Friend view — claims stay private from {firstName}
      </div>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <EventBadge type={list.type} />
          <h1 className="text-3xl font-black text-[#1C1108] mt-3 mb-1.5" style={{ fontFamily: "'Fraunces', serif" }}>{list.title}</h1>
          <p className="text-sm text-[#8A6F5E] mb-6">
            {list.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
          <div className="flex justify-center">
            <CountdownDisplay date={list.date} />
          </div>
        </div>

        {items.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-[#E8D9CC] p-5 mb-6">
            <div className="flex justify-between text-sm font-bold mb-2">
              <span className="text-[#8A6F5E]">{claimed} of {items.length} gifts taken</span>
              <span style={{ color: "#2A7A2A" }}>{pct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-[#F5EDE4] overflow-hidden">
              <div className="h-full rounded-full bg-[#E8391E] transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.map((item) => (
            <GiftCard key={item.id} item={item} isOwner={false} onClaim={setClaimItem} />
          ))}
        </div>

        <div className="mt-10 text-center border-t-2 border-[#E8D9CC] pt-8">
          <p className="text-xs text-[#8A6F5E] mb-2">Shared with</p>
          <p className="text-xl font-black text-[#1C1108]" style={{ fontFamily: "'Fraunces', serif" }}>
            Givy
          </p>
          <p className="text-xs text-[#8A6F5E] mt-1">Make your own free list anytime</p>
        </div>
      </div>

      {claimItem && (
        <PurchaseModal item={claimItem} listOwner={list.owner} onClose={() => setClaimItem(null)} onClaim={handleClaim} />
      )}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const router = useRouter();
  const [view, setView] = useState<View>("landing");
  const [lists, setLists] = useState<GiftList[]>(initialLists);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const activeList = lists.find((l) => l.id === activeId) ?? null;

  function selectList(list: GiftList) {
    setActiveId(list.id);
    setView("list-detail");
  }

  function updateList(updated: GiftList) {
    setLists((prev) => prev.map((l) => l.id === updated.id ? updated : l));
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Toaster
        position="top-center"
        toastOptions={{ style: { background: "#fff", color: "#1C1108", border: "2px solid #E8D9CC", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 } }}
      />

      {view === "landing" && (
        <Landing
          onEnter={() => setView("dashboard")}
          onGetStarted={() => router.push("/login")}
        />
      )}

      {view === "dashboard" && (
        <>
          <NavBar showUser />
          <Dashboard lists={lists} onSelect={selectList} onNew={() => setShowCreate(true)} />
        </>
      )}

      {view === "list-detail" && activeList && (
        <>
          <NavBar onBack={() => setView("dashboard")} showUser />
          <ListDetail list={activeList} onUpdate={updateList} onPublicView={() => setView("public-view")} />
        </>
      )}

      {view === "public-view" && activeList && (
        <>
          <NavBar onBack={() => setView("list-detail")} isPublic />
          <PublicView list={activeList} />
        </>
      )}

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={(l) => { setLists((p) => [...p, l]); }}
        />
      )}
    </div>
  );
}
