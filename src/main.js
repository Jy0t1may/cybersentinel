import React, { useState, useMemo, useCallback } from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";
import newsData from "../data/news.json" assert { type: "json" };
import certRows from "../data/cert-seed-dataset.json" assert { type: "json" };

const CERTS = certRows.map((row, index) => ({
  id: row.acronym || `cert-${index}`,
  acronym: row.acronym,
  name: row.full_name,
  domain: row.main_domain,
  skillRow: row.skill_row,
  url: row.official_url,
  notes: row.cost_notes,
}));

function NewsShell() {
  const [source, setSource] = useState("all");
  const sources = newsData.sources;
  const filtered = useMemo(
    () =>
      newsData.articles.filter((a) => (source === "all" ? true : a.source === source)),
    [source]
  );

  return (
    <section className="shell" aria-label="Cybersecurity news">
      <h1>Stay current with the signal, not the noise.</h1>
      <p>
        CyberSentinel pulls three trusted security newsletters into a simple feed so you can scan the latest stories and jump straight to the source.
      </p>

      <div style={{ marginTop: "1.25rem", display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
        <button className="tab" aria-pressed={source === "all"} onClick={() => setSource("all")}>
          All sources
        </button>
        {sources.map((s) => (
          <button
            key={s.id}
            className="tab"
            aria-pressed={source === s.id}
            onClick={() => setSource(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="grid" aria-label="Stories">
        {filtered.map((a, i) => (
          <article key={a.id} className="card">
            {i === 0 && <div className="badge">Newest</div>}
            <h3>{a.title}</h3>
            <p style={{ fontSize: ".86rem", marginTop: ".25rem" }}>{a.extract}</p>
            <span className="source-pill">{a.sourceName}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function CertificationsShell() {
  const [basket, setBasket] = useState(() => new Set());

  const toggle = useCallback((id) => {
    setBasket((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const basketList = useMemo(
    () => CERTS.filter((c) => basket.has(c.id)).sort((a, b) => (a.skillRow || "").localeCompare(b.skillRow || "")),
    [basket]
  );

  return (
    <section className="shell" aria-label="Certification roadmap planner">
      <h1>Build a certification roadmap you can actually finish.</h1>
      <p>
        Browse certifications from Paul Jerimy's Security Certification Roadmap, drop the ones that fit your path into a basket, and let the sidebar
        sort them into a sequence.
      </p>

      <div className="cert-main">
        <div>
          {CERTS.map((c) => {
            const selected = basket.has(c.id);
            return (
              <article key={c.id} className="cert-card">
                <h3>{c.name}</h3>
                <div className="cert-meta">
                  <span>{c.acronym}</span> · <span>{c.domain}</span>
                  {c.skillRow && <span>{" · Row " + c.skillRow}</span>}
                </div>
                <p style={{ fontSize: ".8rem", minHeight: "2.4rem" }}>{c.notes}</p>
                <div className="cert-actions">
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                    View details ↗
                  </a>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => toggle(c.id)}
                  >
                    {selected ? "Remove" : "Add to roadmap"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="basket">
          <h2>Your roadmap</h2>
          <p>
            {basketList.length === 0
              ? "Pick certifications to see them here."
              : `${basketList.length} certification${basketList.length > 1 ? "s" : ""} selected.`}
          </p>
          <ul>
            {basketList.map((c) => (
              <li key={c.id}>
                <span>
                  {c.name}
                  <br />
                  <span style={{ fontSize: ".75rem", color: "#9ca3af" }}>
                    {c.acronym} · {c.domain}
                    {c.skillRow && ` · Row ${c.skillRow}`}
                  </span>
                </span>
                <button type="button" onClick={() => toggle(c.id)} aria-label="Remove from roadmap">
                  ×
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-ghost" disabled={basketList.length === 0}>
            Generate roadmap PDF
          </button>
        </aside>
      </div>
    </section>
  );
}

function App() {
  const [tab, setTab] = useState("news");

  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead__in">
          <a href="#" className="brand" aria-label="CyberSentinel home">
            <span>🛡️</span>
            <span>CyberSentinel</span>
          </a>
          <nav className="tabs" aria-label="Main sections">
            <button className="tab" aria-pressed={tab === "news"} onClick={() => setTab("news")}>
              News
            </button>
            <button className="tab" aria-pressed={tab === "certs"} onClick={() => setTab("certs")}>
              Certifications
            </button>
          </nav>
        </div>
      </header>
      {tab === "news" ? <NewsShell /> : <CertificationsShell />}
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);
