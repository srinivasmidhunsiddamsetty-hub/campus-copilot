import type { InfoCard, BadgeLabel, CtaStyle } from "@/lib/types";
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

export default function InfoCardView({ card }: { card: InfoCard }) {
  const style = CATEGORY_STYLE[card.category] ?? CATEGORY_STYLE.dining;
  const ctas = (card.ctas ?? []).slice(0, 2);

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

      {ctas.length > 0 && (
        <div className="ca">
          {ctas.map((c, i) => {
            const cls = `ab ${ctaClass(c.style)}`;
            const isHttp = c.href?.startsWith("http");
            return c.href ? (
              <a
                className={cls}
                href={c.href}
                key={i}
                {...(isHttp
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
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
      )}
    </div>
  );
}
