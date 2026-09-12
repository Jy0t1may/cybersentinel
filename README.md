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

## Running locally

You can run the site locally using any static file server.

1. Clone the repository:

```bash
git clone https://github.com/Jy0t1may/cybersentinel.git
cd cybersentinel
```

2. Start a simple static server, for example with Python:

```bash
python -m http.server 8000
```

3. Open the site in your browser:

```text
http://localhost:8000/index.html
```

You should see the CyberSentinel header with two tabs: **News** and **Certifications**. The News tab shows the feed; the Certifications tab shows the catalogue and roadmap basket.

## Deploying on Netlify

There is no build command required; Netlify just needs to serve the root of the repository.

On Netlify:

1. Create a new site from Git and choose this repository (`Jy0t1may/cybersentinel`).
2. Set **branch** to `main`.
3. Leave **build command** empty.
4. Set **publish directory** to `.` (the repo root).

Save and deploy. Netlify will clone the repo and serve `index.html` at your site URL.

## Updating the site

Whenever you change code or data:

```bash
git add .
git commit -m "Update CyberSentinel site"
git push origin main
```

Netlify will automatically trigger a new deploy on each push.
