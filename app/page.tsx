"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatResponse, ChatMessage } from "@/lib/types";
import { QUICK_CHIPS } from "@/lib/categories";
import Sidebar from "@/components/Sidebar";
import InputBar from "@/components/InputBar";
import AIResponse from "@/components/AIResponse";
import { PanelLeftIcon, SunIcon, MoonIcon, CapIcon } from "@/components/icons";

type Msg =
  | { kind: "user"; text: string }
  | { kind: "ai"; response: ChatResponse }
  | { kind: "error"; text: string };

function toApiMessages(msgs: Msg[]): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (const m of msgs) {
    if (m.kind === "user") out.push({ role: "user", content: m.text });
    else if (m.kind === "ai")
      out.push({ role: "assistant", content: JSON.stringify(m.response) });
  }
  return out;
}

export default function Page() {
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Init theme + responsive state after mount.
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    const mql = window.matchMedia("(max-width: 680px)");
    const apply = () => {
      setIsMobile(mql.matches);
      if (mql.matches) setSidebarOpen(false);
    };
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  // Keep scrolled to the latest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  function toggleSidebar() {
    setSidebarOpen((o) => !o);
  }

  function newChat() {
    setStarted(false);
    setMessages([]);
    setTyping(false);
  }

  const sendMessage = useCallback(
    async (text: string) => {
      setStarted(true);
      if (isMobile) setSidebarOpen(false);

      const userMsg: Msg = { kind: "user", text };
      const history = toApiMessages([...messages, userMsg]);
      setMessages((prev) => [...prev, userMsg]);
      setTyping(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "request failed");
        setMessages((prev) => [
          ...prev,
          { kind: "ai", response: data as ChatResponse },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            kind: "error",
            text: "Something went wrong connecting to Campus Copilot. Please try again.",
          },
        ]);
      } finally {
        setTyping(false);
      }
    },
    [isMobile, messages]
  );

  return (
    <>
      <Sidebar open={sidebarOpen} onToggle={toggleSidebar} onNewChat={newChat} />

      {/* Mobile slide-over backdrop */}
      <div
        id="sb-overlay"
        className={sidebarOpen && isMobile ? "show" : undefined}
        onClick={toggleSidebar}
      />

      {/* Floating open button (when sidebar hidden) */}
      <button
        id="open-btn"
        className={!sidebarOpen ? "show" : undefined}
        onClick={toggleSidebar}
        title="Open sidebar"
      >
        <PanelLeftIcon />
      </button>

      <main id="main" className={!sidebarOpen ? "expand" : undefined}>
        <nav id="topnav">
          <div className="nav-sp" />
          <button className="th-btn" onClick={toggleTheme} title="Toggle theme">
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        </nav>

        {/* Welcome stage */}
        <div id="center" className={started ? "gone" : undefined}>
          <div className="app-icon">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/lion.png" alt="Campus Copilot" />
          </div>
          <h1 className="page-title">Campus Copilot</h1>
          <p className="page-sub">
            Your AI-powered guide to everything at Penn State
          </p>
          <div className="c-wrap">
            <InputBar
              placeholder="How can I help you on campus?"
              onSend={sendMessage}
            />
          </div>
          <div className="qchips">
            {QUICK_CHIPS.map((c) => (
              <div
                className="qchip"
                key={c.label}
                onClick={() => sendMessage(c.query)}
              >
                {c.label}
              </div>
            ))}
          </div>
        </div>

        {/* Chat stage */}
        <div id="chat-area" className={started ? "on" : undefined}>
          <div id="chat-scroll" className="scroll-thin" ref={scrollRef}>
            <div id="messages">
              {messages.map((m, i) => {
                if (m.kind === "user") {
                  return (
                    <div className="mrow u" key={i}>
                      <div className="bub bub-u">{m.text}</div>
                    </div>
                  );
                }
                if (m.kind === "error") {
                  return (
                    <div className="aib" key={i}>
                      <div className="ai-intro">{m.text}</div>
                    </div>
                  );
                }
                return (
                  <AIResponse
                    key={i}
                    response={m.response}
                    onChip={sendMessage}
                  />
                );
              })}

              {typing && (
                <div className="mrow">
                  <div className="av av-ai">
                    <CapIcon width={18} height={18} />
                  </div>
                  <div className="typind">
                    <div className="td" />
                    <div className="td" />
                    <div className="td" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div id="bot-bar">
            <div className="bot-wrap">
              <InputBar
                placeholder="Message Campus Copilot..."
                plain
                autoFocus={started}
                onSend={sendMessage}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile welcome bottom bar */}
      {!started && (
        <div id="mobile-bar">
          <InputBar
            placeholder="How can I help you on campus?"
            onSend={sendMessage}
          />
        </div>
      )}
    </>
  );
}
