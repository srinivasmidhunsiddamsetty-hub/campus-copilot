import type { CardCategory } from "@/lib/types";

// Accent color + icon background tint per category (drives the .ci chip on each card).
export const CATEGORY_STYLE: Record<
  CardCategory,
  { iconColor: string; iconBg: string }
> = {
  dining: { iconColor: "#ea7317", iconBg: "rgba(251,146,60,0.12)" },
  maintenance: { iconColor: "#1e407c", iconBg: "rgba(30,64,124,0.08)" },
  health: { iconColor: "#ef4444", iconBg: "rgba(239,68,68,0.09)" },
  transportation: { iconColor: "#1e407c", iconBg: "rgba(30,64,124,0.08)" },
  recreation: { iconColor: "#16a34a", iconBg: "rgba(34,197,94,0.10)" },
  clubs: { iconColor: "#a855f7", iconBg: "rgba(168,85,247,0.09)" },
};

// Map a free-text quick-chip label to the message we send to the AI.
export const QUICK_CHIPS: { label: string; query: string }[] = [
  { label: "Food and Dining", query: "What dining options are available on campus?" },
  { label: "Dorm Maintenance", query: "How do I submit a dorm maintenance request?" },
  { label: "Health Services", query: "How do I access health services on campus?" },
  { label: "Recreation Areas", query: "What recreation areas are available on campus?" },
  { label: "Transportation Services", query: "How do I get around campus with transportation?" },
  { label: "Clubs and Events", query: "What clubs and events are happening on campus?" },
];
