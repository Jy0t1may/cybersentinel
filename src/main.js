import React, { useState, useMemo, useCallback } from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";

const e = React.createElement;

// Simple in-memory data for now.
// Later, we can replace this with fetch("/data/news.json") and fetch("/data/cert-seed-dataset.json").
const newsItems = [
  {
    id: "n1",
    title: "New critical CVE in popular VPN appliance",
    extract: "A remote code execution flaw was disclosed in a widely used VPN appliance. Patch windows are tight, and exploit details are public.",
    sourceName: "tl;dr sec",
  },
  {
    id: "n2",
    title: "Daily briefing: ransomware, supply-chain, and MFA fatigue",
    extract: "Today’s briefing covers three major ransomware incidents, a supply-chain compromise, and new MFA fatigue techniques.",
    sourceName: "Risky Bulletin",
  },
  {
    id: "n3",
    title: "SANS diary: weird scans on port 8443",
    extract: "Handlers report an uptick in scans on atypical management ports exposing misconfigured admin interfaces.",
    sourceName: "SANS ISC",
  },
];

const certs = [
  {
    id: "c1",
    acronym: "Security+",
    name: "CompTIA Security+",
    domain: "Fundamentals",
    skillRow: "1",
    url: "https://www.comptia.org/certifications/security",
    notes: "Vendor-neutral foundational security cert. Frequently used as an entry-level baseline.",
  },
  {
    id: "c2",
    acronym: "AZ-500",
    name: "Microsoft Azure Security Engineer",
    domain: "Cloud Security",
    skillRow: "2",
    url: "https://learn.microsoft.com/certifications/azure-security-engineer/",
    notes: "Focuses on securing Azure workloads: identities, storage, networking, monitoring.",
  },
  {
    id: "c3",
    acronym: "CCNA",
    name: "Cisco Certified Network Associate",
    domain: "Networking",
    skillRow: "1",
    url: "https://www.cisco.com/go/ccna",
    notes: "Networking fundamentals plus basic security concepts; strong base for blue-team roles.",
  },
  {
    id: "c4",
    acronym: "OSCP",
    name: "Offensive Security Certified Professional",
    domain: "Offensive Security",
    skillRow: "3",
    url: "https://www.offsec.com/courses/pen-200/",
    notes: "Hands-on penetration testing exam with a 24-hour lab. Advanced, not an entry-level starting point.",
  },
];

function NewsShell() {
  const [source, setSource] = useState("all");

  const uniqueSources = useMemo(
    () => Array.from(new Set(newsItems.map((n) => n.sourceName))),
    []
  );

  const filtered = useMemo(
    () => newsItems.filter((n) => (source === "all" ? true : n.sourceName === source)),
    [source]
  );

  return e(
    "section",
    { className: "shell", "aria-label": "Cybersecurity news" },
    e("h1", null, "Stay current with the signal, not the noise."),
    e(
      "p",
      null,
      "CyberSentinel pulls a small set of trusted security sources into one feed so you can scan the latest stories and jump straight to the original article."
    ),
    e(
      "div",
      { style: { marginTop: "1.25rem", display: "flex", flexWrap: "wrap", gap: ".5rem" } },
      e(
        "button",
        {
          className: "tab",
          "aria-pressed": source === "all",
          onClick: () => setSource("all"),
        },
        "All sources"
      ),
      ...uniqueSources.map((name) =>
        e(
          "button",
          {
            key: name,
            className: "tab",
            "aria-pressed": source === name,
            onClick: () => setSource(name),
          },
          name
        )
      )
    ),
    e(
      "div",
      { className: "grid", "aria-label": "Stories" },
      ...filtered.map((a, i) =>
        e(
          "article",
          { key: a.id, className: "card" },
          i === 0 &&
            e("div", { className: "badge" }, "Newest"),
          e("h3", null, a.title),
          e(
            "p",
            { style: { fontSize: ".86rem", marginTop: ".25rem" } },
            a.extract
          ),
          e("span", { className: "source-pill" }, a.sourceName)
        )
      )
    )
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
    () => certs.filter((c) => basket.has(c.id)).sort((a, b) => (a.skillRow || "").localeCompare(b.skillRow || "")),
    [basket]
  );

  return e(
    "section",
    { className: "shell", "aria-label": "Certification roadmap planner" },
    e("h1", null, "Build a certification roadmap you can actually finish."),
    e(
      "p",
      null,
      "Browse a small set of core certifications, drop the ones that fit your path into a basket, and let the sidebar sort them by difficulty row."
    ),
    e(
      "div",
      { className: "cert-main" },
      // Left: catalogue
      e(
        "div",
        null,
        ...certs.map((c) => {
          const selected = basket.has(c.id);
          return e(
            "article",
            { key: c.id, className: "cert-card" },
            e("h3", null, c.name),
            e(
              "div",
              { className: "cert-meta" },
              e("span", null, c.acronym),
              " · ",
              e("span", null, c.domain),
              c.skillRow && e("span", null, ` · Row ${c.skillRow}`)
            ),
            e(
              "p",
              { style: { fontSize: ".8rem", minHeight: "2.4rem" } },
              c.notes
            ),
            e(
              "div",
              { className: "cert-actions" },
              e(
                "a",
                {
                  href: c.url,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "btn btn-ghost",
                },
                "View details ↗"
              ),
              e(
                "button",
                {
                  type: "button",
                  className: "btn btn-primary",
                  onClick: () => toggle(c.id),
                },
                selected ? "Remove" : "Add to roadmap"
              )
            )
          );
        })
      ),
      // Right: basket
      e(
        "aside",
        { className: "basket" },
        e("h2", null, "Your roadmap"),
        e(
          "p",
          null,
          basketList.length === 0
            ? "Pick certifications to see them here."
            : `${basketList.length} certification${basketList.length > 1 ? "s" : ""} selected.`
        ),
        e(
          "ul",
          null,
          ...basketList.map((c) =>
            e(
              "li",
              { key: c.id },
              e(
                "span",
                null,
                c.name,
                e(
                  "br",
                  null
                ),
                e(
                  "span",
                  { style: { fontSize: ".75rem", color: "#9ca3af" } },
                  `${c.acronym} · ${c.domain}${c.skillRow ? ` · Row ${c.skillRow}` : ""}`
                )
              ),
              e(
                "button",
                {
                  type: "button",
                  onClick: () => toggle(c.id),
                  "aria-label": "Remove from roadmap",
                },
                "×"
              )
            )
          )
        ),
        e(
          "button",
          {
            type: "button",
            className: "btn btn-ghost",
            disabled: basketList.length === 0,
          },
          "Generate roadmap PDF"
        )
      )
    )
  );
}

function App() {
  const [tab, setTab] = useState("news");

  return e(
    "div",
    { className: "app" },
    e(
      "header",
      { className: "masthead" },
      e(
        "div",
        { className: "masthead__in" },
        e(
          "a",
          { href: "#", className: "brand", "aria-label": "CyberSentinel home" },
          e("span", null, "🛡️"),
          e("span", null, "CyberSentinel")
        ),
        e(
          "nav",
          { className: "tabs", "aria-label": "Main sections" },
          e(
            "button",
            {
              className: "tab",
              "aria-pressed": tab === "news",
              onClick: () => setTab("news"),
            },
            "News"
          ),
          e(
            "button",
            {
              className: "tab",
              "aria-pressed": tab === "certs",
              onClick: () => setTab("certs"),
            },
            "Certifications"
          )
        )
      )
    ),
    tab === "news" ? e(NewsShell) : e(CertificationsShell)
  );
}

const root = createRoot(document.getElementById("root"));
root.render(e(App));