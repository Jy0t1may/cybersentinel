import React from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";
import { LazyMotion, domAnimation, m, useReducedMotion } from "https://esm.sh/motion/react@11.11.17";

import newsData from "../data/news.json" assert { type: "json" };
import certRows from "../data/cert-seed-dataset.json" assert { type: "json" };

const loadFeatures = () => import("https://esm.sh/motion/react@11.11.17").then((m) => m.domAnimation);

function useTheme() {
  const [theme, setTheme] = React.useState(() => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  return [theme, () => setTheme((t) => (t === "dark" ? "light" : "dark"))];
}

function NewsPage() {
  const [query, setQuery] = React.useState("");
  const [source, setSource] = React.useState("all");
  const [tags, setTags] = React.useState([]);

  const sources = newsData.sources;
  const articles = newsData.articles;

  const tagCounts = React.useMemo(() => {
    const out = {};
    for (const a of articles) for (const t of a.tags) out[t] = (out[t] || 0) + 1;
    return out;
  }, [articles]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (source !== "all" && a.source !== source) return false;
      if (tags.length && !tags.every((t) => a.tags.includes(t))) return false;
      if (q) {
        const hay = `${a.title} ${a.extract} ${a.sourceName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [articles, source, tags, query]);

  return (
    <section className="news-shell" id="news">
      <header className="intro">
        <p className="intro__kicker">Iteration 01 · News desk</p>
        <h1>
          Three newsletters worth your inbox, read as <em>one page</em>.
        </h1>
        <p>
          Curation beats volume. Instead of forty feeds, CyberSentinel pulls the weekly signal digest, the daily threat briefing, and the
          practitioner diary — then gets out of the way and sends you to the source.
        </p>
      </header>

      <section className="wrap" aria-label="Sources">
        <div className="sources">
          {sources.map((s) => {
            const count = articles.filter((a) => a.source === s.id).length;
            return (
              <article key={s.id} className="srccard">
                <div className="srccard__top">
                  <h3 className="srccard__name">{s.name}</h3>
                  <span className="srccard__cadence">{s.cadence}</span>
                </div>
                <p className="srccard__by">{s.author}</p>
                <p className="srccard__blurb">{s.blurb}</p>
                <div className="srccard__foot">
                  <span className="srccard__count">{count} stories below</span>
                  <a className="tlink" href={s.home} target="_blank" rel="noopener noreferrer">
                    Subscribe ↗
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="controls wrap" aria-label="Filter news">
        <div className="controls__row">
          <div className="search">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search headlines and extracts…"
              aria-label="Search stories"
            />
          </div>
          <div className="segs" role="group" aria-label="Filter by source">
            <button className="seg" aria-pressed={source === "all"} onClick={() => setSource("all")}>All sources</button>
            {sources.map((s) => (
              <button
                key={s.id}
                className="seg"
                aria-pressed={source === s.id}
                onClick={() => setSource(s.id)}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
        <div className="chips" role="group" aria-label="Filter by topic">
          {Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([tag, count]) => {
              const on = tags.includes(tag);
              return (
                <button
                  key={tag}
                  className="chip"
                  aria-pressed={on}
                  onClick={() =>
                    setTags((cur) => (cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag]))
                  }
                >
                  {tag.replace("-", " ")} · {count}
                </button>
              );
            })}
        </div>
        <p className="resultline">
          {filtered.length} of {articles.length} stories
          {tags.length ? ` · topics: ${tags.join(" + ")}` : ""}
          {query.trim() ? ` · matching "${query.trim()}"` : ""}
        </p>
      </section>

      <section className="wrap feed" aria-label="Latest stories">
        {filtered.map((a, idx) => (
          <article key={a.id} className={"story" + (idx === 0 ? " story--lead" : "")}>
            <header className="story__head">
              <div className="story__meta">
                {idx === 0 && <span className="story__flag">Newest</span>}
                <span className="story__src">{a.sourceName}</span>
              </div>
              <div className="story__body">
                <h3 className="story__title">{a.title}</h3>
                <p className="story__extract">{a.extract}</p>
                {!!a.tags.length && (
                  <div className="story__tags">
                    {a.tags.map((t) => (
                      <span key={t} className="tag">
                        {t.replace("-", " ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </header>
          </article>
        ))}
      </section>
    </section>
  );
}

function buildCertModel(raw) {
  return raw.map((row, index) => ({
    id: row.acronym || `cert-${index}`,
    acronym: row.acronym,
    name: row.full_name,
    domain: row.main_domain,
    subDomain: row.sub_domain,
    skillRow: row.skill_row,
    url: row.official_url,
    cost: row.listed_cost_usd,
    costNotes: row.cost_notes,
    hours: row.study_hours_est,
    minutes: row.exam_minutes,
    questions: row.exam_questions,
  }));
}

const CERTS = buildCertModel(certRows);

function CertificationsPage() {
  const shouldReduce = useReducedMotion();
  const [basket, setBasket] = React.useState(() => new Set());
  const [sortKey, setSortKey] = React.useState("skillRow");
  const [filterDomain, setFilterDomain] = React.useState("all");

  const domains = React.useMemo(() => {
    const set = new Set();
    for (const c of CERTS) if (c.domain) set.add(c.domain);
    return Array.from(set).sort();
  }, []);

  const inBasket = React.useCallback((id) => basket.has(id), [basket]);

  const toggleBasket = React.useCallback((id) => {
    setBasket((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const basketList = React.useMemo(() => {
    const items = CERTS.filter((c) => basket.has(c.id));
    const key = sortKey;
    items.sort((a, b) => {
      if (key === "skillRow") return (a.skillRow || "").localeCompare(b.skillRow || "");
      if (key === "name") return (a.name || "").localeCompare(b.name || "");
      return 0;
    });
    return items;
  }, [basket, sortKey]);

  const filteredCerts = React.useMemo(() => {
    return CERTS.filter((c) => (filterDomain === "all" ? true : c.domain === filterDomain));
  }, [filterDomain]);

  const totalHours = React.useMemo(() => {
    let sum = 0;
    for (const c of basketList) {
      const h = parseFloat(c.hours || "0");
      if (!Number.isNaN(h)) sum += h;
    }
    return sum;
  }, [basketList]);

  const flyTransition = shouldReduce ? { duration: 0 } : { type: "spring", stiffness: 460, damping: 32 };

  return (
    <section className="certs-shell" id="certs">
      <header className="intro">
        <p className="intro__kicker">Iteration 02 · Certifications</p>
        <h1>Build a certification roadmap that matches your time and level.</h1>
        <p>
          Pick the certifications that make sense for your path, drop them into a basket, and let CyberSentinel sort them into a roadmap.
        </p>
      </header>

      <div className="wrap certs-layout">
        <div className="certs-main" aria-label="Certification catalogue">
          <div className="controls__row" style={{ marginBottom: "1.5rem" }}>
            <div className="segs" role="group" aria-label="Filter by domain">
              <button
                className="seg"
                aria-pressed={filterDomain === "all"}
                onClick={() => setFilterDomain("all")}
              >
                All domains
              </button>
              {domains.map((d) => (
                <button
                  key={d}
                  className="seg"
                  aria-pressed={filterDomain === d}
                  onClick={() => setFilterDomain(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="cert-grid">
            {filteredCerts.map((c) => {
              const selected = inBasket(c.id);
              return (
                <article key={c.id} className={"cert" + (selected ? " cert--selected" : "")}>
                  <header className="cert__head">
                    <h3 className="cert__name">{c.name}</h3>
                    <span className="cert__acronym">{c.acronym}</span>
                  </header>
                  <p className="cert__meta">
                    <span>{c.domain}</span>
                    {c.skillRow && <span>Row {c.skillRow}</span>}
                  </p>
                  <p className="cert__notes">{c.costNotes}</p>
                  <div className="cert__footer">
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="tlink">
                      View details ↗
                    </a>
                    <m.button
                      type="button"
                      className="btn btn--primary"
                      whileHover={shouldReduce ? undefined : { scale: 1.03 }}
                      whileTap={shouldReduce ? undefined : { scale: 0.97 }}
                      transition={flyTransition}
                      onClick={() => toggleBasket(c.id)}
                    >
                      {selected ? "Remove" : "Add to roadmap"}
                    </m.button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="certs-basket" aria-label="Roadmap basket">
          <header className="basket__head">
            <h2>Your roadmap</h2>
            <p>
              {basketList.length === 0
                ? "Pick certifications to see them appear here."
                : `${basketList.length} certification${basketList.length > 1 ? "s" : ""} in basket · ~${totalHours || "?"} study hours`}
            </p>
            <div className="basket__sort">
              <span>Sort by</span>
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                <option value="skillRow">Skill row</option>
                <option value="name">Name</option>
              </select>
            </div>
          </header>

          <ul className="basket__list">
            {basketList.map((c) => (
              <li key={c.id} className="basket__item">
                <div>
                  <div className="basket__title">{c.name}</div>
                  <div className="basket__meta">
                    <span>{c.domain}</span>
                    {c.skillRow && <span>Row {c.skillRow}</span>}
                    {c.hours && <span>{c.hours} h</span>}
                  </div>
                </div>
                <button type="button" className="basket__remove" onClick={() => toggleBasket(c.id)}>
                  ×
                </button>
              </li>
            ))}
          </ul>

          <button type="button" className="btn btn--ghost" disabled={basketList.length === 0}>
            Generate roadmap PDF
          </button>
        </aside>
      </div>
    </section>
  );
}

function AppShell() {
  const [theme, toggleTheme] = useTheme();
  const [tab, setTab] = React.useState("news");

  return (
    <LazyMotion features={loadFeatures}>
      <div className="app">
        <header className="masthead">
          <div className="masthead__in">
            <a className="brand" href="#" aria-label="CyberSentinel home">
              <span className="brand__mark" aria-hidden="true">
                <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3l10 4v8c0 6.5-4.2 11.4-10 14C10.2 26.4 6 21.5 6 15V7l10-4z" />
                  <path d="M10 16h3l2-4 2 8 2-4h3" />
                </svg>
              </span>
              <span className="brand__word">
                Cyber<em>Sentinel</em>
              </span>
            </a>
            <nav className="masthead__nav" aria-label="Primary">
              <button className="navlink" aria-pressed={tab === "news"} onClick={() => setTab("news")}>
                News
              </button>
              <button className="navlink" aria-pressed={tab === "certs"} onClick={() => setTab("certs")}>
                Certifications
              </button>
              <button className="iconbtn" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
                {theme === "dark" ? "☀" : "☾"}
              </button>
            </nav>
          </div>
        </header>

        <main>{tab === "news" ? <NewsPage /> : <CertificationsPage />}</main>
      </div>
    </LazyMotion>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<AppShell />);
