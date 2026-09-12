# CyberSentinel

CyberSentinel is a static site for aspiring cybersecurity professionals. It gives you:

- A curated **news desk** that pulls stories from trusted security newsletters and presents them as a single, scannable feed.
- A **certification planner** based on Paul Jerimy’s Security Certification Roadmap, with a basket-style roadmap builder.

## Project structure

This repository is intentionally simple and deploys as a static site on Netlify:

```text
cybersentinel/
├── index.html            # Entry point, served at the site root
├── style.css             # Global styles
├── src/
│   └── main.js           # React app (news + certifications + basket)
└── data/
    ├── news.json         # Curated news stories (headline, short extract, link)
    └── cert-seed-dataset.json  # Normalized cert data from Paul Jerimy’s roadmap
```

The React code uses native ES modules and a CDN (`esm.sh`) for React and React DOM, so there is no bundler or build step. Netlify can serve the repository as-is.
