import React from "react";

// Detects http(s) URLs and bare domains (e.g. "studentaffairs.psu.edu",
// "catabus.com") inside plain text so they can be rendered as real links.
const URL_RE =
  /((?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)+(?:edu|com|org|gov|net)\b(?:\/[^\s)]*)?)/g;

/**
 * Turn URLs / bare domains in a string into clickable blue links, leaving the
 * rest of the text untouched. Used for the AI's prose replies (greetings,
 * out-of-scope declines, intros) where a referenced link would otherwise be
 * dead plain text.
 */
export function linkify(text: string): React.ReactNode {
  if (!text) return text;
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(text)) !== null) {
    let url = m[0];
    // don't swallow trailing sentence punctuation
    const trail = url.match(/[.,;:!?)]+$/);
    if (trail) url = url.slice(0, url.length - trail[0].length);
    const start = m.index;
    if (start > last) out.push(text.slice(last, start));
    const href = /^https?:\/\//i.test(url) ? url : "https://" + url;
    out.push(
      <a
        key={start}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-link"
      >
        {url}
      </a>
    );
    last = start + url.length;
    URL_RE.lastIndex = last;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
