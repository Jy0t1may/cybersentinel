#!/usr/bin/env python3
"""Fetch three cybersecurity feeds and normalise into a static JSON file.

This is the same architecture as before: build-time fetch → data/news.json and
news.js → static page reads its own data, never calling publishers from the
browser.
"""

import html
import json
import pathlib
import re
import sys
from datetime import datetime, timezone

import feedparser

EXTRACT_CHARS = 220
MAX_PER_SOURCE = 12
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_JSON = ROOT / "data" / "news.json"
OUT_JS = ROOT / "data" / "news.js"

SOURCES = [
    {
        "id": "tldrsec",
        "name": "tl;dr sec",
        "author": "Clint Gibler",
        "feed": "https://tldrsec.com/feed.xml",
        "home": "https://tldrsec.com/",
        "cadence": "Weekly",
        "kind": "curation",
        "blurb": "Distils ~10,000 articles a week down to the essential few. AppSec, cloud, DevSecOps, AI security.",
    },
    {
        "id": "risky",
        "name": "Risky Bulletin",
        "author": "Catalin Cimpanu",
        "feed": "https://news.risky.biz/rss/",
        "home": "https://news.risky.biz/",
        "cadence": "Daily (Mon-Fri)",
        "kind": "briefing",
        "blurb": "Dense daily threat-intel briefing: breaches, nation-state activity, cybercrime, policy.",
    },
    {
        "id": "sans",
        "name": "SANS Internet Storm Center",
        "author": "SANS handlers",
        "feed": "https://isc.sans.edu/rssfeed.xml",
        "home": "https://isc.sans.edu/diary.html",
        "cadence": "Daily",
        "kind": "primary",
        "blurb": "Practitioner diaries from SANS incident handlers: live scans, honeypot data, fresh CVEs.",
    },
]

TAG_RULES = [
    ("vulnerability", r"\b(cve-|vulnerab|0-?day|zero-?day|patch tuesday|rce|exploit|priv(ilege)? esc)"),
    ("ransomware", r"\b(ransomware|extortion|lockbit|qilin|akira|ryuk|encrypt(ed|ing) files)"),
    ("ai-security", r"\b(ai|llm|gpt|agent(ic)?|prompt inject|model|copilot|anthropic|openai)\b"),
    ("cloud", r"\b(aws|azure|gcp|kubernetes|k8s|s3 bucket|cloud|saas|terraform|iam role)\b"),
    ("appsec", r"\b(appsec|supply.?chain|dependenc|npm|pypi|composer|sast|dast|sbom|package)\b"),
    ("identity", r"\b(phish|mfa|sso|okta|credential|password|identity|oauth|session token|bec)\b"),
    ("malware", r"\b(malware|botnet|trojan|infostealer|backdoor|rootkit|spyware|implant|loader)\b"),
    ("policy", r"\b(cisa|nis2|gdpr|regulat|law enforcement|indict|sanction|arrest|pentagon|policy|bill|court)\b"),
    ("breach", r"\b(breach|data leak|exposed|stolen data|exfiltrat|hacked)\b"),
]

BOILERPLATE = [
    r"this newsletter is brought to you by", r"brought to you by", r"sponsored by",
    r"you can subscribe to an audio version", r"you can hear a podcast",
    r"your weekly dose of", r"this week'?s edition is",
    r"subscribe to (our|the) (podcast|newsletter)",
    r"is written by [A-Z][a-z]+ [A-Z][a-z]+ and edited by",
    r"^photo by .{0,60}? on (unsplash|pexels)",
]
SPONSOR_RX = re.compile(r"(?is)(" + "|".join(BOILERPLATE) + r")")

TITLE_CLEANERS = [
    (re.compile(r"^\s*\[tl;dr sec\]\s*"), ""),
    (re.compile(r"^\s*Risky Bulletin:\s*"), ""),
    (re.compile(r"^\s*Srsly Risky Biz:\s*"), "Srsly Risky Biz \u2014 "),
    (re.compile(r",?\s*\((Mon|Tue|Wed|Thu|Fri|Sat|Sun),?[^)]*\)\s*$"), ""),
]

TAG_RX = [(name, re.compile(pat, re.I)) for name, pat in TAG_RULES]


def strip_html(raw: str) -> str:
    raw = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", raw or "")
    raw = re.sub(r"(?s)<[^>]+>", " ", raw)
    return re.sub(r"\s+", " ", html.unescape(raw)).strip()


