import { useMemo } from "react";
import { useNews } from "../../core/fta/store";

type Props = { countryIso3: string | null };

export default function RegNewsPanel({ countryIso3 }: Props) {
  const all = useNews();
  const items = useMemo(
    () => all.filter((n) => !countryIso3 || n.countryIso3 === countryIso3),
    [all, countryIso3]
  );

  if (!items.length) {
    return (
      <div className="text-sm text-muted">
        No recent regulatory items for this selection.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((n) => (
        <a
          key={n.id}
          href={n.link}
          target="_blank"
          rel="noreferrer"
          className="panel block rounded-2xl p-3 transition hover:border-[var(--accent)]"
        >
          <div className="text-xs uppercase tracking-wide text-muted">{n.source}</div>
          <div className="font-semibold">{n.title}</div>
          <div className="text-xs text-muted">
            {new Date(n.published).toLocaleString()}
          </div>
        </a>
      ))}
    </div>
  );
}
