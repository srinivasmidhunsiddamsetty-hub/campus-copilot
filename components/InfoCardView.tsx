import type { InfoCard, BadgeLabel, CtaStyle, Cta } from "@/lib/types";
import { CATEGORY_STYLE } from "@/lib/categories";
import { CategoryIcon } from "@/components/icons";

function badgeClass(badge: BadgeLabel): string {
  return badge === "Live" ? "li" : "bo";
}

function ctaClass(style: CtaStyle): string {
  if (style === "primary") return "pr";
  if (style === "secondary") return "se";
  return "gh";
}

function CtaButtons({ ctas }: { ctas: Cta[] }) {
  if (ctas.length === 0) return null;
  return (
    <div className="ca">
      {ctas.map((c, i) => {
        const cls = `ab ${ctaClass(c.style)}`;
        const isHttp = c.href?.startsWith("http");
        return c.href ? (
          <a
            className={cls}
            href={c.href}
            key={i}
            {...(isHttp ? { target: "_blank", rel: "noreferrer" } : {})}
          >
            {c.label}
          </a>
        ) : (
          <button className={cls} type="button" key={i}>
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

function BusMini() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={13}
      height={13}
      style={{ verticalAlign: -2, marginRight: 3 }}
    >
      <rect x="2" y="3" width="20" height="16" rx="2" />
      <path d="M2 9h20M7 19v2M17 19v2M7 13h.01M17 13h.01" />
    </svg>
  );
}

export default function InfoCardView({ card }: { card: InfoCard }) {
  const ctas = (card.ctas ?? []).slice(0, 2);

  // ── Transit route map ──
  if (card.route) {
    const r = card.route;
    return (
      <div className="rcard">
        <div className="rmap">
          <div className="rline">
            <div className="rdot s" />
            <div className="rdash" />
            <div className="rdot e" />
          </div>
          <div className="rmap-from">{r.from}</div>
          <div className="rmap-to">{r.to}</div>
        </div>
        <div className="cb">
          <div className="route-meta">
            <span className="busb">
              <BusMini />
              {r.line}
            </span>
            <span className="route-eta">{r.eta}</span>
          </div>
          <div className="stopl">
            {r.stops.map((s, i) => (
              <div
                className={`stopi${
                  s.kind === "start" ? " act" : s.kind === "end" ? " dst" : ""
                }`}
                key={i}
              >
                <div>
                  <div className="snm">{s.name}</div>
                  <div className="ssb">{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <CtaButtons ctas={ctas} />
      </div>
    );
  }

  // ── Standard info card ──
  const style = CATEGORY_STYLE[card.category] ?? CATEGORY_STYLE.dining;
  return (
    <div className="icard">
      <div className="ch">
        <div
          className="ci"
          style={{ background: style.iconBg, color: style.iconColor }}
        >
          <CategoryIcon category={card.category} />
        </div>
        <div>
          <div className="ct">{card.title}</div>
          {card.subtitle && <div className="cs">{card.subtitle}</div>}
        </div>
        {card.badge && (
          <span className={`cbadge ${badgeClass(card.badge)}`}>
            {card.badge}
          </span>
        )}
      </div>

      <div className="cb">
        {card.steps && card.steps.length > 0 ? (
          <div className="stepl">
            {card.steps.map((s, i) => (
              <div className="stepi" key={i}>
                <div className="stepn">{i + 1}</div>
                <div className="stepc">{s.text}</div>
              </div>
            ))}
          </div>
        ) : (
          (card.details ?? []).map((d, i) => (
            <div className="cd" key={i}>
              {d.label ? (
                <>
                  <strong>{d.label}:</strong> {d.text}
                </>
              ) : (
                d.text
              )}
            </div>
          ))
        )}
      </div>

      <CtaButtons ctas={ctas} />
    </div>
  );
}
