"use client";

import { useRef, useState, useEffect } from "react";
import { MicIcon, SendIcon } from "@/components/icons";

export default function InputBar({
  placeholder,
  plain = false,
  autoFocus = false,
  onSend,
}: {
  placeholder: string;
  plain?: boolean;
  autoFocus?: boolean;
  onSend: (text: string) => void;
}) {
  const [value, setValue] = useState("");
  const [micOn, setMicOn] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const micTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (autoFocus) taRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    return () => {
      if (micTimer.current) clearTimeout(micTimer.current);
    };
  }, []);

  function autoResize() {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "26px";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  function submit() {
    const v = value.trim();
    if (!v) return;
    onSend(v);
    setValue("");
    if (taRef.current) taRef.current.style.height = "26px";
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function toggleMic() {
    setMicOn(true);
    if (micTimer.current) clearTimeout(micTimer.current);
    micTimer.current = setTimeout(() => setMicOn(false), 3000);
  }

  const disabled = !value.trim();

  return (
    <div className={`in-shell${plain ? " plain" : ""}`}>
      <textarea
        ref={taRef}
        className="in-ta"
        placeholder={placeholder}
        rows={1}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          autoResize();
        }}
        onKeyDown={onKeyDown}
      />
      <button
        className="in-act"
        type="button"
        title="Voice input"
        onClick={toggleMic}
        style={micOn ? { color: "#ef4444" } : undefined}
      >
        <MicIcon />
      </button>
      <button
        className="in-act snd"
        type="button"
        title="Send"
        disabled={disabled}
        onClick={submit}
      >
        <SendIcon />
      </button>
    </div>
  );
}
