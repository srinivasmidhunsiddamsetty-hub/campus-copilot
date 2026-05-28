import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import type { ChatMessage, ChatResponse } from "@/lib/types";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_HISTORY = 20;
const TOOL_NAME = "campus_response";

// Hosts we know resolve. Any CTA link is normalized to one of these origins
// (or a tel: link) so users never hit a broken/404 link.
const KNOWN_PSU_HOSTS = new Set([
  "psu.edu",
  "www.psu.edu",
  "dining.psu.edu",
  "housing.psu.edu",
  "myhousing.psu.edu",
  "studentaffairs.psu.edu",
  "transportation.psu.edu",
  "campusrec.psu.edu",
  "map.psu.edu",
  "libraries.psu.edu",
  "pennstatelearning.psu.edu",
]);

// Guarantee a CTA link is safe: keep tel: links; map known PSU hosts to their
// origin (dropping invented deep paths that could 404); otherwise fall back to
// the response's source domain.
function safeHref(href: string | undefined, sourceUrl: string): string {
  let fallback = "https://www.psu.edu";
  try {
    fallback = new URL(sourceUrl).origin;
  } catch {}
  if (!href) return fallback;
  if (href.startsWith("tel:")) return href;
  try {
    const u = new URL(href);
    if (KNOWN_PSU_HOSTS.has(u.hostname.toLowerCase())) return u.origin;
  } catch {}
  return fallback;
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

    // Normalize every CTA link so users never hit a broken URL.
    if (parsed.type === "structured") {
      const sourceUrl = parsed.source?.url ?? "https://www.psu.edu";
      for (const card of parsed.cards ?? []) {
        for (const cta of card.ctas ?? []) {
          cta.href = safeHref(cta.href, sourceUrl);
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
