import { Ionicons } from "@expo/vector-icons";

export type Slide = {
  icon: keyof typeof Ionicons.glyphMap;
  headline: string;
  body: string;
};

export const SLIDES: Slide[] = [
  {
    icon: "mail-unread-outline",
    headline: "Never miss\nwhat matters.",
    body: "Sift reads every email and sorts them by urgency — so a flight confirmation or a deadline never gets buried under newsletters.",
  },
  {
    icon: "bulb-outline",
    headline: "It learns what\nyou care about.",
    body: "The more you use Sift, the smarter it gets. Mark something important and Sift remembers for next time.",
  },
  {
    icon: "notifications-outline",
    headline: "You control\nthe noise.",
    body: "Set VIP senders, quiet hours, and a daily digest. Sift only interrupts you when it's actually worth it.",
  },
];
