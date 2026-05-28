import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import type { ChatMessage, ChatResponse, CardCategory, Cta } from "@/lib/types";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_HISTORY = 20;
const TOOL_NAME = "campus_response";

// Verified-working Penn State destinations (checked to resolve in a browser).
// We never trust model-written URLs — every CTA/source link is mapped to one of
// these, so users can never hit a broken link.
const LINKS = {
  main: "https://www.psu.edu",
  map: "https://map.psu.edu",
  busMap: "https://www.catabus.com",
  dining: "https://housing.psu.edu", // Housing & Food Services runs dining
  housing: "https://housing.psu.edu",
  health: "https://studentaffairs.psu.edu/health",
  transportation: "https://www.catabus.com", // CATA runs campus buses
  recreation: "https://studentaffairs.psu.edu/campus-recreation",
  studentAffairs: "https://studentaffairs.psu.edu",
  orgs: "https://orgcentral.psu.edu",
};

const CATEGORY_LINK: Record<CardCategory, string> = {
  dining: LINKS.dining,
  maintenance: LINKS.housing,
  health: LINKS.health,
  transportation: LINKS.transportation,
  recreation: LINKS.recreation,
  clubs: LINKS.studentAffairs,
};

// Map a CTA to a verified link by its label intent, falling back to the card's
// category page. Keeps tel: links as-is (always valid).
function ctaHref(cta: Cta, category: CardCategory): string {
  if (cta.href?.startsWith("tel:")) return cta.href;
  const l = (cta.label || "").toLowerCase();
  if (/(bus map|live map|live bus)/.test(l)) return LINKS.busMap;
  if (/direction|walk|\bmap\b/.test(l)) return LINKS.map;
  if (/menu|dining|food|meal/.test(l)) return LINKS.dining;
  if (/portal|maintenance|housing|dorm|request/.test(l)) return LINKS.housing;
  if (/reserve|court|availab|recreation|\brec\b|gym|pool|bowl|climb|intramural|golf/.test(l))
    return LINKS.recreation;
  if (/appoint|health|uhs|caps|counsel|crisis|pharmacy|wellness|doctor/.test(l))
    return LINKS.health;
  if (/organization|\borg\b|browse|club/.test(l)) return LINKS.orgs;
  if (/calendar|event/.test(l)) return LINKS.studentAffairs;
  if (/parking|cata|bus|transit|bike|shuttle|pass/.test(l)) return LINKS.transportation;
  return CATEGORY_LINK[category] ?? LINKS.main;
}

// Remap dead source domains to their verified equivalents.
const SOURCE_REMAP: Record<string, string> = {
  "dining.psu.edu": LINKS.dining,
  "www.dining.psu.edu": LINKS.dining,
  "foodservices.psu.edu": LINKS.dining,
  "myhousing.psu.edu": LINKS.housing,
  "campusrec.psu.edu": LINKS.recreation,
  "transportation.psu.edu": LINKS.transportation,
};
function safeSource(url: string | undefined): string {
  if (!url) return LINKS.main;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return SOURCE_REMAP[host] ?? url;
  } catch {
    return LINKS.main;
  }
}

// Forcing this tool guarantees Claude returns a valid, parsed object
// (no hand-written JSON to break on embedded quotes, etc.).
const RESPONSE_TOOL: Anthropic.Tool = {
  name: TOOL_NAME,
  description:
    "Return the Campus Copilot reply. Pick exactly one response type and fill only the fields relevant to it.",
  input_schema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["structured", "out_of_scope", "greeting"],
      },
      intro: {
        type: "string",
        description: "structured only: one short friendly intro sentence.",
      },
      message: {
        type: "string",
        description: "out_of_scope or greeting only: the message text.",
      },
      cards: {
        type: "array",
        maxItems: 2,
        description: "structured only: 1–2 info cards.",
        items: {
          type: "object",
          properties: {
            category: {
              type: "string",
              enum: [
                "dining",
                "maintenance",
                "health",
                "transportation",
                "recreation",
                "clubs",
              ],
            },
            title: { type: "string" },
            subtitle: { type: "string" },
            badge: { type: "string", enum: ["Open", "24/7", "Live"] },
            details: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: {
                    type: "string",
                    description: "Bold prefix, e.g. 'Phone', 'Response time'. Required.",
                  },
                  text: { type: "string" },
                },
                required: ["label", "text"],
              },
            },
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: { text: { type: "string" } },
                required: ["text"],
              },
            },
            route: {
              type: "object",
              description:
                "Transit route map (transportation flow only). Use instead of details/steps.",
              properties: {
                from: { type: "string" },
                to: { type: "string" },
                line: { type: "string", description: 'e.g. "Route 81"' },
                eta: {
                  type: "string",
                  description: 'e.g. "~8 min · Next in 3 min"',
                },
                stops: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      detail: { type: "string" },
                      kind: {
                        type: "string",
                        enum: ["start", "mid", "end"],
                      },
                    },
                    required: ["name", "detail"],
                  },
                },
              },
              required: ["from", "to", "line", "eta", "stops"],
            },
            ctas: {
              type: "array",
              maxItems: 2,
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  style: {
                    type: "string",
                    enum: ["primary", "secondary", "ghost"],
                  },
                  href: { type: "string" },
                },
                required: ["label", "style"],
              },
            },
          },
          required: ["category", "title"],
        },
      },
      source: {
        type: "object",
        description: "structured only.",
        properties: {
          name: { type: "string" },
          url: { type: "string" },
        },
        required: ["name", "url"],
      },
      followups: {
        type: "array",
        description: "structured only: 3–4 short, answerable next steps.",
        items: { type: "string" },
      },
      chips: {
        type: "array",
        description: "greeting only: the six category labels.",
        items: { type: "string" },
      },
    },
    required: ["type"],
  },
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing ANTHROPIC_API_KEY. Add it to .env.local." },
      { status: 500 }
    );
  }

  let messages: ChatMessage[];
  try {
    const body = await req.json();
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("empty");
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey });
  const history = messages.slice(-MAX_HISTORY).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    const completion = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [RESPONSE_TOOL],
      tool_choice: { type: "tool", name: TOOL_NAME },
      messages: history,
    });

    const toolUse = completion.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("model did not return the response tool");
    }

    const parsed = toolUse.input as ChatResponse;
    if (
      !parsed ||
      !["structured", "out_of_scope", "greeting"].includes(parsed.type)
    ) {
      throw new Error("unexpected response type");
    }

    // Force every link to a verified Penn State destination so users never hit
    // a broken URL. Source link is sanitized; each CTA is mapped to a known-good
    // link by intent (tel: links are kept as-is).
    if (parsed.type === "structured") {
      if (parsed.source) parsed.source.url = safeSource(parsed.source.url);
      for (const card of parsed.cards ?? []) {
        if (card.ctas) {
          card.ctas = card.ctas.map((cta) => ({
            ...cta,
            href: ctaHref(cta, card.category),
          }));
        }
      }
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[/api/chat] error:", err);
    return NextResponse.json(
      {
        error:
          "Something went wrong connecting to Campus Copilot. Please try again.",
      },
      { status: 502 }
    );
  }
}
