# Muhammad Yousuf — Graphic Design Portfolio

A 3D, graphic-design-first portfolio built with **Vite**, **Three.js**, **GSAP** and **Lenis**.

- Draggable 3D ring of project posters around an iridescent liquid-chrome blob (click a poster to open it)
- Kinetic display type, scroll-reactive marquees, custom cursor, film grain
- Filterable project grid with 3D tilt cards; each project opens a case-study sheet with brief, approach, palette (click a swatch to copy its hex), typography and deliverables
- Design principles, services, craft (typography, colour, grid, print) with toolkit, experience timeline, process
- Contact opens a Gmail compose window; headlines auto-fit their column so nothing overflows on phones

## AI chatbot (Yusi)

A Gemini-powered assistant that answers questions about Yousuf's work in English or Roman Urdu, with a bit of humour. It can open project case studies and link to the Gmail contact.

- Persona, facts and rules: the system prompt in `server/chat.js` (project facts are pulled from `src/projects.js` automatically)
- Vercel function: `api/chat.js` — the API key never reaches the browser
- Local dev: `vite.config.js` serves `/api/chat` with the same handler

Setup: copy `.env.example` to `.env` and set `GEMINI_API_KEY` (from Google AI Studio). On Vercel, add `GEMINI_API_KEY` under Project → Settings → Environment Variables and redeploy. Optional `GEMINI_MODEL` pins a model; the default is `gemini-flash-lite-latest` (fastest on the free tier) with `gemini-flash-latest` as fallback.

## Develop

```bash
npm install
npm run dev
```

## Deploy on Vercel

Import this repo in Vercel. It detects Vite automatically:

- Build command: `npm run build`
- Output directory: `dist`

## Edit content

- Projects: `src/projects.js` (artwork lives in `public/work/*.svg`, one file per project slug)
- Contact email: `EMAIL` at the top of `src/main.js` (and the visible address in `index.html`)
- Copy and sections: `index.html`
- Colours and type: CSS variables at the top of `src/style.css`; v2 sections in `src/sections.css`
