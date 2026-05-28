import type { ChatResponse } from "@/lib/types";
import InfoCardView from "@/components/InfoCardView";

export default function AIResponse({
  response,
  onChip,
}: {
  response: ChatResponse;
  onChip: (text: string) => void;
}) {
  if (response.type === "greeting") {
    return (
      <div className="aib">
        <div className="ai-intro">{response.message}</div>
        <div className="chips">
          {response.chips.map((c, i) => (
            <button className="chip" type="button" key={i} onClick={() => onChip(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (response.type === "out_of_scope") {
    return (
      <div className="aib">
        <div className="ai-intro">{response.message}</div>
      </div>
    );
  }

  // structured
  return (
    <div className="aib">
      <div className="ai-intro">{response.intro}</div>

      <div className="icards">
        {response.cards.slice(0, 2).map((card, i) => (
          <InfoCardView card={card} key={i} />
        ))}
      </div>

      {response.source && (
        <div className="src-line">
          <span className="stag-label">Source:</span>
          <a
            className="stag"
            href={response.source.url}
            target="_blank"
            rel="noreferrer"
          >
            <span className="stag-i">i</span>
            <span className="stag-name">{response.source.name}</span>
          </a>
        </div>
      )}

      {response.followups && response.followups.length > 0 && (
        <div className="chips">
          {response.followups.map((f, i) => (
            <button className="chip" type="button" key={i} onClick={() => onChip(f)}>
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
