import { useMemo, useState } from "react";
import { COUNTRIES, COUNTRY_BY_ID } from "@/data/countries";
import { EuropeMap } from "@/components/europe-map";
import { NavPills, Shell } from "@/components/shell";
import { useApp } from "@/store/app";

export function AtlasView() {
  const atlasId = useApp((s) => s.atlasId);
  const setAtlas = useApp((s) => s.setAtlas);
  const [query, setQuery] = useState("");
  const selected = atlasId ? COUNTRY_BY_ID[atlasId] : undefined;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name, "nl"));
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.capital.toLowerCase().includes(q) ||
        c.aliases.some((a) => a.toLowerCase().includes(q)),
    );
  }, [query]);

  return (
    <Shell title="Atlas" action={<NavPills />}>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="relative min-h-[46dvh] flex-1 lg:min-h-0">
          <EuropeMap
            countryState={(id) => (id === atlasId ? "atlas" : atlasId ? "dim" : "idle")}
            onCountry={(id) => setAtlas(id)}
            showCapitals={Boolean(atlasId)}
          />
        </div>
        <aside className="flex max-h-[46dvh] w-full flex-col gap-3 border-t border-border bg-bg-elevated px-4 py-4 lg:max-h-none lg:h-[calc(100dvh-56px)] lg:w-[360px] lg:border-t-0 lg:border-l">
          <label className="sr-only" htmlFor="atlas-search">
            Zoek land of hoofdstad
          </label>
          <input
            id="atlas-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek land of hoofdstad"
            className="h-11 rounded-[var(--radius-md)] bg-bg px-3 text-sm shadow-[var(--shadow-border)] outline-none focus:outline-2 focus:outline-offset-2 focus:outline-primary"
          />

          {selected && (
            <div className="rounded-[var(--radius-lg)] bg-bg p-4 shadow-[var(--shadow-border)]">
              <p className="font-display text-xl font-medium tracking-tight">{selected.name}</p>
              <p className="mt-1 text-muted">Hoofdstad: {selected.capital}</p>
            </div>
          )}

          <ul className="min-h-0 flex-1 overflow-auto">
            {filtered.map((country) => (
              <li key={country.id}>
                <button
                  type="button"
                  onClick={() => setAtlas(country.id)}
                  className="flex w-full items-baseline justify-between gap-3 rounded-[var(--radius-sm)] px-2 py-2.5 text-left hover:bg-surface"
                >
                  <span className={country.id === atlasId ? "font-medium text-primary" : "font-medium"}>
                    {country.name}
                  </span>
                  <span className="text-sm text-muted">{country.capital}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </Shell>
  );
}
