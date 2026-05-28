import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import type { ChatMessage, ChatResponse } from "@/lib/types";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_HISTORY = 20;

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
      messages: [
        ...history,
        // Prefill an open brace to force raw-JSON output.
        { role: "assistant", content: "{" },
      ],
    });

    const block = completion.content[0];
    const text = block && block.type === "text" ? block.text : "";
    const raw = "{" + text; // re-attach the prefilled brace

    let parsed: ChatResponse;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Last-ditch: extract the outermost JSON object.
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("malformed JSON from model");
      parsed = JSON.parse(match[0]);
    }

    if (
      !parsed ||
      !["structured", "out_of_scope", "greeting"].includes(parsed.type)
    ) {
      throw new Error("unexpected response type");
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
