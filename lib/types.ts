// ── Campus Copilot AI response contract ──
// The Claude API returns exactly one of these shapes as raw JSON.

export type CardCategory =
  | "dining"
  | "maintenance"
  | "health"
  | "transportation"
  | "recreation"
  | "clubs";

export type BadgeLabel = "Open" | "24/7" | "Live";

export type CtaStyle = "primary" | "secondary" | "ghost";

export interface DetailRow {
  /** Bold label prefix, e.g. "Breakfast" → renders "Breakfast: <text>". Optional. */
  label?: string;
  text: string;
}

export interface Step {
  text: string;
}

export interface Cta {
  label: string;
  style: CtaStyle;
  /** https:// or tel: link. If absent, renders as a non-navigating button. */
  href?: string;
}

export interface RouteStop {
  name: string;
  /** e.g. "Your stop · Departs 9:42 PM", "2 min", "8 min · Your destination" */
  detail: string;
  kind?: "start" | "mid" | "end";
}

export interface RouteInfo {
  from: string;
  to: string;
  /** e.g. "Route 81" */
  line: string;
  /** e.g. "~8 min · Next in 3 min" */
  eta: string;
  stops: RouteStop[];
}

export interface InfoCard {
  category: CardCategory;
  title: string;
  /** Location / context line under the title. */
  subtitle?: string;
  badge?: BadgeLabel;
  /** Detail rows. Use one of details / steps / route per card. */
  details?: DetailRow[];
  /** Numbered procedural steps (e.g. how to submit a request). */
  steps?: Step[];
  /** Transit route map (transportation flow). Renders instead of details/steps. */
  route?: RouteInfo;
  /** Max 2 distinct actions. */
  ctas?: Cta[];
}

export interface Source {
  name: string;
  url: string;
}

export interface StructuredResponse {
  type: "structured";
  intro: string;
  cards: InfoCard[];
  source: Source;
  /** 3–4 short, contextually relevant next-step suggestions. */
  followups: string[];
}

export interface OutOfScopeResponse {
  type: "out_of_scope";
  message: string;
}

export interface GreetingResponse {
  type: "greeting";
  message: string;
  /** Category suggestions to guide the user. */
  chips: string[];
}

export type ChatResponse =
  | StructuredResponse
  | OutOfScopeResponse
  | GreetingResponse;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