def clean_title(t: str) -> str:
    t = strip_html(t)
    for rx, repl in TITLE_CLEANERS:
        t = rx.sub(repl, t)
    return t.strip(" -\u2013\u2014")


def make_extract(text: str) -> str:
    text = strip_html(text)
    for _ in range(4):
        hit = SPONSOR_RX.search(text[:420])
        if not hit:
            break
        tail = text[hit.start():]
        nxt = re.search(r"(?<=[.!?])\s+(?=[A-Z\u201c])", tail[:700])
        text = re.sub(r"\s+", " ", (text[:hit.start()] + " " + (tail[nxt.end():] if nxt else "")).strip())
    text = re.sub(r"^[\s.,;:\u2014\u2013-]+", "", text)

    if len(text) <= EXTRACT_CHARS:
        return text
    cut = text[:EXTRACT_CHARS]
    stop = max(cut.rfind(". "), cut.rfind("! "), cut.rfind("? "))
    if stop > EXTRACT_CHARS * 0.55:
        return cut[:stop + 1].strip()
    space = cut.rfind(" ")
    return (cut[:space] if space > 0 else cut).rstrip(" ,;:-\u2013\u2014") + "\u2026"


def read_time(text: str) -> int:
    return max(1, round(len(text.split()) / 220))


def find_tags(title: str, body: str) -> list:
    hay = (title + " " + body).lower()
    return [name for name, rx in TAG_RX if rx.search(hay)][:3]


def first_image(entry) -> str:
    for m in entry.get("media_content", []) or []:
        if m.get("url"):
            return m["url"]
    for l in entry.get("links", []) or []:
        if (l.get("type") or "").startswith("image/") and l.get("href"):
            return l["href"]
    blob = ""
    if entry.get("content"):
        blob = entry["content"][0].get("value", "")
    blob = blob or entry.get("summary", "")
    m = re.search(r'<img[^>]+src=["\']([^"\']+)', blob or "", re.I)
    return m.group(1) if m else ""


def published_iso(entry) -> str:
    for key in ("published_parsed", "updated_parsed"):
        tp = entry.get(key)
        if tp:
            return datetime(*tp[:6], tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def slug(source_id: str, link: str) -> str:
    tail = re.sub(r"[^a-z0-9]+", "-", link.lower().rstrip("/").rsplit("/", 1)[-1])[:48]
    return (source_id + "-" + tail).strip("-")


def main() -> int:
    articles, ok_sources = [], 0

    for src in SOURCES:
        parsed = feedparser.parse(src["feed"], agent="CyberSentinel/1.0 (+student project)")
        entries = parsed.entries or []
        if not entries:
            print(f"[warn] {src['name']}: 0 entries")
            continue
        ok_sources += 1

        taken = 0
        for e in entries:
            if taken >= MAX_PER_SOURCE:
                break
            link = (e.get("link") or "").strip()
            title = clean_title(e.get("title") or "")
            if not link or not title:
                continue

            dek = e.get("summary") or e.get("description") or ""
            full = e["content"][0].get("value", "") if e.get("content") else ""
            extract = make_extract(dek) or make_extract(full)
            if not extract or len(extract) < 40:
                continue

            articles.append({
                "id": slug(src["id"], link),
                "source": src["id"],
                "sourceName": src["name"],
                "title": title,
                "url": link,
                "extract": extract,
                "published": published_iso(e),
                "readMinutes": read_time(strip_html(full or dek)),
                "tags": find_tags(title, extract),
                "image": first_image(e),
            })
            taken += 1

        print(f"[ok]   {src['name']}: {taken} items")

    if not articles:
        print("[fail] no articles from any source")
        return 1

    articles.sort(key=lambda a: a["published"], reverse=True)

    payload = {
        "fetchedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "extractCharLimit": EXTRACT_CHARS,
        "sourcesOk": ok_sources,
        "sources": [{k: s[k] for k in ("id", "name", "author", "home", "cadence", "kind", "blurb")} for s in SOURCES],
        "articles": articles,
    }

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, indent=1, ensure_ascii=False), encoding="utf-8")
    OUT_JS.write_text("window.__NEWS__ = " + json.dumps(payload, ensure_ascii=False) + ";\n", encoding="utf-8")
    print(f"wrote {OUT_JSON} and {OUT_JS} ({len(articles)} articles)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
